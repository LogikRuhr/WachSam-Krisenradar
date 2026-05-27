from typing import List

import requests

from .base import BaseAdapter
from ..config import settings
from ..models import GermanyRelevance, IngestionItem


class EIAAdapter(BaseAdapter):
    """EIA OpenData — Brent crude oil spot price."""

    SERIES_URL = "https://api.eia.gov/v2/seriesid/PET.RBRTE.D"

    def __init__(self):
        super().__init__("EIA")
        self.source_class = "wirtschaftsinstitut"

    def fetch_brent(self) -> List[IngestionItem]:
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
                    )]

            self.log_error(f"Brent fetch: Status {response.status_code}")
            return self._fallback()

        except Exception as e:
            self.log_error(f"Brent fetch failed: {e}")
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
