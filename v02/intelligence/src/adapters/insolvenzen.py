import csv
from io import StringIO
from typing import List

import requests

from .base import BaseAdapter
from .destatis import decode_genesis_table_response, _parse_number, _period_sort_key
from ..models import GermanyRelevance, IngestionItem

# Datenquelle: Destatis Tabelle 52411-0010 / "Insolvenzen nach Monaten".
# Der Indikator meint die Spalte "Unternehmen", nicht "insgesamt".
_GENESIS_TABLE = "52411-0010"
_BASE_URL = "https://www-genesis.destatis.de/genesisWS/rest/2020"
_SOURCE_URL = (
    "https://www.destatis.de/DE/Themen/Branchen-Unternehmen/Unternehmen/"
    "Gewerbemeldungen-Insolvenzen/Tabellen/Insolvenzen.html"
)


def parse_insolvenzen_table(table_text: str) -> dict:
    """Parst Destatis-Insolvenzdaten zu {'period', 'value'}-Dicts.

    Verifiziert 2026-06-17: Die Tabelle enthält Gesamtzahlen und Teilspalten.
    Für `wi-insolvenzen-de` ist ausschließlich die Spalte "Unternehmen" gültig.
    Nutzt _date_label_from_row zur Rekonstruktion von "Jahr-Monat"-Perioden.
    Gibt {'current': {'period', 'value'}, 'previous': ...} zurück.
    """
    from .destatis import _date_label_from_row as _dlr
    rows = [
        [cell.strip() for cell in row]
        for row in csv.reader(StringIO(table_text), delimiter=";")
        if any(cell.strip() for cell in row)
    ]

    header_index = None
    value_index = None
    date_index = None

    for index, row in enumerate(rows):
        if len(row) < 4:
            continue
        lowered = [cell.lower() for cell in row]
        value_candidates = [
            ci for ci, cell in enumerate(lowered)
            if "unternehmen" in cell
        ]
        if value_candidates:
            date_candidates = [
                ci for ci, cell in enumerate(lowered[:value_candidates[0]])
                if "monat" in cell or "zeit" in cell or "datum" in cell or "jahr" in cell
            ]
            header_index = index
            value_index = value_candidates[0]
            date_index = date_candidates[0] if date_candidates else 0
            break

    if header_index is None:
        raise ValueError(
            "Insolvenzen-Tabelle: Keine Unternehmensinsolvenz-Spalte gefunden"
        )

    values: list[tuple] = []
    for offset, row in enumerate(rows[header_index + 1:], start=1):
        if max(date_index, value_index) >= len(row):
            continue
        # _date_label_from_row kombiniert Jahr + Monatsname → "2026-01" etc.
        date_label = _dlr(row, date_index)
        value_label = row[value_index].strip()
        if not date_label or not value_label:
            continue
        try:
            parsed_value = _parse_number(value_label)
        except ValueError:
            # "..." (fehlende Werte) oder "+" (Prozent) überspringen
            continue
        values.append((_period_sort_key(date_label, offset), date_label, parsed_value))

    if not values:
        raise ValueError("Insolvenzen-Tabelle: Keine numerischen Werte gefunden")

    values.sort(key=lambda e: e[0])
    current = values[-1]
    previous = values[-2] if len(values) > 1 else None

    return {
        "current": {"period": current[1], "value": current[2]},
        "previous": {"period": previous[1], "value": previous[2]} if previous else None,
    }


class InsolvenzenAdapter(BaseAdapter):
    """Unternehmensinsolvenzen Deutschland — Destatis 52411-0010 (monatlich).

    Einheit: Anzahl Unternehmensinsolvenzen pro Monat (absolut).
    Periodentyp: month.
    """

    source_label = "Destatis (52411-0010 — Unternehmensinsolvenzen DE)"
    source_class = "behoerde"
    requires_api_key = False  # DESTATIS_USERNAME/PASSWORD, kein Key-Konzept
    output_target = "indicators"

    def __init__(self):
        super().__init__("Insolvenzen")
        from ..config import settings
        self._settings = settings

    def fetch_insolvenzen(self) -> List[IngestionItem]:
        try:
            headers = {
                "accept": "application/octet-stream",
                "username": self._settings.DESTATIS_USERNAME or "GAST",
                "password": self._settings.DESTATIS_PASSWORD or "GAST",
                "Content-Type": "application/x-www-form-urlencoded",
            }
            data = {
                "name": _GENESIS_TABLE,
                "area": "all",
                "compress": "false",
                "format": "datencsv",
                "language": "de",
                "transpose": "false",
                "job": "false",
                "quality": "off",
            }
            response = requests.post(
                f"{_BASE_URL}/data/tablefile",
                headers=headers,
                data=data,
                timeout=30,
            )

            if response.status_code == 200 and len(response.content) > 50:
                table_text = decode_genesis_table_response(response.content, response.text)
                try:
                    parsed = parse_insolvenzen_table(table_text)
                except ValueError as parse_err:
                    self.log_error(f"Insolvenzen parse error: {parse_err}")
                    self.record_source_error(
                        "wi-insolvenzen-de", f"parse_error: {parse_err}",
                        source_url=_SOURCE_URL,
                    )
                    return self._fallback()

                current = parsed["current"]
                previous = parsed.get("previous")
                current_value = current["value"]
                current_period = current["period"]
                previous_value = previous["value"] if previous else None
                previous_period = previous["period"] if previous else None

                return [self.create_item(
                    title=f"Unternehmensinsolvenzen Deutschland: {int(current_value):,} ({current_period})".replace(",", "."),
                    description=(
                        "Destatis 52411-0010 — Unternehmensinsolvenzen Deutschland: "
                        f"{int(current_value):,} in {current_period} (monatlich)."
                    ).replace(",", "."),
                    source_url=_SOURCE_URL,
                    germany_relevance=GermanyRelevance(
                        direct=True,
                        systems_affected=["industrie", "arbeit", "finanzen"],
                        time_to_impact="monate",
                        description=(
                            "Unternehmenspleiten sind Frühindikator für wirtschaftliche "
                            "Abschwächung; Wirkung auf Beschäftigung und Kreditausfälle."
                        ),
                    ),
                    methodology_tag="steep",
                    affected_systems=["industrie", "arbeit", "finanzen"],
                    indicator_id="wi-insolvenzen-de",
                    current_value=current_value,
                    current_value_date=current_period,
                    previous_value=previous_value,
                    previous_value_date=previous_period,
                    source_stand_date=current_period,
                    source_stand_label=current_period,
                    source_period_type="month",
                )]

            self.log_error(
                f"Insolvenzen fetch: HTTP {response.status_code} "
                f"(GENESIS Auth oder Tabelle {_GENESIS_TABLE})"
            )
            self.record_source_error(
                "wi-insolvenzen-de", f"HTTP {response.status_code}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"Insolvenzen fetch failed: {e}")
            self.record_source_error(
                "wi-insolvenzen-de", f"fetch_error: {type(e).__name__}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        """Fallback-Item bei nicht erreichbarem GENESIS-Endpunkt."""
        return [self.create_item(
            title="Unternehmensinsolvenzen Deutschland — Datenquelle prüfen",
            description=(
                "Destatis 52411-0010 nicht erreichbar oder Auth fehlt. "
                "Manuelle Prüfung erforderlich."
            ),
            source_url=_SOURCE_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["industrie", "arbeit", "finanzen"],
                time_to_impact="monate",
                description="Insolvenz-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["industrie", "arbeit", "finanzen"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_insolvenzen()
