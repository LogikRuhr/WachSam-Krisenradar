import csv
from io import StringIO
from typing import List

import requests

from .base import BaseAdapter
from .destatis import decode_genesis_table_response, _parse_number, _period_sort_key
from ..config import settings
from ..models import GermanyRelevance, IngestionItem

# Datenquelle: Destatis GENESIS Tabelle 13211-0002
# Monatliche Arbeitslose Deutschland nach BA-Registrierungsstatistik (Insgesamt).
# Verifiziert 2026-06-16: Spaltenstruktur Insgesamt;Jahr;Monat;Anzahl;Quote;...
# Aktuellster Wert: 2026-05 = 2.950.456 Personen ≈ 2,95 Mio.
# Passend zu Seed-Label "Registrierte Arbeitslose Deutschland",
# threshold_warn 3.0 Mio, critical 3.5 Mio, germany_relevance "3,1 Mio Januar 2026".
_GENESIS_TABLE = "13211-0002"
_BASE_URL = "https://www-genesis.destatis.de/genesisWS/rest/2020"
_SOURCE_URL = (
    "https://www.destatis.de/DE/Themen/Arbeit/Arbeitsmarkt/Arbeitslosigkeit/"
    "_inhalt.html"
)

# Monatsname → Zahl (für _date_label_from_row-Logik)
_MONTHS_DE = {
    "januar": 1, "februar": 2, "märz": 3, "maerz": 3,
    "april": 4, "mai": 5, "juni": 6, "juli": 7,
    "august": 8, "september": 9, "oktober": 10,
    "november": 11, "dezember": 12,
}


def parse_arbeitslosigkeit_table(table_text: str) -> dict:
    """Parst GENESIS-Tabelle 13211-0002 (Monatsdaten, BA-Statistik).

    Spaltenstruktur (verifiziert 2026-06-16):
      Region;Jahr;Monat;Arbeitslose(Anzahl);Quote1;Quote2;...
    Filtert auf "Insgesamt" (Gesamtdeutschland), kombiniert Jahr+Monat zu
    ISO-Periode "2026-05", konvertiert Anzahl Personen → Millionen Personen.
    Gibt {'current': {'period', 'value'}, 'previous': ...} zurück.
    """
    rows = [
        [cell.strip() for cell in row]
        for row in csv.reader(StringIO(table_text), delimiter=";")
        if any(cell.strip() for cell in row)
    ]

    # Header-Zeile identifizieren: erste Zeile die "Anzahl" in einer Zelle hat
    # und mindestens 4 Felder; davor gibt es 3 Header-Metazeilen der GENESIS-CSV.
    header_index = None
    for index, row in enumerate(rows):
        lowered = [c.lower() for c in row]
        if any("anzahl" in c for c in lowered) and len(row) >= 4:
            header_index = index
            break

    if header_index is None:
        raise ValueError(
            "Arbeitslosigkeit-Tabelle 13211-0002: Keine Anzahl-Spalte gefunden"
        )

    values: list[tuple] = []
    for offset, row in enumerate(rows[header_index + 1:], start=1):
        if len(row) < 4:
            continue
        # Nur Zeilen für Gesamtdeutschland ("Insgesamt")
        region = row[0].strip().lower()
        if "insgesamt" not in region:
            continue

        year_str = row[1].strip()
        month_str = row[2].strip().lower()
        value_str = row[3].strip()

        # Leere oder Platzhalter-Werte überspringen
        if not year_str or not month_str or not value_str or value_str in ("...", "-", ""):
            continue

        month_num = _MONTHS_DE.get(month_str)
        if month_num is None:
            continue

        try:
            int(year_str)  # Jahresformat sicherstellen
        except ValueError:
            continue

        period = f"{year_str}-{month_num:02d}"
        try:
            raw_count = _parse_number(value_str)
        except ValueError:
            continue

        # Anzahl Personen → Millionen Personen
        value_mio = raw_count / 1_000_000.0
        values.append((_period_sort_key(period, offset), period, value_mio))

    if not values:
        raise ValueError(
            "Arbeitslosigkeit-Tabelle 13211-0002: Keine numerischen Werte gefunden"
        )

    values.sort(key=lambda e: e[0])
    current = values[-1]
    previous = values[-2] if len(values) > 1 else None

    return {
        "current": {"period": current[1], "value": current[2]},
        "previous": {"period": previous[1], "value": previous[2]} if previous else None,
    }


class ArbeitslosigkeitAdapter(BaseAdapter):
    """Registrierte Arbeitslose Deutschland — Destatis GENESIS 13211-0002 (monatlich).

    Verifiziert 2026-06-16: Tabelle liefert BA-Registrierungsstatistik, monatlich,
    Gesamtdeutschland. Aktuellster Wert: 2026-05 = 2.950.456 ≈ 2,95 Mio Personen.
    Einheit: Millionen Personen — passend zu Seed threshold_warn 3.0 / critical 3.5.
    """

    source_label = "Destatis GENESIS (13211-0002 — Registrierte Arbeitslose DE, BA)"
    source_class = "behoerde"
    requires_api_key = False  # DESTATIS_USERNAME/PASSWORD (GAST bei offenen Tabellen)
    output_target = "indicators"

    def __init__(self):
        super().__init__("Arbeitslosigkeit")
        self._settings = settings

    def fetch_arbeitslosigkeit(self) -> List[IngestionItem]:
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
                timeout=40,
            )

            if response.status_code == 200 and len(response.content) > 50:
                table_text = decode_genesis_table_response(response.content, response.text)
                try:
                    parsed = parse_arbeitslosigkeit_table(table_text)
                except ValueError as parse_err:
                    self.log_error(f"Arbeitslosigkeit parse error: {parse_err}")
                    self.record_source_error(
                        "wi-arbeitslosigkeit-de", f"parse_error: {parse_err}",
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
                    title=(
                        f"Registrierte Arbeitslose Deutschland: {current_value:.3f} Mio"
                        f" ({current_period}, BA)"
                    ),
                    description=(
                        f"Destatis GENESIS 13211-0002 — Registrierte Arbeitslose "
                        f"Deutschland (BA-Statistik): {current_value:.3f} Millionen "
                        f"Personen in {current_period} (monatlich)."
                    ),
                    source_url=_SOURCE_URL,
                    germany_relevance=GermanyRelevance(
                        direct=True,
                        systems_affected=["arbeit", "gesellschaft", "finanzen"],
                        time_to_impact="monate",
                        description=(
                            "BA-registrierte Arbeitslosigkeit wirkt direkt auf "
                            "Kaufkraft, Sozialausgaben und wirtschaftliche Stabilität."
                        ),
                    ),
                    methodology_tag="steep",
                    affected_systems=["arbeit", "gesellschaft", "finanzen"],
                    indicator_id="wi-arbeitslosigkeit-de",
                    current_value=current_value,
                    current_value_date=current_period,
                    previous_value=previous_value,
                    previous_value_date=previous_period,
                    source_stand_date=current_period,
                    source_stand_label=current_period,
                    source_period_type="month",
                )]

            self.log_error(
                f"Arbeitslosigkeit fetch: HTTP {response.status_code}"
            )
            self.record_source_error(
                "wi-arbeitslosigkeit-de", f"HTTP {response.status_code}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

        except Exception as e:
            self.log_error(f"Arbeitslosigkeit fetch failed: {e}")
            self.record_source_error(
                "wi-arbeitslosigkeit-de", f"fetch_error: {type(e).__name__}",
                source_url=_SOURCE_URL,
            )
            return self._fallback()

    def _fallback(self) -> List[IngestionItem]:
        """Fallback-Item bei nicht erreichbarem GENESIS-Endpunkt."""
        return [self.create_item(
            title="Registrierte Arbeitslose Deutschland — Datenquelle prüfen",
            description=(
                "Destatis GENESIS 13211-0002 nicht erreichbar oder Auth fehlt. "
                "Manuelle Prüfung erforderlich."
            ),
            source_url=_SOURCE_URL,
            germany_relevance=GermanyRelevance(
                direct=True,
                systems_affected=["arbeit", "gesellschaft", "finanzen"],
                time_to_impact="monate",
                description="Arbeitslosigkeits-Daten nicht abrufbar.",
            ),
            methodology_tag="steep",
            affected_systems=["arbeit", "gesellschaft", "finanzen"],
            confidence_suggestion="niedrig",
        )]

    def fetch_latest(self) -> List[IngestionItem]:
        return self.fetch_arbeitslosigkeit()
