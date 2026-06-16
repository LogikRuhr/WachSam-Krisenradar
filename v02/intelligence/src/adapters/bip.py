from typing import List

import requests

from .base import BaseAdapter
from ..models import GermanyRelevance, IngestionItem

# Datenquelle: Eurostat namq_10_gdp
# Verifiziert 2026-06-16: liefert QoQ-Wachstumsrate (SCA bereinigt) für DE.
# Aktuell: Q1/2026 = +0.3 % QoQ.
_EUROSTAT_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/namq_10_gdp"
)
_SOURCE_URL = "https://ec.europa.eu/eurostat/databrowser/view/namq_10_gdp"


def parse_eurostat_jsonstat(data: dict) -> list[dict]:
    """Parst eine Eurostat JSON-stat-2.0-Antwort zu einer sortierten Liste von
    {'period': str, 'value': float}-Dicts.

    Gibt eine leere Liste zurück wenn keine Werte vorhanden sind. Robust gegen
    fehlende oder unbekannte Dimensionen.

    Eurostat-Struktur: dimension.time.category.index = {'2026-Q1': 3, ...},
    value = {'3': 0.3, ...} — der Integer-Index des Zeitpunkts ist der value-Key.
    """
    time_category = (
        data.get("dimension", {})
        .get("time", {})
        .get("category", {})
    )
    # index: period-string → int-Index; value-dict: str(int-Index) → float
    time_index: dict[str, int] = time_category.get("index", {})
    values: dict[str, float] = data.get("value", {}) or {}

    result: list[dict] = []
    for period, int_idx in time_index.items():
        raw = values.get(str(int_idx))
        if raw is None:
            continue
        try:
            result.append({"period": str(period), "value": float(raw)})
        except (TypeError, ValueError):
            continue

    # Aufsteigende Periodenreihenfolge (ISO-Quarter: "2026-Q1" sortiert lexikographisch)
    result.sort(key=lambda r: r["period"])
    return result


class BIPAdapter(BaseAdapter):
    """BIP-Wachstum Deutschland — Eurostat namq_10_gdp (QoQ, bereinigt).

    Liefert die reale BIP-Wachstumsrate Deutschland zum Vorquartal (chain-linked
    volumes, seasonal + calendar adjusted, CLV_PCH_PRE / SCA). Periodentyp: quarter.

    Verifiziert: 2026-06-16, Wert Q1/2026 = +0.3 %, Q4/2025 = +0.2 %.
    """

    source_label = "Eurostat (namq_10_gdp — BIP QoQ DE)"
    source_class = "behoerde"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("BIP")

    def fetch_bip(self) -> List[IngestionItem]:
        try:
            params = {
                "geo": "DE",
                "na_item": "B1GQ",
                "unit": "CLV_PCH_PRE",
                "s_adj": "SCA",
                "format": "JSON",
                "lang": "EN",
                "lastTimePeriod": "4",
            }
            response = requests.get(_EUROSTAT_URL, params=params, timeout=25)

            if response.status_code == 200:
                data = response.json()
                observations = parse_eurostat_jsonstat(data)

                if len(observations) >= 1:
                    latest = observations[-1]
                    previous = observations[-2] if len(observations) >= 2 else None

                    current_value = latest["value"]
                    current_period = latest["period"]
                    previous_value = previous["value"] if previous else None
                    previous_period = previous["period"] if previous else None

                    return [self.create_item(
                        title=(
                            f"BIP-Wachstum Deutschland: {current_value:+.1f}% QoQ"
                            f" ({current_period})"
                        ),
                        description=(
                            f"Reales BIP-Wachstum Deutschland (Eurostat namq_10_gdp, "
                            f"saison- und kalenderbereinigt, Veränderung zum Vorquartal): "
                            f"{current_value:+.1f}% in {current_period}."
                        ),
                        source_url=_SOURCE_URL,
                        germany_relevance=GermanyRelevance(
                            direct=True,
                            systems_affected=["industrie", "arbeit", "finanzen"],
                            time_to_impact="monate",
                            description=(
                                "BIP-Wachstum bestimmt Investitionsbereitschaft, Steuereinnahmen "
                                "und Arbeitsmarktentwicklung in Deutschland direkt."
                            ),
                        ),
                        methodology_tag="steep",
                        affected_systems=["industrie", "arbeit", "finanzen"],
                        indicator_id="wi-bip-wachstum-de",
                        current_value=current_value,
                        current_value_date=current_period,
                        previous_value=previous_value,
                        previous_value_date=previous_period,
                        source_stand_date=current_period,
                        source_stand_label=current_period,
                        source_period_type="quarter",
                    )]

            self.log_error(f"BIP fetch: HTTP {response.status_code}")
            self.record_source_error(
                "wi-bip-wachstum-de", f"HTTP {response.status_code}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"BIP fetch failed: {e}")
            self.record_source_error(
                "wi-bip-wachstum-de", f"fetch_error: {type(e).__name__}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        """Fallback-Item bei nicht erreichbarer Eurostat-API."""
        return [self.create_item(
            title="BIP-Wachstum Deutschland — Datenquelle prüfen",
            description=(
                "Eurostat namq_10_gdp nicht erreichbar. Manuelle Prüfung erforderlich."
            ),
            source_url=_SOURCE_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["industrie", "arbeit", "finanzen"],
                time_to_impact="monate",
                description="BIP-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["industrie", "arbeit", "finanzen"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_bip()
