from io import StringIO
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

    DATA_URL = (
        "https://www.fao.org/media/docs/worldfoodsituationlibraries/default-document-library/"
        "food_price_indices_data.csv?download=true&sfvrsn=523ebd2a_79"
    )
    source_label = "FAO Food Price Index (CSV)"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("FAO")

    def fetch_food_price_index(self) -> Optional[IngestionItem]:
        try:
            response = requests.get(
                self.DATA_URL,
                headers={"User-Agent": "Mozilla/5.0 WachSam-Krisenradar/0.3"},
                timeout=20,
            )
            response.raise_for_status()
            lines = response.text.splitlines()
            header_index = next(
                index for index, line in enumerate(lines) if line.lower().startswith("date,")
            )
            df = pd.read_csv(StringIO("\n".join(lines[header_index:])))

            latest = df.iloc[-1]
            previous = df.iloc[-2] if len(df) > 1 else None
            value_column = "Food Price Index" if "Food Price Index" in df.columns else "Index"
            current_value = float(latest.get(value_column))
            previous_value = float(previous.get(value_column)) if previous is not None else None

            return self.create_item(
                title=f"FAO Food Price Index: {latest.get('Date')}",
                description=f"Aktueller FAO Food Price Index: {current_value:.1f} Indexpunkte.",
                source_url="https://www.fao.org/worldfoodsituation/foodpricesindex/en",
                germany_relevance=GermanyRelevance(
                    direct=True,
                    systems_affected=["lebensmittel", "finanzen"],
                    time_to_impact="monate",
                    description="Steigende FAO-Preise wirken sich mit Verzögerung auf deutsche Lebensmittelpreise aus.",
                ),
                methodology_tag="steep",
                affected_systems=["lebensmittel", "finanzen"],
                indicator_id="wi-fao-food-price-index",
                current_value=current_value,
                current_value_date=str(latest.get("Date")),
                previous_value=previous_value,
                previous_value_date=str(previous.get("Date")) if previous is not None else None,
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
