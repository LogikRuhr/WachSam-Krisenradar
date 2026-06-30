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
    "wi-kraftstoffpreis-super-e5": {"plausibility_min": 0.5, "plausibility_max": 5.0, "max_delta_percent": 20.0},
    "wi-kraftstoffpreis-super-e10": {"plausibility_min": 0.5, "plausibility_max": 5.0, "max_delta_percent": 20.0},
    "wi-kraftstoffpreis-diesel": {"plausibility_min": 0.5, "plausibility_max": 5.0, "max_delta_percent": 20.0},
    # BIP-Wachstum QoQ in %. Historische Extreme: Finanzkrise/Covid -10% QoQ;
    # max_delta_percent 200 konservativ (Rate kann von -2% auf +2% springen).
    "wi-bip-wachstum-de": {"plausibility_min": -15.0, "plausibility_max": 15.0, "max_delta_percent": 200.0},
    # Unternehmensinsolvenzen absolut (Anzahl/Monat). Historisch ~1000–3500.
    # 2023 ca. 1700–2200/Monat; oberes Limit konservativ 60000.
    "wi-insolvenzen-de": {"plausibility_min": 0.0, "plausibility_max": 60000.0, "max_delta_percent": 40.0},
    # Registrierte Arbeitslose in Millionen Personen (BA-Statistik, GENESIS 13211-0002).
    # Aktuelle Werte ca. 2,9–3,1 Mio; threshold_warn 3.0, critical 3.5 Mio.
    # Historisch: Minimum ~2,0 Mio (2019), Maximum ~5,0 Mio (2005).
    "wi-arbeitslosigkeit-de": {"plausibility_min": 1.0, "plausibility_max": 8.0, "max_delta_percent": 15.0},
    # EZB-Leitzins (DFR) in %. Historisch -0.5% bis +4.5%; max_delta liberal da
    # Zinsschritte selten >0.75 pp aber relative Änderung kann groß sein.
    "wi-ezb-leitzins": {"plausibility_min": -1.0, "plausibility_max": 10.0, "max_delta_percent": 100.0},
    # Staatsschuldenquote in % des BIP. EU-Referenzwert 60%; Deutschland historisch 40–85%.
    # Jahreswerte → max_delta_percent 10 (10%-Punkt/Jahr ist außergewöhnlich hoch).
    "wi-staatsschuldenquote-de": {"plausibility_min": 0.0, "plausibility_max": 200.0, "max_delta_percent": 10.0},
}


def get_rules(indicator_id: str) -> dict | None:
    """Liefert die Plausibilitätsregel für einen Indikator oder None (kein Crash)."""
    return PLAUSIBILITY_RULES.get(indicator_id)
