import { MonoLabel } from "./MonoLabel";

export function SectionHeader({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="section-header">
      <div className="strich" />
      <MonoLabel>{label}</MonoLabel>
      <h1 className="bebas-title">{title}</h1>
      {children ? <div className="section-sub">{children}</div> : null}
    </header>
  );
}
