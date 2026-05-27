import requests
from typing import List

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance
from ..config import settings


class WarningIndicatorsAdapter(BaseAdapter):
    """Frühwarnindikatoren — echte API-Calls wo möglich, Fallback auf bekannte Werte."""

    def __init__(self):
        super().__init__("WarningIndicators")

    def fetch_brent_price(self) -> List[IngestionItem]:
        if not settings.EIA_API_KEY:
            self.log_error("EIA_API_KEY nicht gesetzt")
            return []

        try:
            response = requests.get(
                "https://api.eia.gov/v2/petroleum/pri/spt/data/",
                params={
                    "api_key": settings.EIA_API_KEY,
                    "frequency": "daily",
                    "data[0]": "value",
                    "facets[product][]": "EPCBRENT",
                    "sort[0][column]": "period",
                    "sort[0][direction]": "desc",
                    "length": 1,
                },
                timeout=15,
            )

            if response.status_code == 200:
                data = response.json()
                records = data.get("response", {}).get("data", [])
                if records:
                    price = records[0].get("value")
                    period = records[0].get("period")
                    return [self.create_item(
                        title=f"Brent Rohöl: {price} USD/bbl ({period})",
                        description=f"Aktueller Brent-Ölpreis: {price} USD/bbl.",
                        source_url="https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm",
                        germany_relevance=GermanyRelevance(
                            direct=True,
                            systems_affected=["energie", "mobilitaet", "logistik"],
                            time_to_impact="wochen",
                            description="Ölpreise beeinflussen Kraftstoff-, Heiz- und Transportkosten.",
                        ),
                        methodology_tag="steep",
                        affected_systems=["energie", "mobilitaet"],
                    )]

            self.log_error(f"EIA API: Status {response.status_code}")
            return []

        except Exception as e:
            self.log_error(f"EIA Brent fetch failed: {e}")
            return []

    def fetch_latest(self) -> List[IngestionItem]:
        items = []
        items.extend(self.fetch_brent_price())
        return items
