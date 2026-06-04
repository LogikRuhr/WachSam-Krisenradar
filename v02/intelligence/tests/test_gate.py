"""Unit-Tests für das Plausibilitäts-Gate (W6a, Shadow). Rein gemockt, kein DB/Netz."""
from src.gate import (
    evaluate_plausibility,
    source_error_verdict,
    build_shadow_log,
    GateVerdict,
    SHADOW_EVENT,
    GATE_OK, GATE_C1, GATE_C2, GATE_C3, GATE_C4,
    ACTION_ACCEPT_NORMAL, ACTION_ACCEPT_WITH_REVIEW,
    ACTION_KEEP_PREVIOUS, ACTION_PARSING_ERROR,
)

RULES = {"plausibility_min": 0.0, "plausibility_max": 300.0, "max_delta_percent": 25.0}
THRESH_HIGH = {"threshold_warn": 100.0, "threshold_critical": 200.0}   # higher_is_worse
THRESH_FAR = {"threshold_warn": 250.0, "threshold_critical": 290.0}    # nicht gerissen bei ~150


class _StubItem:
    """Minimales Item für build_shadow_log (nur die genutzten Attribute)."""
    def __init__(self):
        self.source_url = "https://agsi.gie.eu/"
        self.source_stand_label = "27. Mai 2026"
        self.source_stand_date = "2026-05-27"
        self.current_value_date = "2026-05-27"


# --- Präzedenz ---------------------------------------------------------------

def test_c4_source_error_wins_over_everything():
    # Wert verletzt zusätzlich C1 (>300), C3 (>=200) und C2 (großes Delta).
    v = evaluate_plausibility(
        "wi-oel-brent", raw_value=500.0, previous_value=100.0,
        rules=RULES, thresholds=THRESH_HIGH, source_error=True,
    )
    assert v.gate_class == GATE_C4
    assert v.would_action == ACTION_KEEP_PREVIOUS


def test_c4_parsing_when_value_unparseable():
    for bad in (None, "abc", float("nan")):
        v = evaluate_plausibility("wi-oel-brent", raw_value=bad, rules=RULES, thresholds=THRESH_HIGH)
        assert v.gate_class == GATE_C4
        assert v.would_action == ACTION_PARSING_ERROR
        assert v.parsed_value is None


def test_c1_wins_over_c3_and_c2():
    v = evaluate_plausibility(
        "wi-oel-brent", raw_value=500.0, previous_value=100.0,
        rules=RULES, thresholds=THRESH_HIGH,
    )
    assert v.gate_class == GATE_C1
    assert v.would_action == ACTION_KEEP_PREVIOUS


def test_c3_wins_over_c2():
    # 150 in [0,300] (kein C1), >=100 warn (C3), Delta 36% > 25 (C2).
    v = evaluate_plausibility(
        "wi-oel-brent", raw_value=150.0, previous_value=110.0,
        rules=RULES, thresholds=THRESH_HIGH,
    )
    assert v.gate_class == GATE_C3
    assert v.would_action == ACTION_ACCEPT_WITH_REVIEW
    assert "warn" in v.reason


def test_c2_detects_anomalous_delta():
    # In Range, Schwelle weit weg → nur Delta 40% > 25 schlägt an.
    v = evaluate_plausibility(
        "wi-oel-brent", raw_value=140.0, previous_value=100.0,
        rules=RULES, thresholds=THRESH_FAR,
    )
    assert v.gate_class == GATE_C2
    assert v.would_action == ACTION_ACCEPT_WITH_REVIEW


def test_ok_stays_accept_normal():
    v = evaluate_plausibility(
        "wi-oel-brent", raw_value=105.0, previous_value=100.0,
        rules=RULES, thresholds=THRESH_FAR,
    )
    assert v.gate_class == GATE_OK
    assert v.would_action == ACTION_ACCEPT_NORMAL
    assert v.warnings == []


def test_c3_lower_is_worse_direction():
    # Gasspeicher: niedrig = schlecht. 30 <= warn 40 → C3 warn.
    gas_rules = {"plausibility_min": 0.0, "plausibility_max": 100.0, "max_delta_percent": 15.0}
    v = evaluate_plausibility(
        "wi-gasspeicher-fuellstand", raw_value=30.0, previous_value=35.0,
        rules=gas_rules, thresholds={"threshold_warn": 40.0, "threshold_critical": 20.0},
        scale_direction="lower_is_worse",
    )
    assert v.gate_class == GATE_C3
    assert v.would_action == ACTION_ACCEPT_WITH_REVIEW


# --- Robustheit --------------------------------------------------------------

def test_missing_config_does_not_crash():
    v = evaluate_plausibility("wi-unbekannt", raw_value=150.0, previous_value=100.0, rules=None, thresholds=None)
    assert isinstance(v, GateVerdict)
    assert v.gate_class == GATE_OK            # C1/C2/C3 alle übersprungen
    assert v.would_action == ACTION_ACCEPT_NORMAL
    assert len(v.warnings) >= 2               # fehlende Rules + fehlende Schwellen


def test_missing_previous_skips_c2_with_warning():
    v = evaluate_plausibility("wi-oel-brent", raw_value=150.0, previous_value=None, rules=RULES, thresholds=THRESH_FAR)
    assert v.gate_class == GATE_OK
    assert any("previous_value" in w for w in v.warnings)


def test_previous_zero_skips_c2_without_crash():
    v = evaluate_plausibility("wi-oel-brent", raw_value=150.0, previous_value=0, rules=RULES, thresholds=THRESH_FAR)
    assert v.gate_class == GATE_OK
    assert any("previous_value=0" in w for w in v.warnings)


# --- Shadow-Log --------------------------------------------------------------

REQUIRED_SHADOW_FIELDS = {
    "event", "indicator_id", "raw_value", "parsed_value", "previous_value",
    "gate_class", "would_action", "reason", "source_name", "source_stand", "observed_at",
}


def test_build_shadow_log_contains_all_required_fields():
    v = evaluate_plausibility("wi-oel-brent", raw_value=150.0, previous_value=110.0, rules=RULES, thresholds=THRESH_HIGH)
    log = build_shadow_log(_StubItem(), v)
    assert REQUIRED_SHADOW_FIELDS.issubset(log.keys())
    assert log["event"] == SHADOW_EVENT
    assert log["indicator_id"] == "wi-oel-brent"
    assert log["source_name"] == "https://agsi.gie.eu/"
    assert log["source_stand"] == "27. Mai 2026"
    assert log["observed_at"] == "2026-05-27"


# --- C4-Quellfehler-Verdikt (W6a.1) ------------------------------------------

def test_source_error_verdict_is_c4_keep_previous_by_default():
    """Fetch-/Quellfehler ohne neuen Wert → C4, behält Vorwert (Shadow)."""
    v = source_error_verdict("wi-inflation-vpi-de", "HTTP 401")
    assert isinstance(v, GateVerdict)
    assert v.gate_class == GATE_C4
    assert v.would_action == ACTION_KEEP_PREVIOUS
    assert v.indicator_id == "wi-inflation-vpi-de"
    assert v.parsed_value is None
    assert v.raw_value is None
    assert v.previous_value is None


def test_source_error_verdict_reason_carries_compact_detail():
    """Der reason transportiert die kompakte Fehlerbeschreibung (z.B. HTTP 400)."""
    v = source_error_verdict("wi-gaspreis-europa", "HTTP 400")
    assert "HTTP 400" in v.reason


def test_source_error_verdict_parsing_variant():
    """Wert kam an, war aber unparsebar → parsing_error statt keep_previous."""
    v = source_error_verdict("wi-oel-brent", "parse_error", raw_value="N/A", keep_previous=False)
    assert v.gate_class == GATE_C4
    assert v.would_action == ACTION_PARSING_ERROR
    assert v.raw_value == "N/A"
    assert v.parsed_value is None


def test_source_error_verdict_works_with_build_shadow_log():
    """source_error_verdict ist mit build_shadow_log kompatibel (alle Pflichtfelder)."""
    v = source_error_verdict("wi-inflation-vpi-de", "HTTP 401")
    log = build_shadow_log(_StubItem(), v)
    assert REQUIRED_SHADOW_FIELDS.issubset(log.keys())
    assert log["gate_class"] == GATE_C4
    assert log["raw_value"] is None
    assert log["parsed_value"] is None
