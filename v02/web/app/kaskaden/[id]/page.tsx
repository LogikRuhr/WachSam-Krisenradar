import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CascadeCausalityMap } from "@/components/CascadeCausalityMap";
import { DbNotice } from "@/components/DbNotice";
import { DisclosureSection } from "@/components/DisclosureSection";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { getCascadeById, getItemSources } from "@/lib/public-data";

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

const systemLabels: Record<string, string> = {
  arbeit: "Arbeit",
  energie: "Energie",
  finanzen: "Finanzen",
  gesellschaft: "Gesellschaft",
  gesundheit: "Gesundheit",
  industrie: "Industrie",
  infrastruktur: "Infrastruktur",
  lebensmittel: "Lebensmittel",
  logistik: "Logistik",
  mobilitaet: "Mobilität",
};

function systemLabel(system: string) {
  return systemLabels[system] ?? system;
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
  const timeToImpact = textFromRecord(data.germanyRelevance, "time_to_impact");

  return (
    <main className="page-shell cascade-detail" aria-labelledby="page-title">
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
          <section className="cascade-summary-panel" aria-label="Kurzfassung der Wirkungskette">
            <p className="mono-label">Kurz erklärt</p>
            <p className="lead">{data.haushaltswirkung}</p>
            <p>
              WachSam liest diese Kette als mögliche Weitergabe von einem globalen Signal über betroffene Systeme bis in den Alltag deutscher Haushalte.
              Die Einordnung bleibt redaktionell und ist keine sichere Prognose.
            </p>
          </section>

          <div className="disclosure-stack">
            <DisclosureSection
              number="01"
              title="Wirkungskette ansehen"
              summary="Signal, Systemstress und Haushaltswirkung als Karte."
              defaultOpen
            >
              <CascadeCausalityMap
                trigger={data.trigger}
                steps={data.steps}
                householdImpact={data.haushaltswirkung}
                confidence={data.confidence}
                severity={data.severity}
                timeToImpact={timeToImpact ?? data.zeithorizont}
              />
            </DisclosureSection>

            <DisclosureSection
              number="02"
              title="Deutschland-Relevanz"
              summary="Warum diese globale Entwicklung fuer Deutschland relevant ist."
            >
              <p>{germanyDescription ?? "Deutschland-Bezug ist im Datensatz als Einordnung hinterlegt."}</p>
              {systems.length ? (
                <div className="system-badge-row">
                  {systems.map((system) => (
                    <span className="system-badge" key={system}>{systemLabel(system)}</span>
                  ))}
                </div>
              ) : null}
            </DisclosureSection>

            <DisclosureSection
              number="03"
              title="Haushaltswirkung"
              summary="Welche Alltagsbereiche dadurch belastet werden koennen."
            >
              <p>{data.haushaltswirkung}</p>
              <Link className="text-link" href="/massnahmen">Passende Maßnahmen ansehen</Link>
            </DisclosureSection>

            <DisclosureSection
              number="04"
              title="Quellen und Unsicherheit"
              summary="Stand, Quellen und redaktionelle Evidenzspur."
            >
              <div className="detail-badge-row">
                <DeutscheConfidenceBadge value={data.confidence} />
                <span className="mono-label">Zeithorizont: {timeToImpact ?? data.zeithorizont}</span>
              </div>
              <SourcePills sources={sources} />
              <p className="mono-meta">Redaktionelle Einordnung, kein Automatismus.</p>
            </DisclosureSection>
          </div>
        </section>
        <aside className="detail-aside" aria-label="Deutschland-Relevanz und Quellen">
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Lesefluss</h2>
            <p>Öffne die Abschnitte der Reihe nach: erst die Karte, dann Deutschland-Relevanz, Haushaltswirkung und Quellen.</p>
          </section>
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Nächster Schritt</h2>
            <Link className="text-link" href="/profil">Haushaltsprofil im Member-Bereich pflegen</Link>
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
