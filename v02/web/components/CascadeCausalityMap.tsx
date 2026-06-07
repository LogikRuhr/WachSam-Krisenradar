import { Fragment } from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SeverityBadge } from "./SeverityBadge";
import { cascadePathNodes, systemLabel, type CascadePhase } from "@/lib/personalization";

type CascadeStep = Record<string, unknown>;

type CascadeCausalityMapProps = {
  trigger: string;
  steps: CascadeStep[];
  householdImpact: string;
  germanyRelevance?: string | null;
  confidence?: string | null;
  severity?: string | null;
  timeToImpact?: string | null;
  compact?: boolean;
};

const PHASE_LABEL: Record<CascadePhase, string> = {
  entwicklung: "Globale Entwicklung",
  deutschlandRelevanz: "Deutschland-Relevanz",
  systembelastung: "Systembelastung",
  haushalt: "Haushaltsauswirkung",
};

const NODE_CLASS: Record<CascadePhase, string> = {
  entwicklung: "causality-node causality-node-signal",
  deutschlandRelevanz: "causality-node causality-node-relevanz",
  systembelastung: "causality-node",
  haushalt: "causality-node causality-node-household",
};

export function CascadeCausalityMap({
  trigger,
  steps,
  householdImpact,
  germanyRelevance,
  confidence,
  severity,
  timeToImpact,
  compact = false,
}: CascadeCausalityMapProps) {
  const nodes = cascadePathNodes({ trigger, germanyRelevance, steps, householdImpact });
  const leadNodes = nodes.filter((node) => node.phase === "entwicklung" || node.phase === "deutschlandRelevanz");
  const stepNodes = nodes.filter((node) => node.phase === "systembelastung");
  const householdNode = nodes.find((node) => node.phase === "haushalt");

  return (
    <section className={compact ? "causality-map causality-map-compact" : "causality-map"} aria-labelledby="causality-map-heading">
      <div className="causality-map-head">
        <div>
          <p id="causality-map-heading" className="mono-label">Wirkungskarte</p>
          <h2 className="detail-title-small">Von der Entwicklung zur Haushaltsauswirkung</h2>
        </div>
        <div className="causality-map-meta">
          {severity ? <SeverityBadge value={severity} /> : null}
          {confidence ? <ConfidenceBadge value={confidence} /> : null}
          {timeToImpact ? <span className="mono-label">Zeithorizont: {timeToImpact}</span> : null}
        </div>
      </div>

      <div className="causality-map-flow" role="list" aria-label="Visualisierte Wirkungskette">
        {leadNodes.map((node) => (
          <Fragment key={node.index}>
            <article className={NODE_CLASS[node.phase]} role="listitem">
              <span className="causality-node-index">{node.index}</span>
              <span className="causality-node-label">{PHASE_LABEL[node.phase]}</span>
              <p>{node.text}</p>
            </article>
            <div className="causality-connector" aria-hidden="true">
              <span />
            </div>
          </Fragment>
        ))}

        <div className="causality-step-stack" role="listitem">
          <span className="causality-node-label">{PHASE_LABEL.systembelastung}</span>
          {stepNodes.map((node) => (
            <article className="causality-step" key={node.index}>
              <div className="causality-step-title">
                <span className="causality-node-index">{node.index}</span>
                <p>{node.text}</p>
              </div>
              {node.systems.length ? (
                <div className="causality-system-row">
                  {node.systems.map((system) => (
                    <span className="system-badge" key={`${node.index}-${system}`}>
                      {systemLabel(system)}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="causality-connector" aria-hidden="true">
          <span />
        </div>

        {householdNode ? (
          <article className={NODE_CLASS.haushalt} role="listitem">
            <span className="causality-node-index">{householdNode.index}</span>
            <span className="causality-node-label">{PHASE_LABEL.haushalt}</span>
            <p>{householdNode.text}</p>
          </article>
        ) : null}
      </div>

      <p className="causality-map-note">
        Redaktionelle Einordnung, kein Automatismus. Pfeile zeigen plausible Wirkungspfade aus dem freigegebenen Datensatz, keine sichere Prognose.
      </p>
    </section>
  );
}
