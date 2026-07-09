/**
 * Indicator zone computation — determines whether a live value falls
 * into the uncritical / elevated / critical zone, and computes
 * injection-period metrics for target-based indicators (e.g. gas storage).
 */

export type Zone = "uncritical" | "elevated" | "critical";
export type ScaleDirection = "higher_is_worse" | "lower_is_worse";

export interface ZoneResult {
  zone: Zone;
  zoneLabel: string;
  zoneText: string | null;
}

export interface ZoneTexts {
  uncritical?: string | null;
  elevated?: string | null;
  critical?: string | null;
}

/**
 * Compute which zone a current value falls into, given thresholds and scale direction.
 *
 * - "lower_is_worse" (e.g. gas storage fill %):
 *   below critical → critical, below warn → elevated, above warn → uncritical
 *
 * - "higher_is_worse" (e.g. VPI, Brent oil price):
 *   above critical → critical, above warn → elevated, below warn → uncritical
 *
 * Returns null if currentValue is null/undefined.
 */
export function computeZone(
  currentValue: number | null | undefined,
  thresholdWarn: number | null | undefined,
  thresholdCritical: number | null | undefined,
  scaleDirection: ScaleDirection,
  zoneTexts?: ZoneTexts | null,
): ZoneResult | null {
  if (currentValue == null || thresholdWarn == null || thresholdCritical == null) {
    return null;
  }

  const labels: Record<Zone, string> = {
    uncritical: "Unkritisch",
    elevated: "Erhöht",
    critical: "Kritisch",
  };

  let zone: Zone;

  if (scaleDirection === "lower_is_worse") {
    // Lower values are worse (e.g. gas storage %)
    if (currentValue <= thresholdCritical) {
      zone = "critical";
    } else if (currentValue <= thresholdWarn) {
      zone = "elevated";
    } else {
      zone = "uncritical";
    }
  } else {
    // Higher values are worse (e.g. VPI, oil price)
    if (currentValue >= thresholdCritical) {
      zone = "critical";
    } else if (currentValue >= thresholdWarn) {
      zone = "elevated";
    } else {
      zone = "uncritical";
    }
  }

  return {
    zone,
    zoneLabel: labels[zone],
    zoneText: zoneTexts?.[zone] ?? null,
  };
}

/** Trendrichtung eines Live-Werts gegenüber dem Vorwert. "flat" = unverändert/kein Vorwert. */
export type TrendDirection = "up" | "down" | "flat";

export interface IndicatorVitals {
  currentValue: number | null;
  previousValue: number | null;
  currentValueDate: Date | null;
  unit: string | null;
  /** Differenz current − previous; null wenn einer der Werte fehlt. */
  delta: number | null;
  trend: TrendDirection;
  zone: ZoneResult | null;
  /** true, wenn kein aktueller Messwert vorliegt (ehrlicher Leerzustand). */
  pending: boolean;
}

/** Felder einer Indikator-Row, die für die Vitalwert-Darstellung gebraucht werden. */
export interface IndicatorVitalsInput {
  currentValue: string | number | null;
  previousValue: string | number | null;
  currentValueDate: Date | null;
  thresholdWarn: string | number | null;
  thresholdCritical: string | number | null;
  scaleDirection: string;
  unit: string | null;
  zoneTextUncritical: string | null;
  zoneTextElevated: string | null;
  zoneTextCritical: string | null;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Leitet aus einer Indikator-Row die anzeigefertigen Vitalwerte ab: numerischer
 * Live-/Vorwert, Trend, Zone (via computeZone) und ein ehrlicher `pending`-Flag,
 * wenn kein aktueller Wert vorliegt. Reine Funktion — keine DB, keine erfundenen Werte.
 */
export function indicatorVitals(input: IndicatorVitalsInput): IndicatorVitals {
  const currentValue = toNumber(input.currentValue);
  const previousValue = toNumber(input.previousValue);
  const warn = toNumber(input.thresholdWarn);
  const critical = toNumber(input.thresholdCritical);

  const delta = currentValue != null && previousValue != null ? currentValue - previousValue : null;
  const trend: TrendDirection = delta == null || delta === 0 ? "flat" : delta > 0 ? "up" : "down";

  const zone = computeZone(currentValue, warn, critical, input.scaleDirection as ScaleDirection, {
    uncritical: input.zoneTextUncritical,
    elevated: input.zoneTextElevated,
    critical: input.zoneTextCritical,
  });

  return {
    currentValue,
    previousValue,
    currentValueDate: input.currentValueDate,
    unit: input.unit,
    delta,
    trend,
    zone,
    pending: currentValue == null,
  };
}

export interface InjectionPeriodResult {
  daysRemaining: number;
  gapToTarget: number;
  requiredDailyRate: number;
  actualDailyChange: number | null;
  onTrack: boolean | null;
  periodActive: boolean;
}

/**
 * Compute injection-period metrics for target-based indicators.
 *
 * For example, the gas storage fill target of 80% by October 1st.
 * Returns null if targetValue or targetDeadline is not set.
 */
export function computeInjectionPeriod(
  currentValue: number | null | undefined,
  previousValue: number | null | undefined,
  targetValue: number | null | undefined,
  targetDeadline: Date | null | undefined,
  now?: Date,
): InjectionPeriodResult | null {
  if (targetValue == null || targetDeadline == null || currentValue == null) {
    return null;
  }

  const today = now ?? new Date();
  const deadlineMs = targetDeadline.getTime();
  const nowMs = today.getTime();
  const msPerDay = 86_400_000;

  const daysRemaining = Math.max(0, Math.ceil((deadlineMs - nowMs) / msPerDay));
  const gapToTarget = Math.max(0, targetValue - currentValue);
  const periodActive = nowMs < deadlineMs;

  const requiredDailyRate = daysRemaining > 0 ? gapToTarget / daysRemaining : 0;

  let actualDailyChange: number | null = null;
  let onTrack: boolean | null = null;

  if (previousValue != null) {
    actualDailyChange = currentValue - previousValue;
    // onTrack if daily gain meets or exceeds required rate (or gap is already closed)
    onTrack = gapToTarget <= 0 || (periodActive && actualDailyChange >= requiredDailyRate);
  }

  return {
    daysRemaining,
    gapToTarget,
    requiredDailyRate,
    actualDailyChange,
    onTrack,
    periodActive,
  };
}
