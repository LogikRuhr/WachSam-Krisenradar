export type SourceLike = {
  sourceName: string;
  sourceUrl: string;
  sourceStand: string;
};

export function SourcePill({ source }: { source: SourceLike }) {
  return (
    <a className="source-pill hover-rost" href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
      {source.sourceName} · Stand {source.sourceStand}
    </a>
  );
}

export function SourcePills({ sources }: { sources?: SourceLike[] }) {
  if (!sources?.length) return <span className="source-pill source-pill-muted">Keine Quelle verbunden</span>;
  return (
    <div className="source-row">
      {sources.map((source) => (
        <SourcePill key={`${source.sourceUrl}-${source.sourceStand}`} source={source} />
      ))}
    </div>
  );
}
