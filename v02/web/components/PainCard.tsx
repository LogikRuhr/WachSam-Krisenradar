export function PainCard({
  number,
  title,
  meta,
  children,
  footer,
}: {
  number: string;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article className="pain-card hover-rost">
      <div className="pain-num">{number}</div>
      {meta ? <div className="card-meta">{meta}</div> : null}
      <h2 className="pain-title">{title}</h2>
      <div className="pain-text">{children}</div>
      {footer ? <footer className="card-footer">{footer}</footer> : null}
    </article>
  );
}
