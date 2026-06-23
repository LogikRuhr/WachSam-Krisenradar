/**
 * Sparkline-Geometrie — reine, testbare Pfad-Mathematik für eine kompakte
 * Trendgrafik aus einer Zahlenreihe (z. B. die letzten Indikator-Beobachtungen).
 * Kein DOM, kein React, keine erfundenen Werte: nicht-endliche Einträge werden
 * herausgefiltert; unter zwei endlichen Werten gibt es nichts zu zeichnen (→ null).
 */

export interface SparklinePoint {
  x: number;
  y: number;
}

export interface SparklineGeometry {
  width: number;
  height: number;
  /** "M x y L x y …" — die Trendlinie. */
  linePath: string;
  /** Geschlossener Pfad bis zur Basislinie — für eine dezente Flächenfüllung. */
  areaPath: string;
  points: SparklinePoint[];
  /** Jüngster Punkt (rechts) — für einen End-Marker. null wenn keine Punkte. */
  lastPoint: SparklinePoint | null;
  min: number;
  max: number;
}

export interface SparklineOptions {
  width?: number;
  height?: number;
  padding?: number;
}

const DEFAULTS = { width: 100, height: 32, padding: 2 } as const;

/** Auf 2 Nachkommastellen runden — vermeidet Float-Rauschen im SVG-Pfad. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Baut die Geometrie einer Sparkline aus `values`. Gibt null zurück, wenn nach
 * dem Filtern nicht-endlicher Werte weniger als zwei Punkte übrig bleiben.
 *
 * Skalierung: x gleichmäßig über die Breite (abzüglich Padding), y invertiert
 * (größerer Wert = weiter oben). Bei konstanter Reihe (min === max) liegt die
 * Linie mittig — keine Division durch null.
 */
export function buildSparkline(values: number[], options?: SparklineOptions): SparklineGeometry | null {
  const width = options?.width ?? DEFAULTS.width;
  const height = options?.height ?? DEFAULTS.height;
  const padding = options?.padding ?? DEFAULTS.padding;

  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length < 2) return null;

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min;

  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;
  const xStep = innerWidth / (finite.length - 1);
  const midY = round(height / 2);
  const baseline = round(height - padding);

  const points: SparklinePoint[] = finite.map((value, index) => {
    const x = round(padding + index * xStep);
    const y = span === 0 ? midY : round(padding + ((max - value) / span) * innerHeight);
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

  return {
    width,
    height,
    linePath,
    areaPath,
    points,
    lastPoint: last,
    min,
    max,
  };
}
