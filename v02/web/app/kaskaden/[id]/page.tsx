import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DbNotice } from "@/components/DbNotice";
import { EffectPath } from "@/components/EffectPath";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { describeLinks, getCascadeById, getItemSources } from "@/lib/public-data";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function textFromRecord(value: Record<string, unknown> | null | undefined, key: string) {
  const raw = value?.[key];
  return typeof raw === "string" ? raw : null;
}

function stringListFromRecord(value: Record<string, unknown> | null | undefined, key: string) {
  const raw = value?.[key];
  return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === "string") : [];
}

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
  const { data } = await getCascadeById(id);
  return { title: data ? `${data.title} · WachSam` : "Wirkungskette · WachSam" };
}

export default async function CascadeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data, connected, error } = await getCascadeById(id);
  if (!connected) return <main className="page-shell"><DbNotice error={error} /></main>;
  if (!data) notFound();

  const sourceState = await getItemSources("cascade", id);
  const sources = sourceState.data ?? [];
  const systems = stringListFromRecord(data.germanyRelevance, "systems_affected");
  const germanyDescription = textFromRecord(data.germanyRelevance, "description");
  const stepText = describeLinks(data.steps);

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <Link className="detail-back" href="/kaskaden">← Zurück zur Liste</Link>
      <SectionHeader label="Wirkungskette" title={data.title}>
        <p>{data.trigger}</p>
      </SectionHeader>
      <div className="detail-grid-three">
        <section className="detail-main detail-main-span-two">
          <div className="detail-badge-row">
            <SeverityBadge value={data.severity} />
            <DeutscheConfidenceBadge value={data.confidence} />
            <span className="mono-label">{data.zeithorizont}</span>
          </div>
          <EffectPath
            signal={data.trigger}
            germanyRelevance={germanyDescription ?? "Deutschland-Bezug ist im Datensatz als Einordnung hinterlegt."}
            systemstress={stepText.length ? <ol className="detail-list">{stepText.map((step) => <li key={step}>{step}</li>)}</ol> : "Systemstress wird über die Kaskadenschritte eingeordnet."}
            haushalt={data.haushaltswirkung}
            evidenz={data.confidence}
          />
          <section className="detail-panel">
            <h2 className="detail-title-small">Haushaltswirkung</h2>
            <p>{data.haushaltswirkung}</p>
          </section>
        </section>
        <aside className="detail-aside" aria-label="Deutschland-Relevanz und Quellen">
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Deutschland-Relevanz</h2>
            <p>{germanyDescription ?? "Keine Beschreibung hinterlegt."}</p>
            {systems.length ? <div className="system-badge-row">{systems.map((system) => <span className="system-badge" key={system}>{system}</span>)}</div> : null}
          </section>
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Quellen</h2>
            <SourcePills sources={sources} />
          </section>
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Weitere Lesespur</h2>
            <Link className="text-link" href={`/deutschland-relevanz/${data.id}`}>Deutschland-Relevanz öffnen</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
