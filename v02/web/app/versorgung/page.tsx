import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { formatIndex, getSupplyRisks } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function VersorgungPage() {
  const state = await getSupplyRisks();
  return (
    <main className="page-shell">
      <SectionHeader label="Versorgungsradar" title="Was knapp werden kann">
        <p>Bereiche, in denen Engpässe oder Verzögerungen für Haushalte entstehen könnten.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="card-grid">
        {state.rows.map((item, index) => (
          <PainCard key={item.id} number={formatIndex(index)} title={item.titel} meta={<><SeverityBadge value={item.severity} /><ConfidenceBadge value={item.confidence} /></>} footer={<SourcePills sources={item.sources} />}>
            <p>{item.beschreibung}</p>
            <p><strong>Bereich:</strong> {item.bereich} · <strong>Zeithorizont:</strong> {item.zeithorizont}</p>
            {item.unsicherheit ? <p><strong>Unsicherheit:</strong> {item.unsicherheit}</p> : null}
          </PainCard>
        ))}
      </section>
    </main>
  );
}
