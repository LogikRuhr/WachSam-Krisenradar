import csv
import re
from dataclasses import dataclass
from io import StringIO
import requests
from typing import List

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
    "februar": 2,
    "maerz": 3,
    "märz": 3,
    "april": 4,
    "mai": 5,
    "juni": 6,
    "juli": 7,
    "august": 8,
    "september": 9,
    "oktober": 10,
    "november": 11,
    "dezember": 12,
}


def _parse_number(value: str) -> float:
    normalized = value.strip().replace("+", "").replace("%", "").replace(".", "").replace(",", ".")
    return float(normalized)


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
                for cell_index, cell in enumerate(lowered)
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
        date_label = row[date_index].strip()
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

    def __init__(self):
        super().__init__("Destatis")

    def fetch_vpi(self) -> List[IngestionItem]:
        try:
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

            if response.status_code == 200 and len(response.text) > 50:
                live_value = parse_vpi_table(response.text)
                return [self.create_item(
                    title=f"Inflation Deutschland: {live_value.current_value:.1f}% ({live_value.current_value_date})",
                    description=(
                        "Destatis VPI-Daten: Veränderung des Verbraucherpreisindex "
                        f"zum Vorjahresmonat {live_value.current_value:.1f}%."
                    ),
                    source_url="https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/_inhalt.html",
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
