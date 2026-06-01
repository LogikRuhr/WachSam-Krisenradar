import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SeverityBadge } from "./SeverityBadge";
import { SourcePills } from "./SourcePill";
import { bereichLabel, isRising, trendLabel } from "@/lib/personalization";
import type { SignalChain as SignalChainData } from "@/lib/public-data";

type SignalChainProps = {
  chain: SignalChainData;
  /** "Für dich"-Notiz, vom Server aus dem Profil berechnet (personalNote). */
  note: string | null;
  /** Formatiertes Stand-Datum, oder null. */
  stand: string | null;
};

export function SignalChain({ chain, note, stand }: SignalChainProps) {
  const { signal, impact, action } = chain;
  const rising = isRising(signal.trend);

  return (
    <article className="signal-chain" aria-label={`Signal ${bereichLabel(signal.bereich)}`}>
      <div className="card-meta">
        <SeverityBadge value={signal.severity} />
        <span className="mono-label">{bereichLabel(signal.bereich)}</span>
        <span className={`trend-marker ${rising ? "trend-rising" : "trend-flat"}`}>{trendLabel(signal.trend)}</span>
        {stand ? <span className="mono-label signal-stand">Stand {stand}</span> : null}
      </div>

      <h3 className="signal-title">{signal.titel}</h3>
      <p className="lead">{signal.beschreibung}</p>

      <div className="chain-row">
        <span className="chain-label">Für deinen Haushalt</span>
        {note ? <p className="chain-personal">{note}</p> : null}
        {impact ? (
          <>
            <p>{impact.beschreibung}</p>
            <ConfidenceBadge value={impact.confidence} />
          </>
        ) : (
          <p className="chain-muted">Für diesen Bereich liegt noch keine konkrete Haushaltsauswirkung vor.</p>
        )}
      </div>

      {action ? (
        <div className="chain-row chain-action">
          <span className="chain-label">Was du tun kannst</span>
          <p>
            <strong>{action.titel}</strong> — {action.beschreibung}
          </p>
          <span className="mono-label">Aufwand: {action.aufwand}</span>
        </div>
      ) : null}

      <div className="signal-foot">
        <SourcePills sources={signal.sources} />
        <Link className="cross-link" href="/lagebild">
          Mehr im Lagebild
        </Link>
      </div>
    </article>
  );
}
