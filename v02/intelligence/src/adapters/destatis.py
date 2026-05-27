import requests
from typing import List

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance
from ..config import settings


class DestatisAdapter(BaseAdapter):
    """Destatis GENESIS API — VPI und Arbeitsmarktdaten."""

    BASE_URL = "https://www-genesis.destatis.de/genesisWS/rest/2020"
    source_class = "behoerde"

    def __init__(self):
        super().__init__("Destatis")

    def fetch_vpi(self) -> List[IngestionItem]:
        try:
            params = {
                "username": settings.DESTATIS_USERNAME or "GAST",
                "password": settings.DESTATIS_PASSWORD or "GAST",
                "name": "61111-0001",
                "area": "all",
                "compress": "false",
                "format": "ffcsv",
                "language": "de",
            }
            response = requests.get(
                f"{self.BASE_URL}/data/tablefile",
                params=params,
                timeout=30,
            )

            if response.status_code == 200 and len(response.text) > 100:
                lines = response.text.strip().split("\n")
                last_line = lines[-1] if lines else ""
                return [self.create_item(
                    title="Verbraucherpreisindex (VPI) — aktueller Stand",
                    description=f"Destatis VPI-Daten. Letzte Zeile: {last_line[:200]}",
                    source_url="https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html",
                    germany_relevance=GermanyRelevance(
                        direct=True,
                        systems_affected=["finanzen", "lebensmittel", "gesellschaft"],
                        time_to_impact="wochen",
                        description="VPI misst direkt die Preisentwicklung für deutsche Haushalte.",
                    ),
                    methodology_tag="bia",
                    affected_systems=["finanzen", "lebensmittel"],
                )]

            self.log_error(f"VPI fetch: Status {response.status_code}")
            return self._fallback_vpi()

        except Exception as e:
            self.log_error(f"VPI fetch failed: {e}")
            return self._fallback_vpi()

    def _fallback_vpi(self) -> List[IngestionItem]:
        return [self.create_item(
            title="Verbraucherpreisindex (VPI) — Datenquelle prüfen",
            description="Destatis GENESIS API nicht erreichbar. Manuelle Prüfung erforderlich.",
            source_url="https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html",
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["finanzen", "lebensmittel"],
                time_to_impact="wochen",
                description="VPI-Daten nicht abrufbar.",
            ),
            methodology_tag="bia",
            affected_systems=["finanzen", "lebensmittel"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_vpi()
