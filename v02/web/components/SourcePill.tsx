export type SourceLike = {
  sourceName: string;
  sourceUrl: string;
  sourceStand: string;
};

export function SourcePill({ source }: { source: SourceLike }) {
  return (
    <a
      className="source-pill hover-rost"
      href={source.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Quelle: ${source.sourceName} — Stand: ${source.sourceStand} (öffnet in neuem Tab)`}
    >
      Quelle: {source.sourceName} · Stand: {source.sourceStand}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

export function SourcePills({ sources, compact = false }: { sources?: SourceLike[]; compact?: boolean }) {
  if (!sources?.length) return <span className="source-pill source-pill-muted">Keine Quelle verbunden</span>;
  return (
    <div className={compact ? "source-pills-compact" : "source-row"}>
      {sources.map((source) => (
        <SourcePill key={`${source.sourceUrl}-${source.sourceStand}`} source={source} />
      ))}
    </div>
  );
}
