import requests
from typing import List

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance
from ..config import settings


class BNetzAAdapter(BaseAdapter):
    """BNetzA / GIE AGSI+ — Gasspeicher-Füllstände."""

    source_class = "behoerde"
    source_label = "GIE AGSI+ (agsi.gie.eu)"
    requires_api_key = False  # GIE_API_KEY optional (nur Rate-Limit)
    output_target = "indicators"

    def __init__(self):
        super().__init__("BNetzA")

    def fetch_gas_storage(self) -> List[IngestionItem]:
        try:
            headers = {"x-key": settings.GIE_API_KEY} if settings.GIE_API_KEY else {}
            response = requests.get(
                "https://agsi.gie.eu/api/data/de",
                headers=headers,
                timeout=15,
            )

            if response.status_code == 200:
                payload = response.json()
                data = payload.get("data") if isinstance(payload, dict) else payload
                if data and isinstance(data, list) and len(data) > 0:
                    latest = data[0]
                    fill_pct = latest.get("full")
                    gas_date = latest.get("gasDayStart", "unbekannt")

                    # Parse current value as float, fallback to None
                    current_val: float | None = None
                    if fill_pct is not None:
                        try:
                            current_val = float(fill_pct)
                        except (ValueError, TypeError):
                            current_val = None

                    # Previous day from data[1] if available
                    prev_val: float | None = None
                    prev_date: str | None = None
                    if len(data) > 1:
                        prev_entry = data[1]
                        prev_pct = prev_entry.get("full")
                        if prev_pct is not None:
                            try:
                                prev_val = float(prev_pct)
                                prev_date = prev_entry.get("gasDayStart")
                            except (ValueError, TypeError):
                                prev_val = None

                    display_pct = f"{current_val:.1f}" if current_val is not None else "N/A"

                    return [self.create_item(
                        title=f"Gasspeicher Deutschland: {display_pct}% ({gas_date})",
                        description=f"Aktueller Füllstand deutscher Gasspeicher: {display_pct}%.",
                        source_url="https://agsi.gie.eu/",
                        germany_relevance=GermanyRelevance(
                            direct=True,
                            systems_affected=["energie", "industrie"],
                            time_to_impact="kurzfristig",
                            description="Gasspeicher-Füllstand ist kritisch für Energieversorgung.",
                        ),
                        methodology_tag="scenario",
                        affected_systems=["energie", "industrie"],
                        indicator_id="wi-gasspeicher-fuellstand",
                        current_value=current_val,
                        current_value_date=gas_date,
                        previous_value=prev_val,
                        previous_value_date=prev_date,
                        source_stand_date=gas_date,
                        source_stand_label=gas_date,
                        source_period_type="date",
                    )]

            self.log_error(f"GIE API: Status {response.status_code}")
            return self._fallback()

        except Exception as e:
            self.log_error(f"Gas storage fetch failed: {e}")
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        return [self.create_item(
            title="Gasspeicher Deutschland — Datenquelle prüfen",
            description="GIE AGSI+ API nicht erreichbar. Manuelle Prüfung erforderlich.",
            source_url="https://agsi.gie.eu/",
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["energie", "industrie"],
                time_to_impact="kurzfristig",
                description="Gasspeicher-Daten nicht abrufbar.",
            ),
            methodology_tag="scenario",
            affected_systems=["energie", "industrie"],
            confidence_suggestion="niedrig",
            indicator_id="wi-gasspeicher-fuellstand",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_gas_storage()
