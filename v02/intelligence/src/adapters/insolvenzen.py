import csv
from html.parser import HTMLParser
from io import StringIO
from typing import List

import requests

from .base import BaseAdapter
from .destatis import (
    decode_genesis_table_response,
    _date_label_from_row,
    _parse_number,
    _period_sort_key,
)
from ..models import GermanyRelevance, IngestionItem

# Datenquelle: Destatis Tabelle 52411-0010 / "Insolvenzen nach Monaten".
# Der Indikator meint die Spalte "Unternehmen", nicht "insgesamt".
_GENESIS_TABLE = "52411-0010"
_BASE_URL = "https://www-genesis.destatis.de/genesisWS/rest/2020"
_SOURCE_URL = (
    "https://www.destatis.de/DE/Themen/Branchen-Unternehmen/Unternehmen/"
    "Gewerbemeldungen-Insolvenzen/Tabellen/Insolvenzen.html"
)
_MONTH_ABBR_DE = {
    "jan": 1,
    "feb": 2,
    "mär": 3,
    "mrz": 3,
    "apr": 4,
    "mai": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "okt": 10,
    "nov": 11,
    "dez": 12,
}


class _DestatisTableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows: list[list[str]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._row is not None and self._cell is not None:
            value = " ".join("".join(self._cell).replace("\xa0", " ").split())
            self._row.append(value)
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if any(cell for cell in self._row):
                self.rows.append(self._row)
            self._row = None


def _period_from_year_month(year: str, month_label: str) -> str:
    period = _date_label_from_row([year, month_label], 0)
    if period != year:
        return period

    month_key = month_label.strip().lower().replace(".", "")
    month = _MONTH_ABBR_DE.get(month_key)
    if month:
        return f"{year}-{month:02d}"
    return year


def _parse_insolvenzen_number(value: str) -> float:
    return _parse_number(value.replace("\xa0", "").replace(" ", ""))


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
            parsed_value = _parse_insolvenzen_number(value_label)
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


def parse_insolvenzen_html(html_text: str) -> dict:
    """Parst die offizielle Destatis-HTML-Tabelle "Insolvenzen nach Monaten"."""
    absolute_values_html = html_text.split("Veränderung zum Vorjahr", 1)[0]
    parser = _DestatisTableParser()
    parser.feed(absolute_values_html)

    values: list[tuple] = []
    current_year: str | None = None

    for offset, row in enumerate(parser.rows, start=1):
        if not row:
            continue

        first = row[0].strip()
        if len(first) == 4 and first.isdigit():
            current_year = first
            if len(row) < 4:
                continue
            month_label = row[1]
            company_value = row[3]
        else:
            if current_year is None or len(row) < 3:
                continue
            month_label = first
            company_value = row[2]

        period = _period_from_year_month(current_year, month_label)
        if period == current_year:
            continue

        try:
            parsed_value = _parse_insolvenzen_number(company_value)
        except ValueError:
            continue

        values.append((_period_sort_key(period, offset), period, parsed_value))

    if not values:
        raise ValueError("Insolvenzen-HTML: Keine Unternehmenswerte gefunden")

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

    def _items_from_parsed(self, parsed: dict) -> List[IngestionItem]:
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

    def _fetch_from_destatis_html(self, genesis_error: str | None = None) -> List[IngestionItem]:
        try:
            response = requests.get(
                _SOURCE_URL,
                headers={"User-Agent": "WachSam-Krisenradar/1.0"},
                timeout=30,
            )
            response.raise_for_status()
            parsed = parse_insolvenzen_html(response.text)
            if genesis_error:
                self.log_error(f"Insolvenzen GENESIS fallback to Destatis HTML: {genesis_error}")
            return self._items_from_parsed(parsed)
        except Exception as e:
            self.log_error(f"Insolvenzen HTML fetch failed: {e}")
            reason = f"html_error: {type(e).__name__}"
            if genesis_error:
                reason = f"{genesis_error}; {reason}"
            self.record_source_error(
                "wi-insolvenzen-de",
                reason,
                source_url=_SOURCE_URL,
            )
            return self._fallback()

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
                    self.log_error(f"Insolvenzen GENESIS parse error: {parse_err}")
                    return self._fetch_from_destatis_html(f"genesis_parse_error: {parse_err}")

                return self._items_from_parsed(parsed)

            self.log_error(
                f"Insolvenzen fetch: HTTP {response.status_code} "
                f"(GENESIS Auth oder Tabelle {_GENESIS_TABLE})"
            )
            return self._fetch_from_destatis_html(f"genesis_http: {response.status_code}")

        except Exception as e:
            self.log_error(f"Insolvenzen fetch failed: {e}")
            return self._fetch_from_destatis_html(f"genesis_fetch_error: {type(e).__name__}")

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
