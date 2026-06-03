import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { getCascades } from "@/lib/public-data";

export const dynamic = "force-dynamic";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default async function KaskadenPage() {
  const state = await getCascades();
  return (
    <main className="page-shell">
      <SectionHeader label="Wirkungsketten" title="Wie Krisen zusammenhängen">
        <p>Ursache-Wirkung-Ketten zeigen, wie globale Entwicklungen über mehrere Stufen auf deutsche Haushalte wirken können.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <section className="single-list">
        {state.rows.map((item, index) => (
          <PainCard key={item.id} number={letters[index] ?? item.id} title={item.title} meta={<><SeverityBadge value={item.severity} /><ConfidenceBadge value={item.confidence} /></>} footer={<><SourcePills sources={item.sources} /><Link className="cross-link" href={`/kaskaden/${item.id}`}>Detail öffnen</Link></>}>
            <p>{item.trigger}</p>
            <p><strong>Zeithorizont:</strong> {item.zeithorizont}</p>
            <p><strong>Haushaltsauswirkung:</strong> {item.haushaltswirkung}</p>
          </PainCard>
        ))}
      </section>
    </main>
  );
}
