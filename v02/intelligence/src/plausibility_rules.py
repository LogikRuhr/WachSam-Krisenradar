"""Statische Plausibilitäts-Kalibrierung pro Indikator (W6a, Shadow-Modus).

Reine Daten — keine Secrets, kein DB-Zugriff, keine Schema-Abhängigkeit. Bewusst
in Python und NICHT in der DB (Entscheidung ADR-041 §2): die Grenzen iterieren in
der Kalibrierung stark; Config bleibt migrationsfrei flexibel.

Pro Indikator optional:
- plausibility_min / plausibility_max  → C1 (physisch/logisch unmögliche Werte)
- max_delta_percent                    → C2 (auffälliger Sprung ggü. Vorwert)

Fehlt für einen Indikator eine Regel, prüft das Gate nur C3/C4 und gibt eine
Warnung aus (kein Crash — siehe gate.evaluate_plausibility).

Werte konservativ angesetzt (lieber etwas zu weit), damit die Shadow-Auswertung
die echte Fehlalarm-Rate zeigt, bevor in W6b scharf geschaltet wird. IDs gegen
die Adapter verifiziert (BNetzA/Destatis/EIA/FAO/FRED/Tankerkönig).
"""

PLAUSIBILITY_RULES: dict[str, dict[str, float]] = {
    # Gasspeicher-Füllstand in % (0–100 physisch).
    "wi-gasspeicher-fuellstand": {"plausibility_min": 0.0, "plausibility_max": 100.0, "max_delta_percent": 15.0},
    # VPI-Inflation YoY in %. Rate → relatives Delta volatil, daher großzügig.
    "wi-inflation-vpi-de": {"plausibility_min": -5.0, "plausibility_max": 30.0, "max_delta_percent": 50.0},
    # Brent Rohöl in USD/Barrel.
    "wi-oel-brent": {"plausibility_min": 0.0, "plausibility_max": 300.0, "max_delta_percent": 25.0},
    # FAO Food Price Index (Indexpunkte).
    "wi-fao-food-price-index": {"plausibility_min": 0.0, "plausibility_max": 400.0, "max_delta_percent": 25.0},
    # Erdgas Europa in USD/MMBtu.
    "wi-gaspreis-europa": {"plausibility_min": 0.0, "plausibility_max": 400.0, "max_delta_percent": 40.0},
    # Kraftstoffe in €/Liter.
    "wi-kraftstoffpreis-super-e10": {"plausibility_min": 0.5, "plausibility_max": 5.0, "max_delta_percent": 20.0},
    "wi-kraftstoffpreis-diesel": {"plausibility_min": 0.5, "plausibility_max": 5.0, "max_delta_percent": 20.0},
}


def get_rules(indicator_id: str) -> dict | None:
    """Liefert die Plausibilitätsregel für einen Indikator oder None (kein Crash)."""
    return PLAUSIBILITY_RULES.get(indicator_id)
