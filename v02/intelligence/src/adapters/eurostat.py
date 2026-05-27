from typing import List

import requests

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance


class EurostatAdapter(BaseAdapter):
    """
    Eurostat Adapter für europäische Vergleichsdaten.
    Liefert HICP-Inflation, Energiepreise, Arbeitsmarkt.
    """

    BASE_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"

    def __init__(self):
        super().__init__("Eurostat")
        self.source_class = "wirtschaftsinstitut"

    def fetch_inflation(self) -> List[IngestionItem]:
        try:
            params = {"format": "JSON", "lang": "de"}
            response = requests.get(
                f"{self.BASE_URL}/prc_hicp_midx",
                params=params,
                timeout=15,
            )

            if response.status_code == 200:
                # TODO: JSON-Response parsen und aktuelle DE-Werte extrahieren
                pass

            return [self.create_item(
                title="Eurostat HICP Inflation DE",
                description="Aktuelle Inflationsdaten aus Eurostat für Deutschland.",
                source_url="https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_midx/default/table",
                germany_relevance=GermanyRelevance(
                    direct=True,
                    systems_affected=["finanzen", "lebensmittel"],
                    time_to_impact="wochen",
                    description="Inflation beeinflusst Kaufkraft deutscher Haushalte direkt.",
                ),
                methodology_tag="steep",
                affected_systems=["finanzen", "lebensmittel"],
            )]

        except Exception as e:
            self.log_error(f"Eurostat fetch failed: {e}")
            return []

    def fetch_latest(self) -> List[IngestionItem]:
        items = []
        items.extend(self.fetch_inflation())
        return items
