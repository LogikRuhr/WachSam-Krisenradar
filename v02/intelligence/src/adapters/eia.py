from typing import List

import requests

from .base import BaseAdapter
from ..config import settings
from ..models import GermanyRelevance, IngestionItem


class EIAAdapter(BaseAdapter):
    """EIA OpenData — Brent crude oil spot price."""

    SERIES_URL = "https://api.eia.gov/v2/seriesid/PET.RBRTE.D"
    source_label = "EIA OpenData v2 (Brent PET.RBRTE.D)"
    requires_api_key = True  # EIA_API_KEY zwingend
    output_target = "indicators"

    def __init__(self):
        super().__init__("EIA")
        self.source_class = "wirtschaftsinstitut"

    def fetch_brent(self) -> List[IngestionItem]:
        # Defensiver Key-Guard: ohne API-Key gar nicht erst anfragen (vermeidet
        # unnötige 403-Last) und den Fehlerzweig sauber als Quellfehler melden.
        if not settings.EIA_API_KEY:
            self.log_error("EIA_API_KEY nicht gesetzt — Abruf übersprungen")
            self.record_source_error(
                "wi-oel-brent", "api_key_missing",
                source_url="https://www.eia.gov/dnav/pet/hist/rbrted.htm",
            )
            return self._fallback()

        try:
            params = {
                "api_key": settings.EIA_API_KEY,
                "frequency": "daily",
                "data[0]": "value",
                "sort[0][column]": "period",
                "sort[0][direction]": "desc",
                "offset": "0",
                "length": "2",
            }
            response = requests.get(self.SERIES_URL, params=params, timeout=20)

            if response.status_code == 200:
                data = response.json().get("response", {}).get("data", [])
                if data:
                    latest = data[0]
                    previous = data[1] if len(data) > 1 else {}
                    current_value = float(latest["value"])
                    previous_value = previous.get("value")
                    previous_value = float(previous_value) if previous_value is not None else None

                    return [self.create_item(
                        title=f"Brent Rohölpreis: {current_value:.2f} USD/Barrel ({latest.get('period')})",
                        description=(
                            "EIA Brent Spot Price FOB: "
                            f"{current_value:.2f} USD pro Barrel."
                        ),
                        source_url="https://www.eia.gov/dnav/pet/hist/rbrted.htm",
                        germany_relevance=GermanyRelevance(
                            direct=False,
                            systems_affected=["energie", "mobilitaet", "finanzen"],
                            time_to_impact="wochen",
                            description=(
                                "Brent beeinflusst Kraftstoff-, Heizöl- und Transportkosten "
                                "in Deutschland mit zeitlicher Verzögerung."
                            ),
                        ),
                        methodology_tag="steep",
                        affected_systems=["energie", "mobilitaet", "finanzen"],
                        indicator_id="wi-oel-brent",
                        current_value=current_value,
                        current_value_date=latest.get("period"),
                        previous_value=previous_value,
                        previous_value_date=previous.get("period"),
                        source_stand_date=latest.get("period"),
                        source_stand_label=latest.get("period"),
                        source_period_type="date",
                    )]

            self.log_error(f"Brent fetch: Status {response.status_code}")
            self.record_source_error(
                "wi-oel-brent", f"HTTP {response.status_code}",
                source_url="https://www.eia.gov/dnav/pet/hist/rbrted.htm",
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"Brent fetch failed: {e}")
            self.record_source_error(
                "wi-oel-brent", f"fetch_error: {type(e).__name__}",
                source_url="https://www.eia.gov/dnav/pet/hist/rbrted.htm",
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        return [self.create_item(
            title="Brent Rohölpreis — Datenquelle prüfen",
            description="EIA OpenData API nicht erreichbar. Manuelle Prüfung erforderlich.",
            source_url="https://www.eia.gov/dnav/pet/hist/rbrted.htm",
            germany_relevance=GermanyRelevance(
                direct=False,
                systems_affected=["energie", "mobilitaet", "finanzen"],
                time_to_impact="wochen",
                description="Brent-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["energie", "mobilitaet", "finanzen"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_brent()
