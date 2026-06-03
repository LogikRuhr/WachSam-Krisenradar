const labels: Record<string, string> = {
  niedrig: "Einschätzungssicherheit: niedrig",
  mittel: "Einschätzungssicherheit: mittel",
  hoch: "Einschätzungssicherheit: hoch",
};

export function ConfidenceBadge({ value }: { value?: string | null }) {
  const key = value ?? "niedrig";
  return (
    <span
      className={`confidence-badge confidence-${key}`}
      title="Zeigt, wie belastbar die aktuelle Einschätzung ist — abhängig von Quellenlage, Datenqualität und Unsicherheit."
    >
      {labels[key] ?? `Einschätzungssicherheit: ${key}`}
    </span>
  );
}
