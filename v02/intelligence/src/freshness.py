from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Iterable

import yaml

FreshnessStatus = str


@dataclass(frozen=True)
class FreshnessResult:
    status: FreshnessStatus
    label: str
    reason: str
    expectation: str
    source_stand: str | None


@dataclass(frozen=True)
class RegistrySource:
    source_id: str
    name: str
    adapter_name: str | None
    status: str
    freshness_expectation: str


@dataclass(frozen=True)
class RegistryIndex:
    by_adapter_name: dict[str, RegistrySource]
    by_source_id: dict[str, RegistrySource]


ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "source_registry.yaml"


def _adapter_name(adapter_path: str | None) -> str | None:
    if not adapter_path:
        return None
    name = adapter_path.rsplit(".", 1)[-1]
    return name[:-7] if name.endswith("Adapter") else name


def load_registry_index(path: str | Path = REGISTRY) -> RegistryIndex:
    with Path(path).open(encoding="utf-8") as handle:
        registry = yaml.safe_load(handle)
    by_adapter_name: dict[str, RegistrySource] = {}
    by_source_id: dict[str, RegistrySource] = {}
    for source in registry.get("sources", []):
        entry = RegistrySource(
            source_id=source["id"],
            name=source["name"],
            adapter_name=_adapter_name(source.get("adapter")),
            status=source["status"],
            freshness_expectation=source["freshness_expectation"],
        )
        by_source_id[entry.source_id] = entry
        if entry.adapter_name:
            by_adapter_name[entry.adapter_name] = entry
    return RegistryIndex(by_adapter_name=by_adapter_name, by_source_id=by_source_id)


def _parse_stand(value: str | None) -> tuple[str, date] | None:
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None
    try:
        if "T" in raw:
            normalized = raw.replace("Z", "+00:00")
            return "date", datetime.fromisoformat(normalized).date()
        if len(raw) == 10 and raw[4] == "-" and raw[7] == "-":
            return "date", date.fromisoformat(raw)
        if "-Q" in raw:
            year, quarter = raw.split("-Q", 1)
            month = (int(quarter) - 1) * 3 + 1
            return "quarter", date(int(year), month, 1)
        if len(raw) == 7 and raw[4] == "-":
            year, month = raw.split("-")
            return "month", date(int(year), int(month), 1)
        if len(raw) == 4 and raw.isdigit():
            return "year", date(int(raw), 1, 1)
    except (TypeError, ValueError):
        return None
    return None


def _month_index(day: date) -> int:
    return day.year * 12 + day.month


def _quarter_index(day: date) -> int:
    return day.year * 4 + ((day.month - 1) // 3) + 1


def _business_days_between(start: date, end: date) -> int:
    """Arbeitstage nach ``start`` bis einschließlich ``end`` zählen.

    Der Registry-Typ ist bewusst ohne Feiertagskalender definiert: Wochenenden
    dürfen einen täglichen Datenstand nicht künstlich rot machen, mehrere
    reguläre Arbeitstage ohne neuen Stand aber schon.
    """
    if end <= start:
        return 0
    count = 0
    current = start
    while current < end:
        current = date.fromordinal(current.toordinal() + 1)
        if current.weekday() < 5:
            count += 1
    return count


def _quarter_start(day: date) -> date:
    return date(day.year, ((day.month - 1) // 3) * 3 + 1, 1)


def classify_freshness(
    *,
    freshness_expectation: str,
    source_stand: str | None,
    checked_on: date | None = None,
    has_source_error: bool = False,
) -> FreshnessResult:
    checked_on = checked_on or date.today()
    expectation = (freshness_expectation or "unknown").lower()
    parsed = _parse_stand(source_stand)

    if has_source_error:
        return FreshnessResult("source-error", "Quellenfehler", "Quelle meldet Fehler; letzter guter Wert bleibt maßgeblich.", expectation, source_stand)
    if not parsed:
        return FreshnessResult("stale", "Stand unklar", "kein maschinenlesbarer Quellenstand", expectation, source_stand)

    period_type, stand_date = parsed

    if expectation in {"near-real-time", "daily", "daily-sample"}:
        age_days = (checked_on - stand_date).days
        if age_days <= 1:
            return FreshnessResult("fresh", "aktuell", f"{expectation}: Stand höchstens 1 Tag alt", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"{expectation}: Stand {age_days} Tage alt", expectation, source_stand)

    if expectation == "daily-business-days":
        business_days = _business_days_between(stand_date, checked_on)
        # GIE veröffentlicht den Gas-Stand mit einem Verarbeitungstag Abstand.
        # Zwei Arbeitstage decken diesen regulären Veröffentlichungsverzug plus
        # Wochenenden ab, ohne ältere Werte dauerhaft als aktuell auszugeben.
        if business_days <= 2:
            return FreshnessResult(
                "fresh",
                "aktuell",
                "arbeitstagsaktuelle Quelle; Stand innerhalb des Veröffentlichungsfensters",
                expectation,
                source_stand,
            )
        return FreshnessResult(
            "stale",
            "veraltet",
            f"arbeitstagsaktuelle Quelle: Stand {business_days} Arbeitstage alt",
            expectation,
            source_stand,
        )

    if expectation == "daily-market-days":
        age_days = (checked_on - stand_date).days
        if age_days <= 10:
            return FreshnessResult("fresh", "aktuell", "Marktdaten mit Wochenend-/Feiertagsverzug", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"Marktdatenstand {age_days} Tage alt", expectation, source_stand)

    if expectation == "monthly":
        delta = _month_index(checked_on) - _month_index(stand_date)
        if delta <= 1:
            return FreshnessResult("acceptable-lag", "offiziell verzögert", "monatlich veröffentlichte Quelle; Vormonat ist akzeptabel", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"monatlich erwartete Quelle ist {delta} Monate zurück", expectation, source_stand)

    if expectation == "monthly-lagging-official":
        delta = _month_index(checked_on) - _month_index(stand_date)
        if delta <= 4:
            return FreshnessResult("acceptable-lag", "offiziell verzögert", "amtliche Monatsquelle mit Melde-/Veröffentlichungsverzug", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"amtliche Monatsquelle ist {delta} Monate zurück", expectation, source_stand)

    if expectation == "quarterly":
        delta = _quarter_index(checked_on) - _quarter_index(stand_date)
        if delta <= 1:
            return FreshnessResult("acceptable-lag", "offiziell verzögert", "quartalsweise Quelle; letztes Quartal ist akzeptabel", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"quartalsweise erwartete Quelle ist {delta} Quartale zurück", expectation, source_stand)

    if expectation == "quarterly-release-window":
        current_quarter_start = _quarter_start(checked_on)
        delta = _quarter_index(current_quarter_start) - _quarter_index(stand_date)
        days_since_quarter_start = (checked_on - current_quarter_start).days
        if delta <= 1:
            return FreshnessResult(
                "fresh",
                "aktuell",
                "quartalsweise Quelle liefert den jüngsten abgeschlossenen Zeitraum",
                expectation,
                source_stand,
            )
        if delta == 2 and days_since_quarter_start <= 65:
            return FreshnessResult(
                "acceptable-lag",
                "offiziell verzögert",
                "quartalsweise Quelle innerhalb des T+65-Veröffentlichungsfensters",
                expectation,
                source_stand,
            )
        return FreshnessResult(
            "stale",
            "veraltet",
            "quartalsweise Quelle außerhalb des T+65-Veröffentlichungsfensters",
            expectation,
            source_stand,
        )

    if expectation == "event-driven-policy":
        if stand_date > checked_on:
            return FreshnessResult(
                "stale",
                "Stand unklar",
                "ereignisgetriebene Policy-Quelle meldet einen zukünftigen Stand",
                expectation,
                source_stand,
            )
        return FreshnessResult(
            "acceptable-lag",
            "aktuell",
            "ereignisgetriebene Policy-Quelle; Abruf erfolgreich, Wert seit letzter Entscheidung unverändert",
            expectation,
            source_stand,
        )

    if expectation in {"yearly", "annual", "product-dependent"} or period_type == "year":
        if checked_on.year - stand_date.year <= 1:
            return FreshnessResult("archival", "langsam aktualisiert", "jährlich/offiziell verzögerte Quelle", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"jährliche Quelle ist {checked_on.year - stand_date.year} Jahre zurück", expectation, source_stand)

    if expectation.startswith("continuous"):
        age_days = (checked_on - stand_date).days
        if age_days <= 3:
            return FreshnessResult("fresh", "aktuell", "laufende redaktionelle Quelle", expectation, source_stand)
        return FreshnessResult("stale", "veraltet", f"laufende Quelle ist {age_days} Tage zurück", expectation, source_stand)

    return FreshnessResult("acceptable-lag", "nicht pauschal bewertet", f"keine feste Frischelogik für {expectation}", expectation, source_stand)


def source_stand_from_items(items: Iterable[object]) -> str | None:
    candidates: list[tuple[date, str]] = []
    for item in items:
        raw = getattr(item, "source_stand_date", None) or getattr(item, "current_value_date", None)
        parsed = _parse_stand(raw)
        if parsed:
            candidates.append((parsed[1], raw))
    if not candidates:
        return None
    return max(candidates, key=lambda pair: pair[0])[1]
