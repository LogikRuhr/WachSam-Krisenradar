import type { Verdict as VerdictData } from "@/lib/personalization";

export function Verdict({ verdict, stand }: { verdict: VerdictData; stand?: string | null }) {
  return (
    <section className={`verdict verdict-${verdict.tone}`} aria-label="Gesamteinschätzung">
      <span className="verdict-dot" aria-hidden="true" />
      <p className="verdict-text">{verdict.text}</p>
      {stand ? <span className="mono-label verdict-stand">Stand {stand}</span> : null}
    </section>
  );
}
