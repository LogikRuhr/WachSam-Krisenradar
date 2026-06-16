import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CascadeCausalityMap } from "@/components/CascadeCausalityMap";
import { CascadeIndicatorLinks } from "@/components/CascadeIndicatorLinks";
import { CascadeStoryPanel } from "@/components/CascadeStoryPanel";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { getCascadeById, getItemSources } from "@/lib/public-data";
import { systemLabel } from "@/lib/personalization";

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
  const timeToImpact = textFromRecord(data.germanyRelevance, "time_to_impact");

  return (
    <main className="page-shell cascade-detail" aria-labelledby="page-title">
      <Link className="detail-back" href="/kaskaden">← Zurück zur Liste</Link>

      <section className="cascade-hero-panel" aria-labelledby="page-title">
        <div className="cascade-hero-copy">
          <div className="strich" aria-hidden="true" />
          <p className="mono-label">Wirkungskette</p>
          <h1 id="page-title" className="bebas-title">{data.title}</h1>
          <p className="cascade-impact-line">{data.haushaltswirkung}</p>
          <p>
            WachSam ordnet diese Kette als mögliche Weitergabe von einer globalen Entwicklung über betroffene Systeme bis in den Alltag deutscher Haushalte ein.
          </p>
          <div className="detail-badge-row">
            <SeverityBadge value={data.severity} />
            <ConfidenceBadge value={data.confidence} />
            <span className="mono-label">{timeToImpact ?? data.zeithorizont}</span>
          </div>
        </div>
        <CascadeCausalityMap
          trigger={data.trigger}
          steps={data.steps}
          householdImpact={data.haushaltswirkung}
          germanyRelevance={germanyDescription}
          confidence={data.confidence}
          severity={data.severity}
          timeToImpact={timeToImpact ?? data.zeithorizont}
          compact
        />
      </section>

      <div className="cascade-story-stack">
        <CascadeStoryPanel
          eyebrow="01 Entwicklung"
          title="Was stößt die Kette an?"
          visualLabel="Auslöser"
          visualTitle="Globale Entwicklung"
          visualItems={[data.trigger, germanyDescription ?? "Deutschland-Bezug redaktionell eingeordnet"]}
          body={
            <>
              <p>{data.trigger}</p>
              <p>{germanyDescription ?? "Deutschland-Bezug ist im Datensatz als Einordnung hinterlegt."}</p>
            </>
          }
        />

        <CascadeStoryPanel
          eyebrow="02 Systembelastung"
          title="Wo setzt sich der Druck fort?"
          visualLabel="Betroffene Systeme"
          visualTitle={systems.length ? systems.map(systemLabel).slice(0, 3).join(" · ") : "Systembereiche"}
          visualItems={data.steps.map((step) => textFromRecord(step, "description") ?? "Kaskadenschritt")}
          reverse
          body={
            <ol className="cascade-clean-list">
              {data.steps.map((step, index) => (
                <li key={`${index}-${textFromRecord(step, "description")}`}>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <span>{textFromRecord(step, "description") ?? "Kaskadenschritt wird redaktionell eingeordnet."}</span>
                </li>
              ))}
            </ol>
          }
        />

        <CascadeStoryPanel
          eyebrow="03 Haushalt"
          title="Was heißt das im Alltag?"
          visualLabel="Auswirkung"
          visualTitle="Haushalt"
          visualItems={[data.haushaltswirkung, `Zeithorizont: ${timeToImpact ?? data.zeithorizont}`, `Einschätzungssicherheit: ${data.confidence}`]}
          body={
            <>
              <p>{data.haushaltswirkung}</p>
              <p>Die Einordnung bleibt probabilistisch: möglich, zeitverzögert und abhängig von Quellenlage, Preisen und politischer Reaktion.</p>
              <div className="cascade-action-row">
                <Link className="text-link" href="/massnahmen">Maßnahmen ansehen</Link>
                <Link className="text-link" href="/profil">Haushaltsprofil im Member-Bereich pflegen</Link>
              </div>
            </>
          }
        />
      </div>

      <CascadeIndicatorLinks links={data.indicatorLinks} />

      <section className="cascade-source-band" aria-labelledby="cascade-source-heading">
        <div>
          <p className="mono-label">Quellen und Unsicherheit</p>
          <h2 id="cascade-source-heading" className="detail-title-small">Warum diese Einordnung nicht automatisch ist</h2>
          <p>WachSam zeigt eine redaktionelle Wirkungskette, keine sichere Prognose. Einschätzungssicherheit, Stand und Quellen bleiben deshalb sichtbar.</p>
        </div>
        <div className="cascade-source-stack">
          <div className="detail-badge-row">
            <ConfidenceBadge value={data.confidence} />
            <span className="mono-label">Zeithorizont: {timeToImpact ?? data.zeithorizont}</span>
          </div>
          <SourcePills sources={sources} compact />
          <Link className="text-link" href={`/deutschland-relevanz/${data.id}`}>Deutschland-Relevanz öffnen</Link>
        </div>
      </section>
    </main>
  );
}
