from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import List

import requests

from .base import BaseAdapter
from ..models import GermanyRelevance, IngestionItem


# MoWaS-Kartendaten (BBK/NINA) — bundesweiter Zivilschutz-Kanal, siehe
# https://warnung.bund.de/. Live-verifiziert (Step 0): Top-Level-JSON-Array,
# jedes Objekt u. a. mit "severity" (Minor/Moderate/Severe/Extreme) und "type"
# (Alert/Update/Cancel).
NINA_MOWAS_URL = "https://warnung.bund.de/api31/mowas/mapData.json"

_SEVERITY_TO_SUGGESTION = {
    "extreme": "kritisch",
    "severe": "erhöht",
}


def _max_severity_suggestion(severities: list[str]) -> str:
    """Leitet aus der höchsten gemeldeten Severity eine Kanon-Einstufung ab.

    Extreme → kritisch, Severe → erhöht, sonst (Moderate/Minor/unbekannt/keine
    Meldungen) → beobachten.
    """
    normalized = {str(s).strip().lower() for s in severities if s}
    for key in ("extreme", "severe"):
        if key in normalized:
            return _SEVERITY_TO_SUGGESTION[key]
    return "beobachten"


class NINAAdapter(BaseAdapter):
    """NINA/BBK MoWaS — Anzahl aktiver bundesweiter Zivilschutzmeldungen."""

    source_label = "BBK MoWaS mapData (warnung.bund.de)"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("NINA")
        self.source_class = "behoerde"

    def _item_from_warnings(self, warnings: list[dict]) -> IngestionItem:
        # Plan-Amendment (Task-9-Review): "Cancel"-Einträge sind Entwarnungen,
        # keine aktiven Zivilschutzmeldungen. Eine Häufung von Entwarnungen darf
        # den Indikator nicht fälschlich Richtung "erhöht/kritisch" heben — daher
        # zählen nur Alert/Update-Einträge, Cancel wird ausgeschlossen.
        active_warnings = [w for w in warnings if w.get("type") != "Cancel"]
        count = len(active_warnings)
        severities = [w.get("severity") for w in active_warnings]
        severity = _max_severity_suggestion(severities)
        distribution = Counter(str(s).strip() for s in severities if s)
        severity_text = ", ".join(
            f"{level} ({n})" for level, n in sorted(distribution.items(), key=lambda kv: kv[1], reverse=True)
        ) or "keine"
        now_iso = datetime.now(timezone.utc).isoformat()

        if count:
            title = f"NINA/MoWaS: {count} aktive Zivilschutzmeldungen bundesweit"
            description = (
                f"Der Bund (BBK) meldet über MoWaS/NINA {count} aktive Zivilschutzmeldungen "
                f"bundesweit (ohne Entwarnungen/Cancel). Severity-Verteilung: {severity_text}. "
                "Relevanz: amtliche Zivilschutzmeldungen (u. a. Gefahrenlagen, Evakuierungen, "
                "Trinkwasser- oder Infrastrukturwarnungen) können kurzfristig Gesellschaft und "
                "Infrastruktur betreffen."
            )
        else:
            title = "NINA/MoWaS: keine aktiven Zivilschutzmeldungen im aktuellen Datensatz"
            description = (
                "Der MoWaS-Kartendatensatz (BBK/NINA) enthält aktuell keine aktiven "
                "Zivilschutzmeldungen (ohne Entwarnungen/Cancel). Die Lage bleibt "
                "beobachtungsrelevant, da sich das kurzfristig ändern kann."
            )

        return self.create_item(
            title=title,
            description=description,
            source_url=NINA_MOWAS_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["gesellschaft", "infrastruktur"],
                time_to_impact="kurzfristig",
                description="Direkter Deutschland-Bezug über den amtlichen Zivilschutz-Warnkanal MoWaS (BBK/NINA).",
            ),
            methodology_tag="steep",
            affected_systems=["gesellschaft", "infrastruktur"],
            possible_cascades=[
                {
                    "from": "zivilschutzmeldung",
                    "to": "alltag_und_infrastruktur",
                    "impact": "Aktive Zivilschutzmeldungen (MoWaS) können lokale Versorgung, Mobilität und Schutzverhalten kurzfristig beeinflussen.",
                }
            ],
            severity_suggestion=severity,
            confidence_suggestion="hoch",
            indicator_id="wi-nina-zivilschutz-de",
            current_value=float(count),
            current_value_date=now_iso,
            previous_value=None,
            previous_value_date=None,
            source_stand_date=now_iso,
            source_stand_label=now_iso,
            source_period_type="datetime",
        )

    def fetch_latest(self) -> List[IngestionItem]:
        try:
            response = requests.get(
                NINA_MOWAS_URL,
                timeout=20,
                headers={"User-Agent": "WachSam-Krisenradar/1.0"},
            )
            response.raise_for_status()
            warnings = response.json()
            if not isinstance(warnings, list):
                raise ValueError("unerwartetes MoWaS-Format: kein JSON-Array")
            return [self._item_from_warnings(warnings)]
        except Exception as exc:
            self.record_source_error(
                "wi-nina-zivilschutz-de",
                str(exc),
                source_url=NINA_MOWAS_URL,
                source_stand=None,
                observed_at=None,
                raw_value=None,
                keep_previous=True,
            )
            self.log_error(str(exc))
            return []
