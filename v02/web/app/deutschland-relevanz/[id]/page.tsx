import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DbNotice } from "@/components/DbNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { getHotspotById } from "@/lib/public-data";

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
  const { data } = await getHotspotById(id);
  return { title: data ? `Deutschland-Relevanz: ${data.title} · WachSam` : "Deutschland-Relevanz · WachSam" };
}

export default async function HotspotDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data, connected, error } = await getHotspotById(id);
  if (!connected) return <main className="page-shell"><DbNotice error={error} /></main>;
  if (!data) notFound();

  const germanyDescription = textFromRecord(data.germanyRelevance, "description");
  const systems = stringListFromRecord(data.germanyRelevance, "systems_affected");

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <Link className="detail-back" href="/kaskaden">← Zurück zur Kaskade-Liste</Link>
      <SectionHeader label="Deutschland-Relevanz" title={data.title}>
        <p>Hotspot-Sicht: globale Entwicklung, Deutschland-Wirkung und Haushaltsauswirkung in einer Lesespur.</p>
      </SectionHeader>
      <section className="detail-grid-three">
        <div className="detail-panel">
          <h2 className="detail-title-small">Globale Entwicklung</h2>
          <p>{data.trigger}</p>
        </div>
        <div className="detail-panel">
          <h2 className="detail-title-small">Deutschland-Wirkung</h2>
          <p>{germanyDescription ?? "Keine Beschreibung hinterlegt."}</p>
        </div>
        <div className="detail-panel">
          <h2 className="detail-title-small">Haushaltsauswirkung</h2>
          <p>{data.haushaltswirkung}</p>
        </div>
      </section>
      {systems.length ? (
        <section className="detail-panel chain-box">
          <h2 className="detail-title-small">Betroffene Systeme</h2>
          <div className="system-badge-row">{systems.map((system) => <span className="system-badge" key={system}>{system}</span>)}</div>
        </section>
      ) : null}
      <nav className="detail-panel chain-box" aria-label="Weiterlesen">
        <div className="detail-badge-row">
          <Link className="text-link" href={`/kaskaden/${data.id}`}>Ganze Wirkungskette lesen</Link>
          <Link className="text-link" href="/lagebild">Zum Lagebild</Link>
        </div>
      </nav>
    </main>
  );
}
