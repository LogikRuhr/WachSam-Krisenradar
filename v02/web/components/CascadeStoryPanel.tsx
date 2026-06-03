type CascadeStoryPanelProps = {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  visualLabel: string;
  visualTitle: string;
  visualItems: string[];
  reverse?: boolean;
};

export function CascadeStoryPanel({
  eyebrow,
  title,
  body,
  visualLabel,
  visualTitle,
  visualItems,
  reverse = false,
}: CascadeStoryPanelProps) {
  return (
    <section className={reverse ? "cascade-story-panel cascade-story-panel-reverse" : "cascade-story-panel"}>
      <div className="cascade-story-visual" aria-hidden="true">
        <span className="cascade-story-visual-label">{visualLabel}</span>
        <strong>{visualTitle}</strong>
        <div className="cascade-story-lines">
          {visualItems.map((item, index) => (
            <span key={`${item}-${index}`} style={{ "--line-index": index } as React.CSSProperties}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="cascade-story-copy">
        <p className="mono-label">{eyebrow}</p>
        <h2>{title}</h2>
        <div>{body}</div>
      </div>
    </section>
  );
}
