import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SourcePill } from "@/components/SourcePill";
import { formatIndex, getSourceTrustLayer } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function QuellenPage() {
  const state = await getSourceTrustLayer();
  return (
    <main className="page-shell">
      <SectionHeader label="Quellen" title="Quellen & Methodik">
        <p>WachSam stützt sich auf öffentliche Quellen — Behörden, Institute, Fachmedien. Jede Einschätzung zeigt, woher sie stammt und wie sicher sie ist.</p>
      </SectionHeader>
      <section className="legend-box">
        <p><strong>Legende:</strong> Die Evidenzstärke zeigt, wie gut eine Einschätzung belegt ist. Die Einstufung zeigt die mögliche Belastung für Haushalte. Der Stand gibt an, wann die Quelle zuletzt geprüft wurde.</p>
      </section>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="card-grid">
        {state.rows.map((source, index) => (
          <PainCard key={source.sourceUrl} number={formatIndex(index)} title={source.sourceName} footer={<SourcePill source={source} />}>
            <p><strong>Stand:</strong> {source.sourceStand}</p>
            <p><strong>Zitiert von:</strong> {source.citedItems.join(", ")}</p>
          </PainCard>
        ))}
      </section>
    </main>
  );
}
