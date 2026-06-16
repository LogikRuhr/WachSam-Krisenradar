from typing import List

import requests

from .base import BaseAdapter
from ..models import GermanyRelevance, IngestionItem

# Datenquelle: ECB Statistical Data Warehouse (SDW) — Deposit Facility Rate (DFR)
# Flow: FM, Key: B.U2.EUR.4F.KR.DFR.LEV
# Verifiziert 2026-06-16: liefert historische Änderungsdaten (Business Day Freq.),
# aktuell 2.25% (Stand 2026-06-17). Kein API-Key erforderlich.
_ECB_URL = (
    "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV"
)
_SOURCE_URL = "https://data.ecb.europa.eu/data/datasets/FM/FM.B.U2.EUR.4F.KR.DFR.LEV"


def parse_ecb_sdw_jsondata(data: dict) -> list[dict]:
    """Parst die ECB SDW JSON-data-2.0-Antwort (sdmxjson-Format) zu einer
    sortierten Liste von {'period': str, 'value': float}-Dicts.

    Struktur: dataSets[0].series['0:...:0'].observations = {'0': [val], '1': [val]}
    Die Zeitperioden stehen in structure.dimensions.observation[time_dim_idx].values.
    """
    try:
        obs_dims = data["structure"]["dimensions"]["observation"]
        time_dim_idx = next(
            i for i, d in enumerate(obs_dims) if d.get("id") == "TIME_PERIOD"
        )
        time_values = obs_dims[time_dim_idx]["values"]
    except (KeyError, StopIteration):
        return []

    try:
        series_map = data["dataSets"][0]["series"]
        obs_map = next(iter(series_map.values())).get("observations", {})
    except (KeyError, IndexError, StopIteration):
        return []

    result: list[dict] = []
    for str_idx, obs_vals in obs_map.items():
        try:
            period = time_values[int(str_idx)]["name"]
            value = float(obs_vals[0])
            result.append({"period": str(period), "value": value})
        except (IndexError, TypeError, ValueError, KeyError):
            continue

    result.sort(key=lambda r: r["period"])
    return result


class EZBLeitzinsAdapter(BaseAdapter):
    """EZB-Leitzins (Deposit Facility Rate) — ECB SDW (kein API-Key).

    Die EZB veröffentlicht seit 2022 den DFR als operativen Leit-/Orientierungssatz.
    Periodentyp: date (Änderungsdaten; Datum des Zinsschritts).

    Verifiziert: 2026-06-16, aktueller Wert: 2.25% (Stand 2026-06-17).
    """

    source_label = "ECB SDW (FM.B.U2.EUR.4F.KR.DFR.LEV — Deposit Facility Rate)"
    source_class = "behoerde"
    requires_api_key = False
    output_target = "indicators"

    def __init__(self):
        super().__init__("EZBLeitzins")

    def fetch_leitzins(self) -> List[IngestionItem]:
        try:
            params = {
                "format": "jsondata",
                "lastNObservations": "5",
                "detail": "dataonly",
            }
            response = requests.get(_ECB_URL, params=params, timeout=20)

            if response.status_code == 200:
                data = response.json()
                observations = parse_ecb_sdw_jsondata(data)

                if len(observations) >= 1:
                    latest = observations[-1]
                    previous = observations[-2] if len(observations) >= 2 else None

                    current_value = latest["value"]
                    current_period = latest["period"]
                    previous_value = previous["value"] if previous else None
                    previous_period = previous["period"] if previous else None

                    return [self.create_item(
                        title=(
                            f"EZB-Leitzins (DFR): {current_value:.2f}%"
                            f" (seit {current_period})"
                        ),
                        description=(
                            f"EZB Deposit Facility Rate (Einlagenfazilitätssatz): "
                            f"{current_value:.2f}% seit {current_period}. "
                            f"Quelle: ECB Statistical Data Warehouse (SDW)."
                        ),
                        source_url=_SOURCE_URL,
                        germany_relevance=GermanyRelevance(
                            direct=True,
                            systems_affected=["finanzen", "industrie", "lebensmittel"],
                            time_to_impact="monate",
                            description=(
                                "EZB-Leitzins bestimmt Finanzierungskosten für Unternehmen "
                                "und Haushalte in Deutschland direkt; wirkt auf Investitionen "
                                "und Konsumkredite."
                            ),
                        ),
                        methodology_tag="steep",
                        affected_systems=["finanzen", "industrie", "lebensmittel"],
                        indicator_id="wi-ezb-leitzins",
                        current_value=current_value,
                        current_value_date=current_period,
                        previous_value=previous_value,
                        previous_value_date=previous_period,
                        source_stand_date=current_period,
                        source_stand_label=current_period,
                        source_period_type="date",
                    )]

            self.log_error(f"EZB-Leitzins fetch: HTTP {response.status_code}")
            self.record_source_error(
                "wi-ezb-leitzins", f"HTTP {response.status_code}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"EZB-Leitzins fetch failed: {e}")
            self.record_source_error(
                "wi-ezb-leitzins", f"fetch_error: {type(e).__name__}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        """Fallback-Item bei nicht erreichbarer ECB-SDW-API."""
        return [self.create_item(
            title="EZB-Leitzins — Datenquelle prüfen",
            description=(
                "ECB SDW (DFR) nicht erreichbar. Manuelle Prüfung erforderlich."
            ),
            source_url=_SOURCE_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["finanzen", "industrie", "lebensmittel"],
                time_to_impact="monate",
                description="EZB-Leitzins-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["finanzen", "industrie", "lebensmittel"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_leitzins()
