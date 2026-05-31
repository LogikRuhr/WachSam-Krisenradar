type EffectPathProps = {
  signal?: React.ReactNode;
  germanyRelevance?: React.ReactNode;
  systemstress?: React.ReactNode;
  haushalt?: React.ReactNode;
  evidenz?: string | null;
};

const fallback = "Nicht gesondert ausgewiesen.";

function DeutscheConfidenceBadge({ value }: { value?: string | null }) {
  const key = value ?? "niedrig";
  const labels: Record<string, string> = {
    niedrig: "Sicherheit der Einschätzung niedrig",
    mittel: "Sicherheit der Einschätzung mittel",
    hoch: "Sicherheit der Einschätzung hoch",
  };
  return <span className={`confidence-badge confidence-${key}`}>{labels[key] ?? `Sicherheit der Einschätzung ${key}`}</span>;
}

export function EffectPath({ signal, germanyRelevance, systemstress, haushalt, evidenz }: EffectPathProps) {
  const steps = [
    { phase: "Signal", body: signal ?? fallback },
    { phase: "Deutschland-Relevanz", body: germanyRelevance ?? fallback },
    { phase: "Systembereich", body: systemstress ?? fallback },
    { phase: "Haushaltsauswirkung", body: haushalt ?? fallback },
  ];

  return (
    <section className="effect-path" aria-labelledby="effect-path-heading">
      <p id="effect-path-heading" className="mono-label">Wirkungskette</p>
      <ol className="effect-path-list">
        {steps.map((step, index) => (
          <li key={step.phase} className="effect-path-step">
            <span className="effect-path-label">{String(index + 1).padStart(2, "0")} · {step.phase}</span>
            <div className="effect-path-body">{step.body}</div>
          </li>
        ))}
        <li className="effect-path-step">
          <span className="effect-path-label">05 · Sicherheit der Einschätzung/Evidenz</span>
          <div className="effect-path-body effect-path-evidence">
            <span>Redaktionelle Einordnung, kein Automatismus.</span>
            {evidenz ? <DeutscheConfidenceBadge value={evidenz} /> : null}
          </div>
        </li>
      </ol>
    </section>
  );
}
