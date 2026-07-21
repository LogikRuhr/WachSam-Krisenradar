export type SourceLike = {
  sourceName: string;
  sourceUrl: string;
  sourceStand: string;
};

function sourcePillKey(source: SourceLike) {
  const name = source.sourceName.trim();
  const stand = source.sourceStand.trim();
  return stand ? `${name}-${stand}` : `${name}-${source.sourceUrl}`;
}

export function SourcePill({ source }: { source: SourceLike }) {
  const href = safeExternalUrl(source.sourceUrl);
  const label = (
    <>
      Quelle: {source.sourceName} · Stand: {source.sourceStand}
    </>
  );

  if (!href) {
    return (
      <span className="source-pill source-pill-muted" title={`Quelle: ${source.sourceName} — ungültige URL`}>
        {label}
      </span>
    );
  }

  return (
    <a
      className="source-pill hover-rost"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Quelle: ${source.sourceName} — Stand: ${source.sourceStand} (öffnet in neuem Tab)`}
    >
      {label}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

export function SourcePills({ sources, compact = false }: { sources?: SourceLike[]; compact?: boolean }) {
  if (!sources?.length) return <span className="source-pill source-pill-muted">Keine Quelle verbunden</span>;
  return (
    <div className={compact ? "source-pills-compact" : "source-row"}>
      {sources.map((source) => (
        <SourcePill key={sourcePillKey(source)} source={source} />
      ))}
    </div>
  );
}
import React from "react";
import { safeExternalUrl } from "../lib/safe-external-url";
