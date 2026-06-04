"""Plausibilitäts-Gate (W6a — Shadow / Log-only).

Reine Bewertungsfunktion ohne Seiteneffekte (Muster wie validation.py): bewertet
einen Indikator-Messwert gegen vier Check-Familien und leitet ein `would_action`
ab. Im Shadow-Modus wird NICHTS ausgeführt — das Verdikt wird nur geloggt. Es
gibt hier KEINE DB-Writes, kein Blockieren, kein Stale-on-error, keinen Eingriff
in `current_value`.

Check-Familien:
- C1  Plausibilitätsgrenze  (Wert physisch/logisch unmöglich)        → keep_previous_value
- C2  Delta-Anomalie        (Sprung > max_delta_percent ggü. Vorwert) → accept_with_review
- C3  Schwellenriss         (Warn/Kritisch überschritten)             → accept_with_review
- C4  Quelle/Parsing        (unparsebar oder Quellenfehler/Fallback)  → parsing_error / keep_previous_value
- ok                                                                  → accept_normal

Präzedenz (hart → weich): C4 → C1 → C3 → C2. Der härteste Treffer bestimmt
gate_class/would_action; alle Treffer werden im `reason`/in den Details geführt.

Vgl. docs/intelligence/plausibility-gate-plan.md, docs/adr/041-plausibility-gate.md.
"""
import json
import math
from dataclasses import dataclass, field
from typing import Any, List, Optional

# gate_class
GATE_OK = "ok"
GATE_C1 = "C1"
GATE_C2 = "C2"
GATE_C3 = "C3"
GATE_C4 = "C4"

# would_action
ACTION_ACCEPT_NORMAL = "accept_normal"
ACTION_ACCEPT_WITH_REVIEW = "accept_with_review"
ACTION_KEEP_PREVIOUS = "keep_previous_value"
ACTION_PARSING_ERROR = "parsing_error"

# Präzedenz: erster vorhandener gewinnt.
_PRECEDENCE = (GATE_C4, GATE_C1, GATE_C3, GATE_C2)

SHADOW_EVENT = "plausibility_gate_shadow"


@dataclass
class GateVerdict:
    indicator_id: str
    raw_value: Any
    parsed_value: Optional[float]
    previous_value: Optional[float]
    gate_class: str
    would_action: str
    reason: str
    warnings: List[str] = field(default_factory=list)


def _coerce_float(x: Any) -> Optional[float]:
    """float-Parse mit Schutz: bool/None/Strings/NaN/inf → None."""
    if x is None or isinstance(x, bool):
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(v) or math.isinf(v):
        return None
    return v


def _json_safe(x: Any) -> Any:
    """Macht einen Wert JSON-tauglich (für raw_value im Log)."""
    if x is None or isinstance(x, (int, str, bool)):
        return x
    if isinstance(x, float):
        return x if math.isfinite(x) else None
    return str(x)


def _check_threshold(value: float, thresholds: dict, scale_direction: str) -> Optional[dict]:
    """C3: prüft Warn/Kritisch unter Berücksichtigung der Skalenrichtung."""
    warn = _coerce_float(thresholds.get("threshold_warn"))
    crit = _coerce_float(thresholds.get("threshold_critical"))
    lower_is_worse = scale_direction == "lower_is_worse"

    if lower_is_worse:
        if crit is not None and value <= crit:
            return {"level": "kritisch", "threshold": crit, "value": value, "scale_direction": scale_direction}
        if warn is not None and value <= warn:
            return {"level": "warn", "threshold": warn, "value": value, "scale_direction": scale_direction}
    else:  # higher_is_worse (Default)
        if crit is not None and value >= crit:
            return {"level": "kritisch", "threshold": crit, "value": value, "scale_direction": scale_direction}
        if warn is not None and value >= warn:
            return {"level": "warn", "threshold": warn, "value": value, "scale_direction": scale_direction}
    return None


def _reason_for(gate_class: str, detail: dict) -> str:
    """Kurzer menschenlesbarer Grund für den gewinnenden Treffer."""
    if gate_class == GATE_OK:
        return "alle Checks bestanden"
    if gate_class == GATE_C1:
        if detail.get("check") == "plausibility_min":
            return f"C1 Plausibilitätsgrenze: {detail['value']} < min {detail['min']}"
        return f"C1 Plausibilitätsgrenze: {detail['value']} > max {detail['max']}"
    if gate_class == GATE_C2:
        return f"C2 Delta-Anomalie: {detail['delta_percent']}% > {detail['limit']}%"
    if gate_class == GATE_C3:
        return f"C3 Schwellenriss ({detail['level']}): {detail['value']} vs {detail['threshold']} ({detail['scale_direction']})"
    if gate_class == GATE_C4:
        if detail.get("check") == "parsing":
            return f"C4 Parsing: Wert nicht als endliche Zahl parsebar ({detail.get('raw_value')!r})"
        return "C4 Quellenfehler: Adapter meldete Quellen-/Fallback-Fehler"
    return ""


def evaluate_plausibility(
    indicator_id: str,
    raw_value: Any,
    previous_value: Optional[float] = None,
    rules: Optional[dict] = None,
    thresholds: Optional[dict] = None,
    scale_direction: str = "higher_is_worse",
    source_error: bool = False,
) -> GateVerdict:
    """Bewertet einen Indikator-Messwert. Rein, ohne Seiteneffekt.

    Parameter
    - raw_value: roher Adapter-Wert (kann None/unparsebar sein → C4 parsing_error)
    - previous_value: Vorwert für C2 (Delta)
    - rules: PLAUSIBILITY_RULES[indicator_id] oder None (None → C1/C2 übersprungen)
    - thresholds: {threshold_warn, threshold_critical, scale_direction} oder None
                  (None → C3 übersprungen); read-only aus der DB geliefert
    - source_error: True, wenn der Adapter einen Quellen-/Fallback-Fehler meldet → C4
    """
    warnings: List[str] = []
    hits: dict = {}
    parsed = _coerce_float(raw_value)

    # --- C4: Quelle / Parsing ---
    if source_error:
        hits[GATE_C4] = {"check": "source_error"}
    if parsed is None:
        # Parsing-Fehler dominiert ein evtl. source_error-Flag (Wert ist ohnehin unbrauchbar).
        hits[GATE_C4] = {"check": "parsing", "raw_value": _json_safe(raw_value)}

    # C1/C2/C3 nur sinnvoll, wenn ein endlicher Zahlenwert vorliegt.
    if parsed is not None:
        # --- C1: harte Plausibilitätsgrenze ---
        if rules is None:
            warnings.append(f"keine PLAUSIBILITY_RULES für '{indicator_id}' — C1/C2 übersprungen")
        else:
            pmin = rules.get("plausibility_min")
            pmax = rules.get("plausibility_max")
            if pmin is not None and parsed < pmin:
                hits[GATE_C1] = {"check": "plausibility_min", "value": parsed, "min": pmin}
            elif pmax is not None and parsed > pmax:
                hits[GATE_C1] = {"check": "plausibility_max", "value": parsed, "max": pmax}

        # --- C3: Schwellenriss (vorhandene DB-Schwellen, read-only) ---
        if thresholds is None:
            warnings.append(f"keine DB-Schwellen für '{indicator_id}' — C3 übersprungen")
        else:
            c3 = _check_threshold(parsed, thresholds, scale_direction)
            if c3:
                hits[GATE_C3] = c3

        # --- C2: Delta-Anomalie ---
        if rules is not None and rules.get("max_delta_percent") is not None:
            limit = rules["max_delta_percent"]
            if previous_value is None:
                warnings.append(f"kein previous_value für '{indicator_id}' — C2 übersprungen")
            elif previous_value == 0:
                warnings.append(f"previous_value=0 für '{indicator_id}' — C2-Delta nicht berechenbar")
            else:
                delta_pct = abs(parsed - previous_value) / abs(previous_value) * 100.0
                if delta_pct > limit:
                    hits[GATE_C2] = {"check": "max_delta", "delta_percent": round(delta_pct, 2), "limit": limit}

    # --- Gewinner nach Präzedenz ---
    winner = next((c for c in _PRECEDENCE if c in hits), GATE_OK)

    if winner == GATE_C4:
        would_action = ACTION_PARSING_ERROR if hits[GATE_C4].get("check") == "parsing" else ACTION_KEEP_PREVIOUS
    elif winner == GATE_C1:
        would_action = ACTION_KEEP_PREVIOUS
    elif winner in (GATE_C2, GATE_C3):
        would_action = ACTION_ACCEPT_WITH_REVIEW
    else:
        would_action = ACTION_ACCEPT_NORMAL

    reason = _reason_for(winner, hits.get(winner, {}))
    # Mehrfachtreffer transparent mitführen (über den Gewinner hinaus).
    if len(hits) > 1:
        reason += " | weitere: " + json.dumps(
            {k: v for k, v in hits.items() if k != winner}, ensure_ascii=False, sort_keys=True
        )

    return GateVerdict(
        indicator_id=indicator_id,
        raw_value=_json_safe(raw_value),
        parsed_value=parsed,
        previous_value=previous_value,
        gate_class=winner,
        would_action=would_action,
        reason=reason,
        warnings=warnings,
    )


def build_shadow_log(item, verdict: GateVerdict) -> dict:
    """Strukturiertes Shadow-Log-Dict mit allen Pflichtfeldern (W6a).

    Reine Abbildung Item+Verdikt → dict; das Aufruf-Modul serialisiert/druckt es.
    """
    source_stand = getattr(item, "source_stand_label", None) or getattr(item, "source_stand_date", None)
    return {
        "event": SHADOW_EVENT,
        "indicator_id": verdict.indicator_id,
        "raw_value": verdict.raw_value,
        "parsed_value": verdict.parsed_value,
        "previous_value": verdict.previous_value,
        "gate_class": verdict.gate_class,
        "would_action": verdict.would_action,
        "reason": verdict.reason,
        "source_name": getattr(item, "source_url", None),
        "source_stand": source_stand,
        "observed_at": getattr(item, "current_value_date", None),
        "warnings": verdict.warnings,
    }
