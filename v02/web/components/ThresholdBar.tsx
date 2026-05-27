import type { Zone } from "@/lib/indicator-zones";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

interface ThresholdBarProps {
  currentValue: number | null;
  currentValueDate: Date | null;
  thresholdWarn: number;
  thresholdCritical: number;
  unit: string;
  scaleDirection: string;
  zone: Zone;
  zoneLabel: string;
  zoneText: string | null;
}

/**
 * Computes the three zone widths and threshold positions on a 0–100% scale.
 *
 * For "lower_is_worse" (e.g. gas storage):
 *   left = critical (0..thresholdCritical), middle = elevated, right = uncritical
 *   Visual scale: 0% on the left, 100% on the right
 *
 * For "higher_is_worse" (e.g. VPI):
 *   left = uncritical (0..thresholdWarn), middle = elevated, right = critical
 *   Visual scale: 0% on the left, max on the right
 */
function computeBarLayout(
  thresholdWarn: number,
  thresholdCritical: number,
  scaleDirection: string,
  currentValue: number | null,
) {
  // Determine scale range — extend 20% beyond the outermost meaningful value
  const allValues = [0, thresholdWarn, thresholdCritical];
  if (currentValue != null) allValues.push(currentValue);
  const max = Math.max(...allValues) * 1.2 || 100;

  const warnPct = (thresholdWarn / max) * 100;
  const critPct = (thresholdCritical / max) * 100;
  const valuePct = currentValue != null ? Math.min((currentValue / max) * 100, 100) : null;

  if (scaleDirection === "lower_is_worse") {
    // left=critical, middle=elevated, right=uncritical
    const critWidth = critPct;
    const elevWidth = warnPct - critPct;
    const uncritWidth = 100 - warnPct;
    return {
      zones: [
        { key: "critical" as Zone, width: critWidth },
        { key: "elevated" as Zone, width: elevWidth },
        { key: "uncritical" as Zone, width: uncritWidth },
      ],
      thresholds: [
        { pct: critPct, label: `${thresholdCritical} %` },
        { pct: warnPct, label: `${thresholdWarn} %` },
      ],
      valuePct,
    };
  }

  // higher_is_worse: left=uncritical, middle=elevated, right=critical
  const uncritWidth = warnPct;
  const elevWidth = critPct - warnPct;
  const critWidth = 100 - critPct;
  return {
    zones: [
      { key: "uncritical" as Zone, width: uncritWidth },
      { key: "elevated" as Zone, width: elevWidth },
      { key: "critical" as Zone, width: critWidth },
    ],
    thresholds: [
      { pct: warnPct, label: `${thresholdWarn}` },
      { pct: critPct, label: `${thresholdCritical}` },
    ],
    valuePct,
  };
}

export function ThresholdBar({
  currentValue,
  currentValueDate,
  thresholdWarn,
  thresholdCritical,
  unit,
  scaleDirection,
  zone,
  zoneLabel,
  zoneText,
}: ThresholdBarProps) {
  const layout = computeBarLayout(thresholdWarn, thresholdCritical, scaleDirection, currentValue);

  return (
    <div>
      {/* Value display */}
      {currentValue != null ? (
        <div className="threshold-value-display">
          <strong>{currentValue}</strong>
          <span className="threshold-value-unit">{unit}</span>
          {currentValueDate ? (
            <>
              {" "}
              <span className="threshold-value-date">
                Stand {DATE_FMT.format(currentValueDate)}
              </span>
            </>
          ) : null}
          <br />
          <span className="threshold-value-date">
            Einordnung: {zoneLabel}
          </span>
        </div>
      ) : (
        <p className="threshold-no-value">Kein aktueller Messwert verfügbar.</p>
      )}

      {/* Bar */}
      <div className="threshold-bar" role="img" aria-label={`Schwellenwert-Skala: ${zoneLabel}`}>
        <div className="threshold-bar-bg">
          {layout.zones.map((z) => (
            <div
              key={z.key}
              className={`threshold-zone threshold-zone-${z.key}`}
              style={{ width: `${z.width}%` }}
            />
          ))}
        </div>

        {/* Threshold lines + labels */}
        {layout.thresholds.map((t, i) => (
          <span key={i}>
            <div className="threshold-line" style={{ left: `${t.pct}%` }} />
            <span className="threshold-label" style={{ left: `${t.pct}%` }}>
              {t.label}
            </span>
          </span>
        ))}

        {/* Current value marker */}
        {layout.valuePct != null ? (
          <div
            className={`threshold-marker threshold-marker-${zone}`}
            style={{ left: `${layout.valuePct}%` }}
            aria-label={`Aktueller Wert: ${currentValue} ${unit}`}
          />
        ) : null}
      </div>

      {/* Zone text */}
      {zoneText ? <p className="threshold-zone-text">{zoneText}</p> : null}
    </div>
  );
}
