// €-Modellrechnung: transparente, redaktionell nachvollziehbare Kostenschätzung
// für Radar-Themenkanäle. Reine Funktionen ohne DB-Zugriff — der Aufrufer
// (radar-data.ts) lädt die Zeitreihe und übergibt sie hier. Keine Vorhersage,
// nur eine Modellrechnung mit ausgeschriebenen Annahmen (PRODUKTPLAN §5).

export type CostEstimate = { monthlyDeltaEur: number; window: string; assumptions: string; basis: string };
export type CostRangeEstimate = {
  monthlyDeltaMinEur: number;
  monthlyDeltaMaxEur: number;
  window: string;
  assumptions: string;
  basis: string;
};

export type CostObservation = { observedAt: Date; value: string };
type NumericObservation = { observedAt: Date; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;
/** Unter diesem Fenster ist ein Vergleich zu verrauscht, um als Modellrechnung ausgewiesen zu werden. */
const MIN_WINDOW_DAYS = 21;
/** Über diesem Fenster wäre eine lineare Monatsnormierung zu unsicher. */
const MAX_WINDOW_DAYS = 45;
/** Ziel-Rückblick für den Vergleichspunkt — grob "vor einem Monat". */
const TARGET_LOOKBACK_DAYS = 28;

function toNumericSorted(obs: CostObservation[]): NumericObservation[] {
  return obs
    .map((o) => ({ observedAt: o.observedAt, value: Number(o.value) }))
    .filter((o) => Number.isFinite(o.value))
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
}

/**
 * Wählt den Vergleichspunkt: den jüngsten Punkt, der mindestens TARGET_LOOKBACK_DAYS
 * älter ist als der jüngste Wert. Reicht die Zeitreihe nicht so weit zurück, wird
 * ersatzweise der älteste verfügbare Punkt versucht — die anschließende
 * MIN_WINDOW_DAYS-Prüfung filtert dann unbrauchbar kurze Fenster ehrlich aus.
 */
function pickComparisonPoint(points: NumericObservation[], latest: NumericObservation): NumericObservation | null {
  for (let i = points.length - 2; i >= 0; i--) {
    const candidate = points[i];
    const ageDays = (latest.observedAt.getTime() - candidate.observedAt.getTime()) / DAY_MS;
    if (ageDays >= TARGET_LOOKBACK_DAYS) return candidate;
  }
  const oldest = points[0];
  return oldest === latest ? null : oldest;
}

function buildEstimate(
  obs: CostObservation[],
  toMonthlyDelta: (delta: number) => number,
  assumptions: string,
  basis: (comparison: NumericObservation, latest: NumericObservation) => string,
): CostEstimate | null {
  const points = toNumericSorted(obs);
  if (points.length < 2) return null;

  const latest = points[points.length - 1];
  const comparison = pickComparisonPoint(points, latest);
  if (!comparison) return null;

  const windowDays = Math.round((latest.observedAt.getTime() - comparison.observedAt.getTime()) / DAY_MS);
  if (windowDays < MIN_WINDOW_DAYS) return null;
  if (windowDays > MAX_WINDOW_DAYS) return null;

  const delta = latest.value - comparison.value;
  const normalizedMonthlyDelta = toMonthlyDelta(delta) * (30 / windowDays);
  return {
    monthlyDeltaEur: Math.round(normalizedMonthlyDelta),
    window: `${windowDays} Tage`,
    assumptions,
    basis: basis(comparison, latest),
  };
}

function buildRangeEstimate(
  obs: CostObservation[],
  toMonthlyRange: (delta: number) => { min: number; max: number },
  assumptions: string,
  basis: (comparison: NumericObservation, latest: NumericObservation) => string,
): CostRangeEstimate | null {
  const points = toNumericSorted(obs);
  if (points.length < 2) return null;

  const latest = points[points.length - 1];
  const comparison = pickComparisonPoint(points, latest);
  if (!comparison) return null;

  const windowDays = Math.round((latest.observedAt.getTime() - comparison.observedAt.getTime()) / DAY_MS);
  if (windowDays < MIN_WINDOW_DAYS) return null;
  if (windowDays > MAX_WINDOW_DAYS) return null;

  const delta = latest.value - comparison.value;
  const range = toMonthlyRange(delta);
  const normalizedMin = range.min * (30 / windowDays);
  const normalizedMax = range.max * (30 / windowDays);
  return {
    monthlyDeltaMinEur: Math.round(Math.min(normalizedMin, normalizedMax)),
    monthlyDeltaMaxEur: Math.round(Math.max(normalizedMin, normalizedMax)),
    window: `${windowDays} Tage`,
    assumptions,
    basis: basis(comparison, latest),
  };
}

// 15.000 km/Jahr, 6,5 l/100 km ⇒ 975 l/Jahr ⇒ 81,25 l/Monat.
const MOBILITY_LITERS_PER_MONTH = 81.25;
const MOBILITY_ASSUMPTIONS = "15.000 km/Jahr, 6,5 l/100 km ⇒ 81,25 l/Monat";

/**
 * Δ Diesel-€/l zwischen jüngstem Wert und dem jüngsten Wert ≥28 Tage davor,
 * hochgerechnet auf den Monatsverbrauch eines Durchschnitts-Pendlers. Einheit
 * des Leitindikators `wi-kraftstoffpreis-diesel` verifiziert als Euro/Liter
 * (db/seed/source-data/warning-indicators.json) — die Rohwerte sind bereits €/l,
 * kein Umrechnungsfaktor nötig.
 */
export function estimateMobilityDelta(obs: CostObservation[]): CostEstimate | null {
  return buildEstimate(
    obs,
    (delta) => delta * MOBILITY_LITERS_PER_MONTH,
    MOBILITY_ASSUMPTIONS,
    (comparison, latest) => `Diesel: ${comparison.value.toFixed(2)} → ${latest.value.toFixed(2)} €/l`,
  );
}

export function estimateMobilityRange(
  obs: CostObservation[],
  litersPerMonth: { min: number; max: number; label: string },
): CostRangeEstimate | null {
  return buildRangeEstimate(
    obs,
    (delta) => ({ min: delta * litersPerMonth.min, max: delta * litersPerMonth.max }),
    `${litersPerMonth.label} ⇒ ${litersPerMonth.min}-${litersPerMonth.max} l/Monat`,
    (comparison, latest) => `Diesel: ${comparison.value.toFixed(2)} → ${latest.value.toFixed(2)} €/l`,
  );
}

// 18.000 kWh/Jahr ⇒ 1.500 kWh/Monat (Einfamilienhaus-Referenzverbrauch, s. Indikator-Label).
const HEATING_KWH_PER_MONTH = 1500;
const HEATING_ASSUMPTIONS = "18.000 kWh/Jahr ⇒ 1.500 kWh/Monat";

/**
 * Faktor Δ-Einheit → €/Monat für den jeweiligen Indikator-Unit-String. Nur die
 * verifizierte Einheit `ct/kWh` (wi-gaspreis-haushalt-efh, Stand Seed-Daten
 * Task 7) ist hinterlegt; unbekannte/fehlende Einheiten liefern `null` statt
 * einer stillschweigend falschen Annahme.
 */
function heatingFactor(unit: string | null): number | null {
  if (unit === "ct/kWh") return HEATING_KWH_PER_MONTH / 100; // Cent → Euro
  return null;
}

/**
 * Δ Gaspreis Haushalt (`wi-gaspreis-haushalt-efh`) zwischen jüngstem Wert und
 * dem jüngsten Wert ≥28 Tage davor, hochgerechnet auf den Monatsverbrauch eines
 * Einfamilienhauses. `unit` muss explizit übergeben werden (aus der Indikator-Row) —
 * siehe `heatingFactor` für unterstützte Einheiten.
 */
export function estimateHeatingDelta(obs: CostObservation[], unit: string | null): CostEstimate | null {
  const factor = heatingFactor(unit);
  if (factor == null) return null;
  return buildEstimate(
    obs,
    (delta) => delta * factor,
    HEATING_ASSUMPTIONS,
    (comparison, latest) => `Gaspreis: ${comparison.value.toFixed(2)} → ${latest.value.toFixed(2)} ${unit}`,
  );
}

export function estimateHeatingRange(
  obs: CostObservation[],
  unit: string | null,
  kwhPerMonth: { min: number; max: number; label: string },
): CostRangeEstimate | null {
  if (heatingFactor(unit) == null) return null;
  return buildRangeEstimate(
    obs,
    (delta) => ({
      min: delta * (kwhPerMonth.min / 100),
      max: delta * (kwhPerMonth.max / 100),
    }),
    `${kwhPerMonth.label} ⇒ ${kwhPerMonth.min}-${kwhPerMonth.max} kWh/Monat`,
    (comparison, latest) => `Gaspreis: ${comparison.value.toFixed(2)} → ${latest.value.toFixed(2)} ${unit}`,
  );
}
