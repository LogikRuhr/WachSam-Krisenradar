import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { QualityStrip } from "@/components/QualityStrip";
import { SectionHeader } from "@/components/SectionHeader";
import { SourcePills } from "@/components/SourcePill";
import { bereichLabel } from "@/lib/personalization";
import { formatIndex, getCostImpacts } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function KostenPage() {
  const state = await getCostImpacts();
  return (
    <main className="page-shell">
      <SectionHeader label="Kostenradar" title="Was teurer werden kann">
        <p>Mögliche Mehrkosten für Haushalte — sortiert nach Bereich und Zeitfenster, mit Einschätzung der Sicherheit und Quellenangabe.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="single-list">
        {state.rows.map((item, index) => (
          <PainCard
            key={item.id}
            number={formatIndex(index)}
            title={item.titel}
            meta={<ConfidenceBadge value={item.confidence} />}
            footer={
              <>
                <QualityStrip
                  context={`Kostenkarte ${item.titel}`}
                  sources={item.sources}
                  confidence={item.confidence}
                  stand={item.sources[0]?.sourceStand ?? null}
                />
                <SourcePills sources={item.sources} />
              </>
            }
          >
            <p>{item.beschreibung}</p>
            <p><strong>Bereich:</strong> {bereichLabel(item.bereich)} · <strong>Zeithorizont:</strong> {item.zeithorizont}</p>
            <p><strong>Unsicherheit:</strong> {item.unsicherheit}</p>
          </PainCard>
        ))}
      </section>
    </main>
  );
}
