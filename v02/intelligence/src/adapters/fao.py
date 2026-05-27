from datetime import datetime
from typing import Optional, List

import requests
import pandas as pd

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance


class FAOAdapter(BaseAdapter):
    """
    FAO Food Price Index und weitere Agrardaten Adapter.
    Wichtige Quelle für Nahrung & Versorgung System.
    """

    BASE_URL = "https://www.fao.org/fileadmin/templates/est/COMM_MARKETS_MONITORING/FPMA/Data/FPIndex"

    def __init__(self):
        super().__init__("FAO")

    def fetch_food_price_index(self) -> Optional[IngestionItem]:
        try:
            url = f"{self.BASE_URL}/FPIndex.csv"
            df = pd.read_csv(url)

            latest = df.iloc[-1]

            return self.create_item(
                title=f"FAO Food Price Index: {latest.get('Date')}",
                description=f"Aktueller FAO Food Price Index: {latest.get('Index')}",
                source_url=url,
                germany_relevance=GermanyRelevance(
                    direct=True,
                    systems_affected=["lebensmittel", "finanzen"],
                    time_to_impact="monate",
                    description="Steigende FAO-Preise wirken sich mit Verzögerung auf deutsche Lebensmittelpreise aus.",
                ),
                methodology_tag="steep",
                affected_systems=["lebensmittel", "finanzen"],
            )
        except Exception as e:
            self.log_error(f"FAO FPI fetch failed: {e}")
            return None

    def _fallback(self) -> IngestionItem:
        return self.create_item(
            title="FAO Food Price Index — Datenquelle prüfen",
            description="FAO CSV nicht erreichbar (403). Manuelle Prüfung erforderlich.",
            source_url="https://www.fao.org/worldfoodsituation/foodpricesindex/en/",
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["lebensmittel", "finanzen"],
                time_to_impact="monate",
                description="FAO-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["lebensmittel", "finanzen"],
            confidence_suggestion="niedrig",
        )

    def fetch_latest(self) -> List[IngestionItem]:
        fpi = self.fetch_food_price_index()
        return [fpi] if fpi else [self._fallback()]
