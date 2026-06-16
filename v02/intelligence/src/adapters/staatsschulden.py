from typing import List

import requests

from .base import BaseAdapter
from ..models import GermanyRelevance, IngestionItem

# Datenquelle: Eurostat gov_10dd_edpt1 (jährliche Staatsschuldenquote)
# Verifiziert 2026-06-16: DE, S13, GD, PC_GDP → 2023: 62.3%, 2024: 62.2%, 2025: 63.5%.
# Periodentyp: year (Jahreswerte, ESA 2010, Referenzjahr nach Jahresabschluss).
_EUROSTAT_URL = (
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10dd_edpt1"
)
_SOURCE_URL = "https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1"


def parse_eurostat_debt(data: dict) -> list[dict]:
    """Parst Eurostat JSON-stat-2.0 für Staatsschuldenquote zu einer sortierten
    Liste von {'period': str, 'value': float}-Dicts.

    Gibt leere Liste zurück wenn keine Werte vorhanden sind.
    Eurostat-Struktur: dimension.time.category.index = {'2024': 1, ...},
    value = {'1': 62.2, ...} — Integer-Index als value-Key.
    """
    time_index: dict[str, int] = (
        data.get("dimension", {})
        .get("time", {})
        .get("category", {})
        .get("index", {})
    )
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

    result.sort(key=lambda r: r["period"])
    return result


class StaatsschuldenAdapter(BaseAdapter):
    """Staatsschuldenquote Deutschland — Eurostat gov_10dd_edpt1 (% des BIP, jährlich).

    Liefert die konsolidierte Bruttoschuldenquote des Gesamtstaates (S13) in % des BIP
    nach ESA-2010-Methodik. Periodentyp: year.

    Verifiziert: 2026-06-16, Wert 2025 = 63.5 % (vorläufig), 2024 = 62.2 %.
    """

    source_label = "Eurostat (gov_10dd_edpt1 — Staatsschuldenquote DE)"
    source_class = "behoerde"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("Staatsschulden")

    def fetch_schuldenquote(self) -> List[IngestionItem]:
        try:
            params = {
                "geo": "DE",
                "na_item": "GD",
                "sector": "S13",
                "unit": "PC_GDP",
                "format": "JSON",
                "lang": "EN",
                "lastTimePeriod": "3",
            }
            response = requests.get(_EUROSTAT_URL, params=params, timeout=25)

            if response.status_code == 200:
                data = response.json()
                observations = parse_eurostat_debt(data)

                if len(observations) >= 1:
                    latest = observations[-1]
                    previous = observations[-2] if len(observations) >= 2 else None

                    current_value = latest["value"]
                    current_period = latest["period"]
                    previous_value = previous["value"] if previous else None
                    previous_period = previous["period"] if previous else None

                    return [self.create_item(
                        title=(
                            f"Staatsschuldenquote Deutschland: {current_value:.1f}% des BIP"
                            f" ({current_period})"
                        ),
                        description=(
                            f"Staatsverschuldungsquote Deutschland (Eurostat gov_10dd_edpt1, "
                            f"Gesamtstaat S13, ESA 2010): {current_value:.1f}% des BIP "
                            f"in {current_period}."
                        ),
                        source_url=_SOURCE_URL,
                        germany_relevance=GermanyRelevance(
                            direct=True,
                            systems_affected=["finanzen", "gesellschaft", "industrie"],
                            time_to_impact="langfristig",
                            description=(
                                "Staatsschuldenquote beeinflusst fiskalpolitischen Spielraum, "
                                "Zinsausgaben des Bundes und Kreditwürdigkeit Deutschlands."
                            ),
                        ),
                        methodology_tag="steep",
                        affected_systems=["finanzen", "gesellschaft", "industrie"],
                        indicator_id="wi-staatsschuldenquote-de",
                        current_value=current_value,
                        current_value_date=current_period,
                        previous_value=previous_value,
                        previous_value_date=previous_period,
                        source_stand_date=current_period,
                        source_stand_label=current_period,
                        source_period_type="year",
                    )]

            self.log_error(f"Schuldenquote fetch: HTTP {response.status_code}")
            self.record_source_error(
                "wi-staatsschuldenquote-de", f"HTTP {response.status_code}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"Schuldenquote fetch failed: {e}")
            self.record_source_error(
                "wi-staatsschuldenquote-de", f"fetch_error: {type(e).__name__}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        """Fallback-Item bei nicht erreichbarer Eurostat-API."""
        return [self.create_item(
            title="Staatsschuldenquote Deutschland — Datenquelle prüfen",
            description=(
                "Eurostat gov_10dd_edpt1 nicht erreichbar. Manuelle Prüfung erforderlich."
            ),
            source_url=_SOURCE_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["finanzen", "gesellschaft", "industrie"],
                time_to_impact="langfristig",
                description="Schuldenquoten-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["finanzen", "gesellschaft", "industrie"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_schuldenquote()
