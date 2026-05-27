import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { formatIndex, getLagebildItems } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function LagebildPage() {
  const state = await getLagebildItems();
  return (
    <main className="page-shell">
      <SectionHeader label="Lagebild" title="Deutschland in zehn Bereichen">
        <p>Aktuelle Einschätzung der Lage in den wichtigsten Bereichen für deutsche Haushalte — mit Einstufung, Trend und Quellenangabe.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="card-grid">
        {state.rows.map((item, index) => (
          <PainCard
            key={item.id}
            number={formatIndex(index)}
            title={item.titel}
            meta={<><SeverityBadge value={item.severity} /><ConfidenceBadge value={item.confidence} /></>}
            footer={<SourcePills sources={item.sources} />}
          >
            <p>{item.beschreibung}</p>
            <p><strong>Bereich:</strong> {item.bereich} · <strong>Trend:</strong> {item.trend}</p>
            <p><strong>Primärindikator:</strong> {item.primaerindikator}</p>
          </PainCard>
        ))}
      </section>
    </main>
  );
}
