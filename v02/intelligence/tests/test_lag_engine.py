"""
Tests fuer den Lag-Engine MVP (Cross-Correlation auf Log-Returns).

TDD-Reihenfolge:
  1. Tests schreiben (JETZT) — werden rot sein
  2. lag_engine.py implementieren
  3. Tests gruen sehen
"""

import numpy as np
import pandas as pd
import pytest
from datetime import date, timedelta

from src.analysis.lag_engine import (
    LagResult,
    align_pair,
    cross_correlation_lag,
    to_log_returns,
)


# ---------------------------------------------------------------------------
# Hilfsfunktion: einfache Datumsserie
# ---------------------------------------------------------------------------

def _make_date_index(n: int, start: str = "2023-01-01") -> pd.DatetimeIndex:
    return pd.date_range(start=start, periods=n, freq="D")


# ---------------------------------------------------------------------------
# 1. to_log_returns
# ---------------------------------------------------------------------------


class TestToLogReturns:
    def test_basic_returns(self):
        """Erste Zeile ist NaN, Rest sind log(p_t / p_{t-1})."""
        prices = pd.Series([100.0, 110.0, 99.0])
        returns = to_log_returns(prices)

        # Erstes Element entfernt, kein NaN
        assert len(returns) == 2
        assert not returns.isna().any()

        expected_0 = np.log(110.0 / 100.0)
        expected_1 = np.log(99.0 / 110.0)
        np.testing.assert_allclose(returns.iloc[0], expected_0, rtol=1e-9)
        np.testing.assert_allclose(returns.iloc[1], expected_1, rtol=1e-9)

    def test_preserves_index(self):
        """Index der Returns-Serie passt zu Original (ohne ersten Eintrag)."""
        idx = _make_date_index(5)
        prices = pd.Series([1.0, 2.0, 4.0, 8.0, 16.0], index=idx)
        returns = to_log_returns(prices)
        assert list(returns.index) == list(idx[1:])

    def test_single_value_returns_empty(self):
        """Nur ein Wert → leere Serie, kein Crash."""
        prices = pd.Series([42.0])
        returns = to_log_returns(prices)
        assert len(returns) == 0

    def test_empty_series_returns_empty(self):
        """Leere Eingabe → leere Ausgabe, kein Crash."""
        returns = to_log_returns(pd.Series([], dtype=float))
        assert len(returns) == 0


# ---------------------------------------------------------------------------
# 2. cross_correlation_lag — sauberes synthetisches Signal
# ---------------------------------------------------------------------------


class TestCrossCorrelationLag:
    """Synthetische Upstream/Downstream-Reihen mit bekanntem Lag."""

    @pytest.fixture()
    def clean_pair(self):
        """
        Upstream: Random-Walk (seed=42, n=200).
        Downstream: Upstream um K=7 Perioden verzögert (kein Rauschen).
        Ergebnis muss exakt K=7 erkennen.
        """
        rng = np.random.default_rng(42)
        n = 200
        K = 7
        idx = _make_date_index(n)

        upstream_vals = np.cumsum(rng.normal(0, 1, n)) + 100
        downstream_vals = np.empty(n)
        downstream_vals[:K] = upstream_vals[:K]          # Füllwerte am Anfang
        downstream_vals[K:] = upstream_vals[:n - K]      # verschobene Kopie

        upstream = pd.Series(upstream_vals, index=idx)
        downstream = pd.Series(downstream_vals, index=idx)
        return upstream, downstream, K

    @pytest.fixture()
    def noisy_pair(self):
        """
        Upstream: Random-Walk (seed=7, n=300).
        Downstream: Upstream um K=7 verschoben + 10% Rauschen.
        Engine darf ±1 daneben liegen.
        """
        rng = np.random.default_rng(7)
        n = 300
        K = 7
        idx = _make_date_index(n)

        upstream_vals = np.cumsum(rng.normal(0, 1, n)) + 100
        downstream_vals = np.empty(n)
        downstream_vals[:K] = upstream_vals[:K]
        downstream_vals[K:] = upstream_vals[:n - K]
        noise = rng.normal(0, 0.1 * upstream_vals.std(), n)
        downstream_vals += noise

        upstream = pd.Series(upstream_vals, index=idx)
        downstream = pd.Series(downstream_vals, index=idx)
        return upstream, downstream, K

    # --- sauberes Signal ---

    def test_exact_lag_detected(self, clean_pair):
        upstream, downstream, K = clean_pair
        result = cross_correlation_lag(upstream, downstream, max_lag=20)

        assert result.measured_lag == K
        assert result.strength is not None
        assert result.strength > 0.8   # starke Korrelation erwartet
        assert result.method == "ccf_logreturns"
        assert result.n_observations > 0

    def test_result_is_lagresult(self, clean_pair):
        upstream, downstream, K = clean_pair
        result = cross_correlation_lag(upstream, downstream, max_lag=20)
        assert isinstance(result, LagResult)

    # --- verrauschtes Signal ---

    def test_noisy_lag_within_tolerance(self, noisy_pair):
        """Bei leichtem Rauschen ist Lag ±1 um K=7 erlaubt."""
        upstream, downstream, K = noisy_pair
        result = cross_correlation_lag(upstream, downstream, max_lag=20)

        assert result.measured_lag is not None
        assert abs(result.measured_lag - K) <= 1, (
            f"Erwarteter Lag ~{K}, gemessen: {result.measured_lag}"
        )
        assert result.strength is not None and result.strength > 0

    # --- Edge-Cases ---

    def test_too_few_observations_returns_none(self):
        """Zu wenige Punkte → measured_lag=None, kein Crash."""
        rng = np.random.default_rng(1)
        # max_lag=20 → Mindest-n = 30; wir liefern 5
        tiny = pd.Series(rng.normal(size=5), index=_make_date_index(5))
        result = cross_correlation_lag(tiny, tiny, max_lag=20)

        assert result.measured_lag is None
        assert result.strength is None

    def test_constant_upstream_returns_none(self):
        """Konstante Reihe (keine Varianz in Log-Returns) → kein Crash, kein Ergebnis."""
        idx = _make_date_index(100)
        constant = pd.Series([5.0] * 100, index=idx)
        rng = np.random.default_rng(3)
        varying = pd.Series(np.cumsum(rng.normal(size=100)) + 10, index=idx)

        result = cross_correlation_lag(constant, varying, max_lag=20)
        assert result.measured_lag is None

    def test_constant_downstream_returns_none(self):
        idx = _make_date_index(100)
        constant = pd.Series([5.0] * 100, index=idx)
        rng = np.random.default_rng(4)
        varying = pd.Series(np.cumsum(rng.normal(size=100)) + 10, index=idx)

        result = cross_correlation_lag(varying, constant, max_lag=20)
        assert result.measured_lag is None

    def test_empty_overlap_returns_none(self):
        """Keine gemeinsame Zeitachse → kein Ergebnis."""
        idx_a = pd.date_range("2023-01-01", periods=50, freq="D")
        idx_b = pd.date_range("2025-01-01", periods=50, freq="D")
        a = pd.Series(np.ones(50), index=idx_a)
        b = pd.Series(np.ones(50), index=idx_b)

        result = cross_correlation_lag(a, b, max_lag=10)
        assert result.measured_lag is None


# ---------------------------------------------------------------------------
# 3. align_pair
# ---------------------------------------------------------------------------


class TestAlignPair:
    def _make_df(self, dates, values):
        return pd.DataFrame({"observed_at": pd.to_datetime(dates), "value": values})

    def test_common_dates_aligned(self):
        """Nur gemeinsame Datumsstützstellen bleiben übrig (inner join)."""
        dates_a = ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-05"]
        dates_b = ["2023-01-01", "2023-01-03", "2023-01-04", "2023-01-05"]
        df_a = self._make_df(dates_a, [1.0, 2.0, 3.0, 5.0])
        df_b = self._make_df(dates_b, [10.0, 30.0, 40.0, 50.0])

        up, down = align_pair(df_a, df_b)

        # Gemeinsame Daten: 2023-01-01, 2023-01-03, 2023-01-05
        assert len(up) == 3
        assert len(down) == 3
        assert list(up.index) == list(down.index)

    def test_values_preserved(self):
        """Werte bleiben nach dem Alignment korrekt zugeordnet."""
        dates_a = ["2023-01-01", "2023-01-02"]
        dates_b = ["2023-01-01", "2023-01-02"]
        df_a = self._make_df(dates_a, [7.0, 8.0])
        df_b = self._make_df(dates_b, [70.0, 80.0])

        up, down = align_pair(df_a, df_b)

        np.testing.assert_allclose(up.values, [7.0, 8.0])
        np.testing.assert_allclose(down.values, [70.0, 80.0])

    def test_duplicates_are_deduped(self):
        """Doppelte observed_at-Einträge werden auf letzten Wert reduziert."""
        dates_a = ["2023-01-01", "2023-01-01", "2023-01-02"]
        dates_b = ["2023-01-01", "2023-01-02"]
        df_a = self._make_df(dates_a, [1.0, 2.0, 3.0])
        df_b = self._make_df(dates_b, [10.0, 30.0])

        up, down = align_pair(df_a, df_b)

        assert len(up) == 2  # nur 2 eindeutige Datumsstützstellen
        assert len(down) == 2

    def test_sorted_output(self):
        """Output ist nach Datum sortiert."""
        dates_a = ["2023-01-03", "2023-01-01", "2023-01-02"]
        dates_b = ["2023-01-03", "2023-01-01", "2023-01-02"]
        df_a = self._make_df(dates_a, [3.0, 1.0, 2.0])
        df_b = self._make_df(dates_b, [30.0, 10.0, 20.0])

        up, down = align_pair(df_a, df_b)

        assert list(up.index) == sorted(up.index)

    def test_no_common_dates_empty(self):
        """Keine gemeinsamen Datumsstützstellen → leere Series, kein Crash."""
        dates_a = ["2023-01-01", "2023-01-02"]
        dates_b = ["2024-01-01", "2024-01-02"]
        df_a = self._make_df(dates_a, [1.0, 2.0])
        df_b = self._make_df(dates_b, [10.0, 20.0])

        up, down = align_pair(df_a, df_b)

        assert len(up) == 0
        assert len(down) == 0

    def test_custom_column_names(self):
        """Funktion akzeptiert abweichende value_col / time_col."""
        df_a = pd.DataFrame({"ts": pd.to_datetime(["2023-01-01"]), "val": [5.0]})
        df_b = pd.DataFrame({"ts": pd.to_datetime(["2023-01-01"]), "val": [50.0]})

        up, down = align_pair(df_a, df_b, value_col="val", time_col="ts")

        assert len(up) == 1
        np.testing.assert_allclose(up.iloc[0], 5.0)
