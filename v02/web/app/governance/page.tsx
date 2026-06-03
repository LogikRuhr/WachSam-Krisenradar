import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SourcePills } from "@/components/SourcePill";
import { formatIndex, getGovernanceItems } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const state = await getGovernanceItems();
  return (
    <main className="page-shell">
      <SectionHeader label="Vertrauenslage" title="Versprechen und Realität">
        <p>Was wurde angekündigt — und was ist daraus geworden? Jeder Fall zeigt die Auswirkung auf Haushalte.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="card-grid">
        {state.rows.map((item, index) => (
          <PainCard key={item.id} number={formatIndex(index)} title={item.title} meta={<ConfidenceBadge value={item.confidence} />} footer={<><SourcePills sources={item.sources} /><Link className="cross-link font-mono uppercase tracking-wide text-[var(--color-accent)]" href={`/governance/${item.id}`}>Detail öffnen</Link>{item.linkedCascade ? <Link className="cross-link" href={`/kaskaden/${item.linkedCascade}`}>Wirkungskette</Link> : null}</>}>
            <div className="two-col"><p><strong>Versprechen</strong><br />{item.versprechen}</p><p><strong>Realität</strong><br />{item.realitaet}</p></div>
            <p><strong>Haushaltsauswirkung:</strong> {item.haushaltswirkung}</p>
          </PainCard>
        ))}
      </section>
    </main>
  );
}
