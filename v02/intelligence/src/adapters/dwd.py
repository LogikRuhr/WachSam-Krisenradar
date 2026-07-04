from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import List

import requests

from .base import BaseAdapter
from ..models import GermanyRelevance, IngestionItem


DWD_WARNINGS_URL = "https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json"

_LEVEL_TO_SEVERITY = {
    0: "stabil",
    1: "beobachten",
    2: "beobachten",
    3: "erhöht",
    4: "kritisch",
    5: "eskalierend",
}


def decode_warnwetter_response(text: str) -> dict:
    """Decode DWD WarnWetter JSONP response into a Python dict."""
    payload = text.strip()
    match = re.match(r"^warnWetter\.loadWarnings\((.*)\);?$", payload, re.DOTALL)
    if match:
        payload = match.group(1)
    return json.loads(payload)


def _millis_to_iso(value: int | float | None) -> str | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()


def summarize_warnings(payload: dict) -> dict:
    warnings_by_region = payload.get("warnings") or {}
    warnings = [warning for region in warnings_by_region.values() for warning in region]
    max_level = max((int(warning.get("level") or 0) for warning in warnings), default=0)
    by_event: dict[str, int] = {}
    by_state: dict[str, int] = {}
    for warning in warnings:
        event = str(warning.get("event") or "unknown").lower()
        state = str(warning.get("stateShort") or warning.get("state") or "unknown")
        by_event[event] = by_event.get(event, 0) + 1
        by_state[state] = by_state.get(state, 0) + 1
    return {
        "generated_at": _millis_to_iso(payload.get("time")),
        "warning_count": len(warnings),
        "region_count": len(warnings_by_region),
        "max_level": max_level,
        "top_events": sorted(by_event.items(), key=lambda item: item[1], reverse=True)[:3],
        "top_states": sorted(by_state.items(), key=lambda item: item[1], reverse=True)[:5],
    }


def summarize_by_state(payload: dict) -> list[dict]:
    """Bricht die DWD-Warnungen nach Bundesland-Kürzel (`stateShort`) herunter.

    Liefert je Bundesland Warnanzahl und höchste Warnstufe, sortiert nach
    region_code. Grundlage für die Persistenz in `regional_warnings`.
    """
    warnings_by_region = payload.get("warnings") or {}
    by_state: dict[str, dict] = {}
    for region in warnings_by_region.values():
        for warning in region:
            state = str(warning.get("stateShort") or warning.get("state") or "unknown")
            level = int(warning.get("level") or 0)
            entry = by_state.setdefault(
                state, {"region_code": state, "warning_count": 0, "max_level": 0, "source": "dwd"}
            )
            entry["warning_count"] += 1
            entry["max_level"] = max(entry["max_level"], level)
    return sorted(by_state.values(), key=lambda e: e["region_code"])


class DWDAdapter(BaseAdapter):
    """DWD WarnWetter — current official warning summary for Germany."""

    source_label = "DWD WarnWetter warnings JSON"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("DWD")
        self.source_class = "behoerde"
        # Bundesland-Aufschlüsselung (Task 5) — bleibt bei Quellenfehlern stehen
        # (Stale-on-error): siehe fetch_latest()-except-Zweig.
        self.regional_records: list[dict] = []

    def _item_from_summary(self, summary: dict) -> IngestionItem:
        generated_at = summary["generated_at"]
        warning_count = summary["warning_count"]
        region_count = summary["region_count"]
        max_level = summary["max_level"]
        severity = _LEVEL_TO_SEVERITY.get(max_level, "beobachten")
        top_events = ", ".join(f"{event} ({count})" for event, count in summary["top_events"]) or "keine"
        top_states = ", ".join(f"{state} ({count})" for state, count in summary["top_states"]) or "keine"

        if warning_count:
            title = f"DWD Warnlage: {warning_count} aktive Warnungen, höchste Stufe {max_level}"
            description = (
                f"Der Deutsche Wetterdienst meldet {warning_count} aktive Warnungen "
                f"in {region_count} Warnregionen. Häufige Ereignisse: {top_events}. "
                f"Betroffene Länder/Kürzel im Datensatz: {top_states}. Relevanz: "
                "Wetterwarnungen können Mobilität, Infrastruktur, Gesundheit und "
                "lokale Versorgung kurzfristig beeinflussen."
            )
        else:
            title = "DWD Warnlage: keine aktiven Warnungen im aktuellen Datensatz"
            description = (
                "Der DWD-WarnWetter-Datensatz enthält aktuell keine aktiven Warnungen. "
                "Die Lage bleibt beobachtungsrelevant, weil Wetterereignisse kurzfristig "
                "Mobilität, Infrastruktur und Gesundheit beeinflussen können."
            )

        return self.create_item(
            title=title,
            description=description,
            source_url=DWD_WARNINGS_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["infrastruktur", "mobilitaet", "gesundheit"],
                time_to_impact="kurzfristig",
                description="Direkter Deutschland-Bezug über offizielle DWD-Warnregionen.",
            ),
            methodology_tag="steep",
            affected_systems=["infrastruktur", "mobilitaet", "gesundheit"],
            possible_cascades=[
                {
                    "from": "wetterwarnung",
                    "to": "alltag_und_infrastruktur",
                    "impact": "Amtliche Wetterwarnungen können Verkehr, Wege, lokale Versorgung und Schutzmaßnahmen beeinflussen.",
                }
            ],
            severity_suggestion=severity,
            confidence_suggestion="hoch",
            indicator_id="wi-dwd-warnings-de",
            current_value=float(max_level),
            current_value_date=generated_at,
            previous_value=None,
            previous_value_date=None,
            source_stand_date=generated_at,
            source_stand_label=generated_at,
            source_period_type="datetime",
        )

    def fetch_latest(self) -> List[IngestionItem]:
        try:
            response = requests.get(
                DWD_WARNINGS_URL,
                timeout=20,
                headers={"User-Agent": "WachSam-Krisenradar/1.0"},
            )
            response.raise_for_status()
            payload = decode_warnwetter_response(response.text)
            summary = summarize_warnings(payload)
            if summary["generated_at"] is None:
                raise ValueError("missing DWD generated timestamp")
            self.regional_records = summarize_by_state(payload)
            return [self._item_from_summary(summary)]
        except Exception as exc:
            # Stale-on-error: regional_records NICHT zurücksetzen — bei einem
            # Quellenfehler bleiben die zuletzt bekannten Werte stehen, es wird
            # in main.run_ingestion() schlicht nichts neu upserted.
            self.record_source_error(
                "wi-dwd-warnings-de",
                str(exc),
                source_url=DWD_WARNINGS_URL,
                source_stand=None,
                observed_at=None,
                raw_value=None,
                keep_previous=True,
            )
            self.log_error(str(exc))
            return []
