from typing import List

import requests

from .base import BaseAdapter
from ..config import settings
from ..models import GermanyRelevance, IngestionItem


class FREDAdapter(BaseAdapter):
    """FRED (St. Louis Fed) — Europäischer Erdgaspreis, monatlich (PNGASEUUSDM)."""

    SERIES_URL = "https://api.stlouisfed.org/fred/series/observations"
    SERIES_ID = "PNGASEUUSDM"
    source_label = "FRED St. Louis Fed (PNGASEUUSDM)"
    requires_api_key = True  # FRED_API_KEY zwingend
    output_target = "indicators"

    def __init__(self):
        super().__init__("FRED")
        self.source_class = "wirtschaftsinstitut"

    def fetch_gas_price(self) -> List[IngestionItem]:
        """
        Ruft die letzten 2 monatlichen Beobachtungen der FRED-Reihe PNGASEUUSDM ab
        (Global price of Natural Gas, EU, USD per Million BTU).

        Fehlende Werte werden durch "." kodiert und übersprungen.
        """
        try:
            params = {
                "series_id": self.SERIES_ID,
                "api_key": settings.FRED_API_KEY,
                "file_type": "json",
                "sort_order": "desc",
                "limit": "2",
            }
            response = requests.get(self.SERIES_URL, params=params, timeout=20)

            if response.status_code == 200:
                observations = response.json().get("observations", [])

                # Beobachtungen mit fehlendem Wert ("." = FRED-Platzhalter) herausfiltern
                valid = [
                    obs for obs in observations
                    if obs.get("value") not in (None, ".", "")
                ]

                if valid:
                    latest = valid[0]
                    previous = valid[1] if len(valid) > 1 else {}

                    current_value = float(latest["value"])
                    previous_value = (
                        float(previous["value"])
                        if previous.get("value") not in (None, ".", "")
                        else None
                    )
                    current_date = latest.get("date")
                    previous_date = previous.get("date") if previous else None

                    return [self.create_item(
                        title=(
                            f"Erdgaspreis Europa (FRED): {current_value:.2f} USD/MMBtu"
                            f" ({current_date})"
                        ),
                        description=(
                            f"FRED PNGASEUUSDM — Global price of Natural Gas, EU: "
                            f"{current_value:.2f} USD per Million BTU (monatlich)."
                        ),
                        source_url=(
                            "https://fred.stlouisfed.org/series/PNGASEUUSDM"
                        ),
                        germany_relevance=GermanyRelevance(
                            direct=True,
                            systems_affected=["energie", "lebensmittel", "industrie"],
                            time_to_impact="wochen",
                            description=(
                                "Europäischer Gaspreis steuert Stickstoff-Dünger- und "
                                "Industrieproduktionskosten; Einfluss auf Lebensmittelpreise "
                                "mit 3–6 Monaten Verzögerung."
                            ),
                        ),
                        methodology_tag="steep",
                        affected_systems=["energie", "lebensmittel", "industrie"],
                        indicator_id="wi-gaspreis-europa",
                        current_value=current_value,
                        current_value_date=current_date,
                        previous_value=previous_value,
                        previous_value_date=previous_date,
                    )]

            self.log_error(f"Gas price fetch: Status {response.status_code}")
            self.record_source_error(
                "wi-gaspreis-europa", f"HTTP {response.status_code}",
                source_url="https://fred.stlouisfed.org/series/PNGASEUUSDM",
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"Gas price fetch failed: {e}")
            self.record_source_error(
                "wi-gaspreis-europa", f"fetch_error: {type(e).__name__}",
                source_url="https://fred.stlouisfed.org/series/PNGASEUUSDM",
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        """Fallback-Item bei nicht erreichbarer FRED-API."""
        return [self.create_item(
            title="Erdgaspreis Europa — Datenquelle prüfen",
            description=(
                "FRED PNGASEUUSDM nicht erreichbar. Manuelle Prüfung erforderlich."
            ),
            source_url="https://fred.stlouisfed.org/series/PNGASEUUSDM",
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["energie", "lebensmittel", "industrie"],
                time_to_impact="wochen",
                description="Gaspreis-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["energie", "lebensmittel", "industrie"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_gas_price()
