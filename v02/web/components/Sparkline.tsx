import { buildSparkline } from "@/lib/sparkline";

interface SparklineProps {
  /** Messwerte in chronologischer Reihenfolge (alt → neu). */
  values: number[];
  /** Pflicht-Textalternative — beschreibt den Verlauf für Screenreader. */
  ariaLabel: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Kompakte Trendgrafik aus den jüngsten Messwerten — reines SVG, kein Client-JS.
 * Rendert nichts, wenn weniger als zwei endliche Werte vorliegen (ehrlicher
 * Leerzustand statt erfundener Linie). `vector-effect: non-scaling-stroke` hält
 * die Linie scharf, auch wenn die Grafik auf Container-Breite gestreckt wird.
 */
export function Sparkline({ values, ariaLabel, width = 100, height = 32, className }: SparklineProps) {
  const geometry = buildSparkline(values, { width, height });
  if (!geometry) return null;

  return (
    <svg
      className={`sparkline${className ? ` ${className}` : ""}`}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      focusable="false"
    >
      <path className="sparkline-area" d={geometry.areaPath} vectorEffect="non-scaling-stroke" />
      <path className="sparkline-line" d={geometry.linePath} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
