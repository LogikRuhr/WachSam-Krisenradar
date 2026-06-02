type DisclosureSectionProps = {
  number: string;
  title: string;
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function DisclosureSection({ number, title, summary, children, defaultOpen = false }: DisclosureSectionProps) {
  return (
    <details className="disclosure-section" open={defaultOpen}>
      <summary className="disclosure-summary">
        <span className="disclosure-number">{number}</span>
        <span>
          <span className="disclosure-title">{title}</span>
          <span className="disclosure-copy">{summary}</span>
        </span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
