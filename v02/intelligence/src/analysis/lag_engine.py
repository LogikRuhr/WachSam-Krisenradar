"""
Lag-Engine MVP — misst Zeitverzögerungen zwischen zwei Indikator-Zeitreihen
via Kreuzkorrelation auf Log-Returns.

Kein DB-Zugriff: dieses Modul arbeitet ausschließlich auf pandas-Objekten.

Wichtiger Methodikhinweis:
  Wir arbeiten auf Log-Returns, weil Rohpreise typischerweise I(1)-Prozesse
  sind (nicht-stationär). Kreuzkorrelation auf nicht-stationären Reihen
  liefert Scheinkorrelationen (Spurious Correlation). Log-Returns sind
  annähernd stationär und damit für CCF geeignet.

  ACHTUNG: Eine signifikante Kreuzkorrelation ist KEIN Kausalitätsbeweis
  (vgl. Granger-Kausalität). Sie ist ein Hinweis auf zeitliche Vorlaufstruktur,
  die inhaltlich interpretiert werden muss.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Optional, Tuple


# ---------------------------------------------------------------------------
# Datenstruktur für das Ergebnis
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LagResult:
    """
    Ergebnis einer Lag-Messung.

    Attribute:
        measured_lag:   Gemessener Lag in Perioden (None = kein Ergebnis).
        strength:       Kreuzkorrelationskoeffizient am besten Lag (None = kein Ergebnis).
        n_observations: Anzahl gemeinsamer Beobachtungen nach Alignment.
        method:         Identifikator der verwendeten Methode.
    """

    measured_lag: Optional[int]
    strength: Optional[float]
    n_observations: int
    method: str = "ccf_logreturns"


# ---------------------------------------------------------------------------
# Konstanten
# ---------------------------------------------------------------------------

# Mindestanzahl gemeinsamer Beobachtungen (nach Log-Return-Differenzierung)
# relativ zu max_lag: max_lag + MIN_EXTRA_POINTS
_MIN_EXTRA_POINTS: int = 10


# ---------------------------------------------------------------------------
# Hilfsfunktion: Log-Returns
# ---------------------------------------------------------------------------


def to_log_returns(series: pd.Series) -> pd.Series:
    """
    Wandelt eine Preis-/Wertserie in Log-Returns um: ln(p_t / p_{t-1}).

    Die erste Beobachtung wird entfernt (NaN durch Shift), da kein
    Vorgängerwert existiert.

    Begründung Stationarität:
        Rohpreisreihen sind häufig I(1)-Prozesse (Random Walk mit Drift).
        Kreuzkorrelation auf Niveau-Daten führt zu Scheinkorrelationen.
        Log-Returns eliminieren den Trend und sind annähernd stationär.

    Args:
        series: Zeitreihe mit positiven Werten (Preise, Indexstände o.Ä.).

    Returns:
        Serie der Log-Returns ohne das erste (NaN-)Element.
        Leere Serie bei weniger als 2 Eingabewerten.
    """
    if len(series) < 2:
        return pd.Series([], dtype=float)

    log_returns = np.log(series / series.shift(1)).iloc[1:]
    return log_returns


# ---------------------------------------------------------------------------
# Kernfunktion: Kreuzkorrelations-Lag
# ---------------------------------------------------------------------------


def cross_correlation_lag(
    upstream: pd.Series,
    downstream: pd.Series,
    max_lag: int,
) -> LagResult:
    """
    Misst den Zeitverzögerungs-Lag zwischen zwei Zeitreihen via
    Kreuzkorrelation auf Log-Returns.

    Methodik:
        1. Beide Serien auf gemeinsame Zeitachse alignen (inner join).
        2. Log-Returns berechnen (→ Stationarität).
        3. Für Lags 0, 1, …, max_lag: Korrelation zwischen
           upstream_returns[:-lag] und downstream_returns[lag:] berechnen.
           (d.h. Upstream "läuft vor": upstream_t korreliert mit downstream_{t+lag})
        4. Lag mit maximaler absoluter Korrelation wird zurückgegeben.

    Hinweis: Korrelation ≠ Kausalität. Granger-Kausalitätstests wären
    der nächste Schritt für kausale Schlussfolgerungen.

    Args:
        upstream:   Zeitreihe des potentiellen Vorlauf-Indikators
                    (z.B. Brent-Ölpreis).
        downstream: Zeitreihe des potentiellen Nachläufers
                    (z.B. Benzinpreis an der Zapfsäule).
        max_lag:    Maximaler zu prüfender Lag (in Perioden).

    Returns:
        LagResult mit measured_lag=None wenn zu wenig Daten oder
        keine Varianz in den Returns vorhanden.
    """
    # Gemeinsame Zeitachse (inner join)
    combined = pd.DataFrame({"up": upstream, "down": downstream}).dropna()
    n_common = len(combined)

    # Mindest-Beobachtungen prüfen BEVOR Log-Returns (die nochmal eine Zeile kürzen)
    min_required = max_lag + _MIN_EXTRA_POINTS + 1
    if n_common < min_required:
        return LagResult(
            measured_lag=None,
            strength=None,
            n_observations=n_common,
        )

    # Log-Returns berechnen
    up_ret = to_log_returns(combined["up"])
    down_ret = to_log_returns(combined["down"])

    # Varianz-Check: konstante Reihe hat std ≈ 0
    if up_ret.std() < 1e-12 or down_ret.std() < 1e-12:
        return LagResult(
            measured_lag=None,
            strength=None,
            n_observations=n_common,
        )

    up_arr = up_ret.to_numpy()
    down_arr = down_ret.to_numpy()
    n_ret = len(up_arr)

    # Nochmal prüfen nach Log-Return-Differenzierung
    if n_ret < max_lag + _MIN_EXTRA_POINTS:
        return LagResult(
            measured_lag=None,
            strength=None,
            n_observations=n_common,
        )

    # Kreuzkorrelation für alle Lags berechnen
    # Lag k: Upstream[:-k] korreliert mit Downstream[k:]
    # → Upstream "läuft k Perioden vor" Downstream
    best_lag = 0
    best_corr = 0.0

    for lag in range(max_lag + 1):
        if lag == 0:
            corr = float(np.corrcoef(up_arr, down_arr)[0, 1])
        else:
            corr = float(np.corrcoef(up_arr[:-lag], down_arr[lag:])[0, 1])

        # NaN abfangen (kann bei numerischen Grenzfällen auftreten)
        if np.isnan(corr):
            continue

        if abs(corr) > abs(best_corr):
            best_corr = corr
            best_lag = lag

    # Falls alle Korrelationen NaN waren
    if best_lag == 0 and best_corr == 0.0:
        # Nochmal prüfen: war Lag 0 valide?
        check = np.corrcoef(up_arr, down_arr)[0, 1]
        if np.isnan(check):
            return LagResult(
                measured_lag=None,
                strength=None,
                n_observations=n_common,
            )

    return LagResult(
        measured_lag=best_lag,
        strength=round(best_corr, 6),
        n_observations=n_common,
    )


# ---------------------------------------------------------------------------
# Hilfsfunktion: DataFrame-Pair alignen
# ---------------------------------------------------------------------------


def align_pair(
    up: pd.DataFrame,
    down: pd.DataFrame,
    value_col: str = "value",
    time_col: str = "observed_at",
) -> Tuple[pd.Series, pd.Series]:
    """
    Alignt zwei observation-DataFrames auf gemeinsame Zeitstützstellen.

    Erwartet DataFrames mit den Spalten `time_col` (Datum/Zeitstempel)
    und `value_col` (numerischer Wert) — passend zur Tabelle
    `indicator_observations` in der WachSam-DB.

    Vorgehen:
        1. Datum-Spalte als Index setzen.
        2. Duplikate entfernen (keep='last' — neuester Wert gewinnt).
        3. Beide Serien sortieren.
        4. Inner join über gemeinsamen Index.

    Args:
        up:        DataFrame des Vorlauf-Indikators.
        down:      DataFrame des Nachläufer-Indikators.
        value_col: Name der Wert-Spalte (default: "value").
        time_col:  Name der Zeitstempel-Spalte (default: "observed_at").

    Returns:
        Tuple (up_series, down_series) — beide auf identischer,
        sortierter, duplizierungsfreier Zeitachse.
    """

    def _prepare(df: pd.DataFrame) -> pd.Series:
        s = df.copy()
        s[time_col] = pd.to_datetime(s[time_col])
        s = s.set_index(time_col)[value_col]
        s = s.sort_index()
        s = s[~s.index.duplicated(keep="last")]
        return s

    up_series = _prepare(up)
    down_series = _prepare(down)

    # Inner join: nur gemeinsame Datumsstützstellen
    aligned = pd.DataFrame({"up": up_series, "down": down_series}).dropna()

    return aligned["up"], aligned["down"]
