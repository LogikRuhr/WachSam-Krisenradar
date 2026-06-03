import { ConfidenceBadge } from "./ConfidenceBadge";
import { SeverityBadge } from "./SeverityBadge";

type CascadeStep = Record<string, unknown>;

type CascadeCausalityMapProps = {
  trigger: string;
  steps: CascadeStep[];
  householdImpact: string;
  confidence?: string | null;
  severity?: string | null;
  timeToImpact?: string | null;
  compact?: boolean;
};

const systemLabels: Record<string, string> = {
  arbeit: "Arbeit",
  energie: "Energie",
  finanzen: "Finanzen",
  gesellschaft: "Gesellschaft",
  gesundheit: "Gesundheit",
  industrie: "Industrie",
  infrastruktur: "Infrastruktur",
  lebensmittel: "Lebensmittel",
  logistik: "Logistik",
  mobilitaet: "Mobilität",
};

function textFromStep(step: CascadeStep) {
  const raw = step.description;
  return typeof raw === "string" ? raw : "Kaskadenschritt ohne Beschreibung.";
}

function systemsFromStep(step: CascadeStep) {
  const raw = step.systems;
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is string => typeof entry === "string");
}

function formatSystem(system: string) {
  return systemLabels[system] ?? system;
}

export function CascadeCausalityMap({
  trigger,
  steps,
  householdImpact,
  confidence,
  severity,
  timeToImpact,
  compact = false,
}: CascadeCausalityMapProps) {
  const visibleSteps = steps.length ? steps : [{ description: "Systemstress wird redaktionell eingeordnet.", systems: [] }];

  return (
    <section className={compact ? "causality-map causality-map-compact" : "causality-map"} aria-labelledby="causality-map-heading">
      <div className="causality-map-head">
        <div>
          <p id="causality-map-heading" className="mono-label">Kausalitäts-Map</p>
          <h2 className="detail-title-small">Vom Signal zur Haushaltswirkung</h2>
        </div>
        <div className="causality-map-meta">
          {severity ? <SeverityBadge value={severity} /> : null}
          {confidence ? <ConfidenceBadge value={confidence} /> : null}
          {timeToImpact ? <span className="mono-label">Zeithorizont: {timeToImpact}</span> : null}
        </div>
      </div>

      <div className="causality-map-flow" role="list" aria-label="Visualisierte Wirkungskette">
        <article className="causality-node causality-node-signal" role="listitem">
          <span className="causality-node-index">01</span>
          <span className="causality-node-label">Globales Signal</span>
          <p>{trigger}</p>
        </article>

        <div className="causality-connector" aria-hidden="true">
          <span />
        </div>

        <div className="causality-step-stack" role="listitem">
          <span className="causality-node-label">Systemstress</span>
          {visibleSteps.map((step, index) => {
            const systems = systemsFromStep(step);
            return (
              <article className="causality-step" key={`${textFromStep(step)}-${index}`}>
                <div className="causality-step-title">
                  <span className="causality-node-index">{String(index + 2).padStart(2, "0")}</span>
                  <p>{textFromStep(step)}</p>
                </div>
                {systems.length ? (
                  <div className="causality-system-row">
                    {systems.map((system) => (
                      <span className="system-badge" key={`${index}-${system}`}>
                        {formatSystem(system)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="causality-connector" aria-hidden="true">
          <span />
        </div>

        <article className="causality-node causality-node-household" role="listitem">
          <span className="causality-node-index">{String(visibleSteps.length + 2).padStart(2, "0")}</span>
          <span className="causality-node-label">Haushaltswirkung</span>
          <p>{householdImpact}</p>
        </article>
      </div>

      <p className="causality-map-note">
        Redaktionelle Einordnung, kein Automatismus. Pfeile zeigen plausible Wirkungspfade aus dem freigegebenen Datensatz, keine sichere Prognose.
      </p>
    </section>
  );
}
