const labels: Record<string, string> = {
  niedrig: "Evidenz gering",
  mittel: "Evidenz mittel",
  hoch: "Evidenz stark",
};

export function ConfidenceBadge({ value }: { value?: string | null }) {
  const key = value ?? "niedrig";
  return <span className={`confidence-badge confidence-${key}`}>{labels[key] ?? key}</span>;
}
