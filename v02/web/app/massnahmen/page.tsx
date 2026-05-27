import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SourcePills } from "@/components/SourcePill";
import { formatIndex, getCitizenActions } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function MassnahmenPage() {
  const state = await getCitizenActions();
  return (
    <main className="page-shell">
      <SectionHeader label="Maßnahmen" title="Was ich tun kann">
        <p>Praktische Schritte, die Haushalte jetzt prüfen oder vorbereiten können — ruhig, realistisch und mit Quellenangabe.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="card-grid">
        {state.rows.map((item, index) => (
          <PainCard key={item.id} number={formatIndex(index)} title={item.titel} meta={<span className="mono-label">Aufwand: {item.aufwand}</span>} footer={<SourcePills sources={item.sources} />}>
            <p>{item.beschreibung}</p>
            <p><strong>Bereich:</strong> {item.bereich}</p>
            <p><strong>Bezug:</strong> {item.bezugZuBereich.join(", ")}</p>
          </PainCard>
        ))}
      </section>
    </main>
  );
}
