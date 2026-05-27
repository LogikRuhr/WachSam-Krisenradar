import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DbNotice } from "@/components/DbNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { SourcePills } from "@/components/SourcePill";
import { getGovernanceById, getItemSources } from "@/lib/public-data";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function DeutscheConfidenceBadge({ value }: { value?: string | null }) {
  const key = value ?? "niedrig";
  const labels: Record<string, string> = {
    niedrig: "Sicherheit der Einschätzung niedrig",
    mittel: "Sicherheit der Einschätzung mittel",
    hoch: "Sicherheit der Einschätzung hoch",
  };
  return <span className={`confidence-badge confidence-${key}`}>{labels[key] ?? `Sicherheit der Einschätzung ${key}`}</span>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getGovernanceById(id);
  return { title: data ? `${data.title} · WachSam` : "Vertrauenslage · WachSam" };
}

export default async function GovernanceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data, connected, error } = await getGovernanceById(id);
  if (!connected) return <main className="page-shell"><DbNotice error={error} /></main>;
  if (!data) notFound();

  const sourceState = await getItemSources("governance", id);
  const sources = sourceState.data ?? [];

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <Link className="detail-back" href="/governance">← Zurück zur Liste</Link>
      <SectionHeader label="Vertrauenslage" title={data.title}>
        <p>Versprechen, Realität und mögliche Haushaltswirkung als nachvollziehbare Vertrauenslage.</p>
      </SectionHeader>
      <div className="detail-badge-row">
        <DeutscheConfidenceBadge value={data.confidence} />
        <span className="mono-label">Sicherheit der Einschätzung</span>
      </div>
      <section className="two-col chain-box">
        <div className="detail-panel">
          <h2 className="detail-title-small">Versprechen</h2>
          <p>{data.versprechen}</p>
        </div>
        <div className="detail-panel">
          <h2 className="detail-title-small">Realität</h2>
          <p>{data.realitaet}</p>
        </div>
      </section>
      <section className="detail-panel">
        <h2 className="detail-title-small">Haushaltswirkung</h2>
        <p>{data.haushaltswirkung}</p>
      </section>
      <section className="detail-panel chain-box">
        <h2 className="detail-title-small">Quellen</h2>
        <SourcePills sources={sources} />
      </section>
      {data.linkedCascade ? (
        <section className="detail-panel">
          <h2 className="detail-title-small">Verknüpfte Wirkungskette</h2>
          <Link className="text-link" href={`/kaskaden/${data.linkedCascade}`}>Wirkungskette öffnen</Link>
        </section>
      ) : null}
    </main>
  );
}
