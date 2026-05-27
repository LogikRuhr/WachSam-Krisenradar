const labels: Record<string, string> = {
  stabil: "Stabil",
  beobachten: "Beobachten",
  erhoeht: "Erhöht",
  kritisch: "Kritisch",
  eskalierend: "Eskalierend",
};

export function SeverityBadge({ value }: { value?: string | null }) {
  const key = value ?? "stabil";
  return <span className={`severity-badge severity-${key}`}>{labels[key] ?? key}</span>;
}
