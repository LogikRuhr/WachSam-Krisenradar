import Link from "next/link";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { DbNotice } from "@/components/DbNotice";
import { PfadHub } from "@/components/PfadHub";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { describeLinks, getCascades, getHeroLagebild } from "@/lib/public-data";
import { getCurrentUserModus } from "@/lib/use-user-modus";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentModus = await getCurrentUserModus();
  const hero = await getHeroLagebild();
  const cascades = await getCascades();
  const item = hero.rows[0];
  const itemSourceUrls = new Set(item?.sources.map((source) => source.sourceUrl) ?? []);
  const linkedCascade =
    cascades.rows.find((cascade) => cascade.sources.some((source) => itemSourceUrls.has(source.sourceUrl))) ?? cascades.rows[0];
  const steps = describeLinks(linkedCascade?.steps);
  const modusLead = currentModus
    ? {
        single: "Für Singles markiert WachSam besonders Kosten- und Versorgungsfolgen, die ohne geteilte Haushaltslast spürbar werden.",
        familie: "Für Familien ordnet WachSam ein, welche Signale Alltag, Planung und gemeinsame Haushaltskosten berühren können.",
        selbststaendig: "Für Selbstständige hebt WachSam hervor, wo Haushalts- und Arbeitsrisiken ineinandergreifen können.",
        rentner: "Für Rentnerinnen und Rentner achtet WachSam besonders auf planbare Kosten, Versorgung und stabile Routinen.",
      }[currentModus]
    : null;

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Heute im Fokus" title={linkedCascade?.title ?? "Die Lage für deutsche Haushalte"}>
        <p>Ruhige Einordnung globaler Signale in mögliche Auswirkungen auf deutsche Haushalte.</p>
      </SectionHeader>

      {!hero.connected ? <DbNotice error={hero.error} /> : null}

      {item ? (
        <section className="hero-card focus-card">
          <div className="card-meta">
            <SeverityBadge value={item.severity} />
            <ConfidenceBadge value={item.confidence} />
            <span className="mono-label">{item.bereich}</span>
          </div>
          <h2 className="focus-title">{item.titel}</h2>
          <p className="lead">{item.beschreibung}</p>
          {modusLead ? <p className="lead">{modusLead}</p> : null}
          <div className="chain-box">
            <span className="mono-label">Wirkungskette</span>
            <p>{linkedCascade ? linkedCascade.trigger : item.primaerindikator}</p>
            {steps.length ? <ol>{steps.slice(0, 4).map((step) => <li key={step}>{step}</li>)}</ol> : null}
          </div>
          <SourcePills sources={item.sources} />
          <Link className="btn-rost" href={linkedCascade ? `/kaskaden/${linkedCascade.id}` : "/kaskaden"}>
            Zur Wirkungskette
          </Link>
        </section>
      ) : (
        <section className="hero-card"><p className="lead">Sobald die Datenbank verbunden ist, erscheint hier das höchste Lagebild-Item.</p></section>
      )}

      <PfadHub />
    </main>
  );
}
