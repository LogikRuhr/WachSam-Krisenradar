from __future__ import annotations

from typing import List
from urllib.parse import quote

import requests

from .base import BaseAdapter
from ..models import GermanyRelevance, IngestionItem


PEGEL_STATIONS = ("KÖLN", "KAUB", "DUISBURG-RUHRORT", "MAGDEBURG-STROMBRÜCKE")


_STATE_TO_SEVERITY = {
    "normal": "stabil",
    "unknown": "beobachten",
    "low": "beobachten",
    "high": "erhöht",
    "very_low": "erhöht",
    "very_high": "kritisch",
}


class PegelonlineAdapter(BaseAdapter):
    """Pegelonline WSV — current water levels for selected waterways."""

    BASE_URL = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations"
    source_label = "Pegelonline WSV REST API"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("Pegelonline")
        self.source_class = "behoerde"

    def _measurement_url(self, station: str) -> str:
        return f"{self.BASE_URL}/{quote(station, safe='')}/W/currentmeasurement.json"

    def _indicator_id(self, station: str) -> str:
        normalized = (
            station.lower()
            .replace("ö", "oe")
            .replace("ä", "ae")
            .replace("ü", "ue")
            .replace("ß", "ss")
            .replace("-", "-")
        )
        return f"wi-pegelonline-{normalized}"

    def _severity(self, payload: dict) -> str:
        state = (payload.get("stateMnwMhw") or payload.get("stateNswHsw") or "unknown").lower()
        return _STATE_TO_SEVERITY.get(state, "beobachten")

    def _item_for_station(self, station: str, payload: dict) -> IngestionItem:
        timestamp = payload.get("timestamp")
        value = float(payload["value"])
        severity = self._severity(payload)
        state = payload.get("stateMnwMhw") or payload.get("stateNswHsw") or "unknown"
        station_label = station.replace("-", " ").title()

        return self.create_item(
            title=f"Pegel {station_label}: {value:.0f} cm ({timestamp})",
            description=(
                f"Pegelonline meldet für {station_label} einen Wasserstand von "
                f"{value:.0f} cm. Status nach Pegelonline: {state}. Relevanz: "
                "Wasserstände können Hochwasser-, Niedrigwasser-, Logistik- und "
                "Infrastruktur-Risiken entlang wichtiger Wasserstraßen anzeigen."
            ),
            source_url=self._measurement_url(station),
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["infrastruktur", "logistik", "mobilitaet"],
                time_to_impact="kurzfristig",
                description=(
                    "Direkter Deutschland-Bezug über offizielle Messstellen der "
                    "Wasserstraßen- und Schifffahrtsverwaltung."
                ),
            ),
            methodology_tag="steep",
            affected_systems=["infrastruktur", "logistik", "mobilitaet"],
            possible_cascades=[
                {
                    "from": "wasserstand",
                    "to": "wasserstrassen_logistik",
                    "impact": "Hoch- oder Niedrigwasser kann Transporte, Pendelwege und lokale Versorgung beeinflussen.",
                }
            ],
            severity_suggestion=severity,
            confidence_suggestion="hoch",
            indicator_id=self._indicator_id(station),
            current_value=value,
            current_value_date=timestamp,
            previous_value=None,
            previous_value_date=None,
            source_stand_date=timestamp,
            source_stand_label=timestamp,
            source_period_type="datetime",
        )

    def fetch_latest(self) -> List[IngestionItem]:
        items: List[IngestionItem] = []
        for station in PEGEL_STATIONS:
            url = self._measurement_url(station)
            try:
                response = requests.get(url, timeout=20)
                response.raise_for_status()
                payload = response.json()
                if payload.get("value") is None or payload.get("timestamp") is None:
                    raise ValueError("missing value or timestamp")
                items.append(self._item_for_station(station, payload))
            except Exception as exc:
                self.record_source_error(
                    self._indicator_id(station),
                    str(exc),
                    source_url=url,
                    source_stand=None,
                    observed_at=None,
                    raw_value=None,
                    keep_previous=True,
                )
                self.log_error(f"{station}: {exc}")
        return items
