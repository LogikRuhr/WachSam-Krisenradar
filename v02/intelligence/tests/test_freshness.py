from datetime import date

from src.freshness import classify_freshness, load_registry_index, source_stand_from_items


def test_daily_source_from_today_is_fresh():
    result = classify_freshness(
        freshness_expectation="near-real-time",
        source_stand="2026-06-24T08:30:00+02:00",
        checked_on=date(2026, 6, 24),
        has_source_error=False,
    )

    assert result.status == "fresh"
    assert result.label == "aktuell"


def test_daily_source_from_old_day_is_stale():
    result = classify_freshness(
        freshness_expectation="daily",
        source_stand="2026-06-20",
        checked_on=date(2026, 6, 24),
        has_source_error=False,
    )

    assert result.status == "stale"
    assert "daily" in result.reason


def test_monthly_previous_month_is_acceptable_lag():
    result = classify_freshness(
        freshness_expectation="monthly",
        source_stand="2026-05",
        checked_on=date(2026, 6, 24),
        has_source_error=False,
    )

    assert result.status == "acceptable-lag"
    assert "monatlich" in result.reason


def test_monthly_lagging_official_allows_reporting_delay():
    result = classify_freshness(
        freshness_expectation="monthly-lagging-official",
        source_stand="2026-03",
        checked_on=date(2026, 6, 24),
        has_source_error=False,
    )

    assert result.status == "acceptable-lag"


def test_quarterly_previous_quarter_is_acceptable_lag():
    result = classify_freshness(
        freshness_expectation="quarterly",
        source_stand="2026-Q1",
        checked_on=date(2026, 6, 24),
        has_source_error=False,
    )

    assert result.status == "acceptable-lag"


def test_yearly_previous_year_is_archival_not_stale():
    result = classify_freshness(
        freshness_expectation="yearly",
        source_stand="2025",
        checked_on=date(2026, 6, 24),
        has_source_error=False,
    )

    assert result.status == "archival"
    assert "jährlich" in result.reason


def test_source_error_wins_over_freshness_age():
    result = classify_freshness(
        freshness_expectation="daily",
        source_stand="2026-06-24",
        checked_on=date(2026, 6, 24),
        has_source_error=True,
    )

    assert result.status == "source-error"


def test_source_stand_from_items_prefers_newest_machine_readable_stand():
    class Item:
        def __init__(self, stand):
            self.source_stand_date = stand
            self.current_value_date = None

    assert source_stand_from_items([Item("2026-05"), Item("2026-06-23")]) == "2026-06-23"


def test_registry_index_exposes_expectation_by_adapter_name():
    index = load_registry_index()

    assert index.by_adapter_name["DWD"].freshness_expectation == "near-real-time"
    assert index.by_adapter_name["BNetzA"].source_id == "gie-agsi-gas-storage"
    assert index.by_adapter_name["BIP"].freshness_expectation == "quarterly"
