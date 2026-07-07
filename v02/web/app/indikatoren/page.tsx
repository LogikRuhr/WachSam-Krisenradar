import Link from "next/link";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { ScaleLegend } from "@/components/ScaleLegend";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { computeZone } from "@/lib/indicator-zones";
import type { ScaleDirection } from "@/lib/indicator-zones";
import { formatIndex, getIndicators } from "@/lib/public-data";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

export const dynamic = "force-dynamic";

export default async function IndikatorenPage() {
  const state = await getIndicators();
  return (
    <main className="page-shell">
      <SectionHeader label="Frühwarnung" title="Worauf WachSam achtet">
        <p>Schwellenwerte und Kennzahlen, bei denen sich die Lage für Haushalte verschärfen könnte.</p>
      </SectionHeader>
      {!state.connected ? <DbNotice error={state.error} /> : null}
      <ScaleLegend variant="indicators" />
      <section className="card-grid">
        {state.rows.map((item, index) => {
          const currentVal = item.currentValue != null ? Number(item.currentValue) : null;
          const warnVal = item.thresholdWarn != null ? Number(item.thresholdWarn) : null;
          const critVal = item.thresholdCritical != null ? Number(item.thresholdCritical) : null;
          const zoneResult = computeZone(
            currentVal,
            warnVal,
            critVal,
            item.scaleDirection as ScaleDirection,
          );

          return (
            <PainCard key={item.id} number={formatIndex(index)} title={item.label} meta={<SeverityBadge value={item.severityTrigger} />} footer={<><SourcePills sources={item.sources} /><Link className="cross-link font-mono uppercase tracking-wide text-[var(--color-accent)]" href={`/indikatoren/${item.id}`}>Indikator öffnen</Link>{item.linkedCascade ? <Link className="cross-link" href={`/kaskaden/${item.linkedCascade}`}>Wirkungskette</Link> : null}</>}>
              <p><strong>System:</strong> {item.system}</p>
              <p><strong>Warn:</strong> {item.thresholdWarn ?? "—"} {item.unit ?? ""} · <strong>Kritisch:</strong> {item.thresholdCritical ?? "—"} {item.unit ?? ""}</p>
              <p><strong>Quelle:</strong> {item.quelle}</p>
              {currentVal != null && zoneResult ? (
                <div className="indicator-live-value">
                  <span className={`zone-dot zone-dot-${zoneResult.zone}`} />
                  <span className="mono-meta">
                    Aktueller Wert: {currentVal} {item.unit ?? ""} — Stand des Werts{" "}
                    {item.currentValueDate ? DATE_FMT.format(item.currentValueDate) : "unbekannt"}
                  </span>
                </div>
              ) : null}
            </PainCard>
          );
        })}
      </section>
    </main>
  );
}
