import csv
import json
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from io import BytesIO, StringIO
import requests
from typing import List
from zipfile import BadZipFile, ZipFile

from .base import BaseAdapter
from ..models import IngestionItem, GermanyRelevance
from ..config import settings


@dataclass
class VPILiveValue:
    current_value: float
    current_value_date: str
    previous_value: float | None = None
    previous_value_date: str | None = None


MONTHS_DE = {
    "januar": 1,
    "jan": 1,
    "februar": 2,
    "feb": 2,
    "maerz": 3,
    "märz": 3,
    "mär": 3,
    "mrz": 3,
    "april": 4,
    "apr": 4,
    "mai": 5,
    "juni": 6,
    "jun": 6,
    "juli": 7,
    "jul": 7,
    "august": 8,
    "aug": 8,
    "september": 9,
    "sep": 9,
    "oktober": 10,
    "okt": 10,
    "november": 11,
    "nov": 11,
    "dezember": 12,
    "dez": 12,
}


VPI_PUBLIC_URL = "https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html"
VPI_TABLE_URL = (
    "https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/"
    "Tabellen/Verbraucherpreise-12Kategorien.html"
)


def _parse_number(value: str) -> float:
    normalized = value.strip().replace("+", "").replace("%", "").replace(".", "").replace(",", ".")
    return float(normalized)


def _genesis_error_message(response_text: str) -> str | None:
    stripped = response_text.lstrip("\ufeff \t\r\n")
    if not stripped.startswith("{"):
        return None

    try:
        payload = json.loads(stripped)
    except json.JSONDecodeError:
        return None

    status = payload.get("Status") if isinstance(payload, dict) else None
    if isinstance(status, dict):
        code = status.get("Code")
        if str(code) not in {"0", "None"}:
            content = status.get("Content") or "unknown GENESIS status"
            return f"GENESIS status {code}: {content}"

    code = payload.get("Code") if isinstance(payload, dict) else None
    if code is not None and str(code) != "0":
        content = payload.get("Content") or "unknown GENESIS status"
        return f"GENESIS status {code}: {content}"

    return None


def decode_genesis_table_response(content: bytes, fallback_text: str) -> str:
    """Decode GENESIS tablefile responses.

    GENESIS may return the requested DATENCSV as a ZIP payload even when
    `compress=false` is sent. The adapter consumes the contained CSV text and
    falls back to `response.text` for uncompressed responses/tests.
    """
    if content.startswith(b"PK"):
        try:
            with ZipFile(BytesIO(content)) as archive:
                csv_names = [name for name in archive.namelist() if name.lower().endswith(".csv")]
                if not csv_names:
                    raise ValueError("GENESIS ZIP response does not contain a CSV file")
                raw = archive.read(csv_names[0])
        except BadZipFile as exc:
            raise ValueError("GENESIS ZIP response is invalid") from exc

        for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
            try:
                return raw.decode(encoding)
            except UnicodeDecodeError:
                continue
        return raw.decode("utf-8", errors="replace")

    return fallback_text


class _DestatisTableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables: list[list[list[dict[str, str | int]]]] = []
        self._in_table = False
        self._in_row = False
        self._in_cell = False
        self._current_table: list[list[dict[str, str | int]]] = []
        self._current_row: list[dict[str, str | int]] = []
        self._current_cell: list[str] = []
        self._current_attrs: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_dict = {key: value or "" for key, value in attrs}
        if tag == "table":
            self._in_table = True
            self._current_table = []
        elif self._in_table and tag == "tr":
            self._in_row = True
            self._current_row = []
        elif self._in_row and tag in {"td", "th"}:
            self._in_cell = True
            self._current_cell = []
            self._current_attrs = attrs_dict
        elif self._in_cell and tag == "abbr" and attrs_dict.get("title"):
            self._current_cell.append(attrs_dict["title"])

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._current_cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self._in_cell and tag in {"td", "th"}:
            text = " ".join(" ".join(self._current_cell).split())
            self._current_row.append({
                "text": text,
                "rowspan": int(self._current_attrs.get("rowspan") or "1"),
            })
            self._in_cell = False
        elif self._in_row and tag == "tr":
            self._current_table.append(self._current_row)
            self._in_row = False
        elif self._in_table and tag == "table":
            self.tables.append(self._current_table)
            self._in_table = False


def _month_from_label(value: str) -> int | None:
    for token in re.findall(r"[A-Za-zÄÖÜäöüß]+", value.lower()):
        month = MONTHS_DE.get(token)
        if month:
            return month
    return None


def _format_period(year: int, month: int) -> str:
    return f"{year}-{month:02d}"


def _year_over_year(values: dict[tuple[int, int], float], period: tuple[int, int]) -> float | None:
    year, month = period
    current = values.get(period)
    previous_year = values.get((year - 1, month))
    if current is None or previous_year in (None, 0):
        return None
    return round(((current / previous_year) - 1) * 100, 1)


def _extract_vpi_index_values(table: list[list[dict[str, str | int]]]) -> dict[tuple[int, int], float]:
    values: dict[tuple[int, int], float] = {}
    active_year: int | None = None
    year_rows_remaining = 0

    for row in table:
        texts = [str(cell["text"]).strip() for cell in row]
        if not texts:
            continue

        year_match = re.fullmatch(r"20\d{2}|19\d{2}", texts[0])
        if year_match:
            active_year = int(texts[0])
            year_rows_remaining = int(row[0].get("rowspan") or 1)
            month_label = texts[1] if len(texts) > 1 else ""
            value_label = texts[2] if len(texts) > 2 else ""
        elif active_year is not None and year_rows_remaining > 0:
            month_label = texts[0]
            value_label = texts[1] if len(texts) > 1 else ""
        else:
            continue

        month = _month_from_label(month_label)
        if month:
            try:
                values[(active_year, month)] = _parse_number(value_label)
            except ValueError:
                pass

        if year_rows_remaining > 0:
            year_rows_remaining -= 1
        if year_rows_remaining == 0 and not year_match:
            active_year = None

    return values


def parse_vpi_index_html(html_text: str) -> VPILiveValue:
    parser = _DestatisTableParser()
    parser.feed(html_text)

    table = next(
        (
            candidate
            for candidate in parser.tables
            if any(
                "verbraucherpreisindex insgesamt" in str(cell["text"]).lower()
                for row in candidate
                for cell in row
            )
        ),
        None,
    )
    if table is None:
        raise ValueError("Destatis VPI HTML table not found")

    index_values = _extract_vpi_index_values(table)
    periods = sorted(period for period in index_values if _year_over_year(index_values, period) is not None)
    if not periods:
        raise ValueError("Destatis VPI HTML table does not contain comparable year-over-year values")

    current_period = periods[-1]
    previous_period = periods[-2] if len(periods) > 1 else None
    current_yoy = _year_over_year(index_values, current_period)
    previous_yoy = _year_over_year(index_values, previous_period) if previous_period else None
    if current_yoy is None:
        raise ValueError("Destatis VPI HTML table current year-over-year value is missing")

    return VPILiveValue(
        current_value=current_yoy,
        current_value_date=_format_period(*current_period),
        previous_value=previous_yoy,
        previous_value_date=_format_period(*previous_period) if previous_period else None,
    )


def _date_label_from_row(row: list[str], date_index: int) -> str:
    date_label = row[date_index].strip()
    next_cell = row[date_index + 1].strip() if date_index + 1 < len(row) else ""
    if re.fullmatch(r"20\d{2}|19\d{2}", date_label) and next_cell:
        month = MONTHS_DE.get(next_cell.lower())
        if month:
            return f"{date_label}-{month:02d}"
    return date_label


def _period_sort_key(value: str, fallback_index: int) -> tuple[int, int, int]:
    stripped = value.strip()
    year_month = re.search(r"(?P<year>20\d{2}|19\d{2})[-/.](?P<month>0?[1-9]|1[0-2])", stripped)
    if year_month:
        return (int(year_month.group("year")), int(year_month.group("month")), fallback_index)

    month_year = re.search(r"(?P<month>[A-Za-zÄÖÜäöüß]+)\s+(?P<year>20\d{2}|19\d{2})", stripped)
    if month_year:
        month = MONTHS_DE.get(month_year.group("month").lower())
        if month:
            return (int(month_year.group("year")), month, fallback_index)

    return (0, 0, fallback_index)


def parse_vpi_table(table_text: str) -> VPILiveValue:
    rows = [
        [cell.strip() for cell in row]
        for row in csv.reader(StringIO(table_text), delimiter=";")
        if any(cell.strip() for cell in row)
    ]

    header_index = None
    value_index = None
    date_index = None
    for index, row in enumerate(rows):
        lowered = [cell.lower() for cell in row]
        value_candidates = [
            cell_index
            for cell_index, cell in enumerate(lowered)
            if "vorjahresmonat" in cell or "yoy" in cell
        ]
        if value_candidates:
            header_index = index
            value_index = value_candidates[0]
            date_candidates = [
                cell_index
                for cell_index, cell in enumerate(lowered[:value_index])
                if "monat" in cell or "zeit" in cell
            ]
            date_index = date_candidates[0] if date_candidates else 0
            break

    if header_index is None or value_index is None or date_index is None:
        raise ValueError("VPI table does not contain a year-over-year column")

    values: list[tuple[tuple[int, int, int], str, float]] = []
    for offset, row in enumerate(rows[header_index + 1 :], start=1):
        if max(date_index, value_index) >= len(row):
            continue
        date_label = _date_label_from_row(row, date_index)
        value_label = row[value_index].strip()
        if not date_label or not value_label:
            continue
        try:
            parsed_value = _parse_number(value_label)
        except ValueError:
            continue
        values.append((_period_sort_key(date_label, offset), date_label, parsed_value))

    if not values:
        raise ValueError("VPI table does not contain numeric year-over-year values")

    values.sort(key=lambda entry: entry[0])
    current = values[-1]
    previous = values[-2] if len(values) > 1 else None

    return VPILiveValue(
        current_value=current[2],
        current_value_date=current[1],
        previous_value=previous[2] if previous else None,
        previous_value_date=previous[1] if previous else None,
    )


class DestatisAdapter(BaseAdapter):
    """Destatis GENESIS API — VPI und Arbeitsmarktdaten."""

    BASE_URL = "https://www-genesis.destatis.de/genesisWS/rest/2020"
    source_class = "behoerde"
    source_label = "Destatis GENESIS (VPI 61111-0002)"
    requires_api_key = False  # GAST-Fallback ohne Credentials
    output_target = "indicators"

    def __init__(self):
        super().__init__("Destatis")

    def _fetch_vpi_from_genesis(self) -> VPILiveValue:
        headers = {
            "accept": "application/octet-stream",
            "username": settings.DESTATIS_USERNAME or "GAST",
            "password": settings.DESTATIS_PASSWORD or "GAST",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "name": "61111-0002",
            "area": "all",
            "compress": "false",
            "format": "datencsv",
            "language": "de",
            "transpose": "false",
            "job": "false",
            "quality": "off",
        }
        response = requests.post(
            f"{self.BASE_URL}/data/tablefile",
            headers=headers,
            data=data,
            timeout=30,
        )

        if response.status_code != 200 or len(response.content) <= 50:
            raise ValueError(f"GENESIS HTTP {response.status_code}")

        table_text = decode_genesis_table_response(response.content, response.text)
        genesis_error = _genesis_error_message(table_text)
        if genesis_error:
            raise ValueError(genesis_error)

        return parse_vpi_table(table_text)

    def _fetch_vpi_from_html(self) -> VPILiveValue:
        response = requests.get(
            VPI_TABLE_URL,
            headers={"accept": "text/html"},
            timeout=30,
        )
        if response.status_code != 200 or "verbraucherpreisindex" not in response.text.lower():
            raise ValueError(f"Destatis HTML HTTP {response.status_code}")
        return parse_vpi_index_html(response.text)

    def _build_vpi_item(self, live_value: VPILiveValue, source_url: str) -> IngestionItem:
        return self.create_item(
            title=f"Inflation Deutschland: {live_value.current_value:.1f}% ({live_value.current_value_date})",
            description=(
                "Destatis VPI-Daten: Veränderung des Verbraucherpreisindex "
                f"zum Vorjahresmonat {live_value.current_value:.1f}%."
            ),
            source_url=source_url,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["finanzen", "lebensmittel", "gesellschaft"],
                time_to_impact="wochen",
                description="VPI misst direkt die Preisentwicklung für deutsche Haushalte.",
            ),
            methodology_tag="bia",
            affected_systems=["finanzen", "lebensmittel"],
            indicator_id="wi-inflation-vpi-de",
            current_value=live_value.current_value,
            current_value_date=live_value.current_value_date,
            previous_value=live_value.previous_value,
            previous_value_date=live_value.previous_value_date,
            source_stand_date=live_value.current_value_date,
            source_stand_label=live_value.current_value_date,
            source_period_type="month",
        )

    def fetch_vpi(self) -> List[IngestionItem]:
        try:
            try:
                live_value = self._fetch_vpi_from_genesis()
                source_url = VPI_PUBLIC_URL
            except Exception as genesis_error:
                if str(genesis_error).startswith("GENESIS HTTP"):
                    raise
                self.log_error(f"GENESIS VPI fetch failed: {genesis_error}; trying Destatis HTML table")
                live_value = self._fetch_vpi_from_html()
                source_url = VPI_TABLE_URL
            return [self._build_vpi_item(live_value, source_url)]

        except Exception as e:
            self.log_error(f"VPI fetch failed: {e}")
            error_reason = f"fetch_error: {e}" if str(e) else f"fetch_error: {type(e).__name__}"
            self.record_source_error(
                "wi-inflation-vpi-de", error_reason,
                source_url=VPI_PUBLIC_URL,
            )
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
