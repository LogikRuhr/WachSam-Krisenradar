import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DbNotice } from "@/components/DbNotice";
import { InjectionTracker } from "@/components/InjectionTracker";
import { SectionHeader } from "@/components/SectionHeader";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourcePills } from "@/components/SourcePill";
import { ThresholdBar } from "@/components/ThresholdBar";
import { computeInjectionPeriod, computeZone } from "@/lib/indicator-zones";
import type { ScaleDirection } from "@/lib/indicator-zones";
import { getIndicatorById, getItemSources } from "@/lib/public-data";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function germanyText(value: Record<string, unknown>) {
  const description = value.description;
  return typeof description === "string" ? description : "Keine Beschreibung hinterlegt.";
}

function formatThreshold(value: string | null, unit: string | null) {
  return value ? `${value}${unit ? ` ${unit}` : ""}` : "—";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getIndicatorById(id);
  return { title: data ? `${data.label} · WachSam` : "Frühwarnindikator · WachSam" };
}

export default async function IndicatorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data, connected, error } = await getIndicatorById(id);
  if (!connected) return <main className="page-shell"><DbNotice error={error} /></main>;
  if (!data) notFound();

  const sourceState = await getItemSources("indicator", id);
  const sources = sourceState.data ?? [];

  const currentVal = data.currentValue ? Number(data.currentValue) : null;
  const warnVal = data.thresholdWarn ? Number(data.thresholdWarn) : null;
  const critVal = data.thresholdCritical ? Number(data.thresholdCritical) : null;

  const zoneResult = computeZone(
    currentVal,
    warnVal,
    critVal,
    data.scaleDirection as ScaleDirection,
    { uncritical: data.zoneTextUncritical, elevated: data.zoneTextElevated, critical: data.zoneTextCritical },
  );

  const injection = computeInjectionPeriod(
    currentVal,
    data.previousValue ? Number(data.previousValue) : null,
    data.targetValue ? Number(data.targetValue) : null,
    data.targetDeadline,
  );

  const hasLiveValue = currentVal != null;
  const subText = hasLiveValue
    ? "Aktueller Stand mit Schwellenwert-Einordnung."
    : "Statische Schwellenwert-Übersicht — kein Live-Wert.";

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <Link className="detail-back" href="/indikatoren">← Zurück zur Liste</Link>
      <SectionHeader label="Frühwarnindikator" title={data.label}>
        <p>{subText}</p>
      </SectionHeader>
      <div className="detail-grid">
        <section className="detail-main">
          <div className="detail-badge-row">
            <SeverityBadge value={data.severityTrigger} />
            <span className="mono-label">{data.system}</span>
          </div>

          {/* Schwellenwerte-Panel */}
          <section className="detail-panel">
            <h2 className="detail-title-small">Schwellenwerte</h2>
            <dl className="detail-dl">
              <dt>Warn</dt>
              <dd>{formatThreshold(data.thresholdWarn, data.unit)}</dd>
              <dt>Kritisch</dt>
              <dd>{formatThreshold(data.thresholdCritical, data.unit)}</dd>
            </dl>
          </section>

          {/* Threshold Bar — nur wenn Schwellenwerte vorhanden */}
          {warnVal != null && critVal != null ? (
            <section className="detail-panel">
              <h2 className="detail-title-small">Schwellenwert-Skala</h2>
              <ThresholdBar
                currentValue={currentVal}
                currentValueDate={data.currentValueDate}
                thresholdWarn={warnVal}
                thresholdCritical={critVal}
                unit={data.unit ?? ""}
                scaleDirection={data.scaleDirection}
                zone={zoneResult?.zone ?? "uncritical"}
                zoneLabel={zoneResult?.zoneLabel ?? "Unkritisch"}
                zoneText={zoneResult?.zoneText ?? null}
              />
            </section>
          ) : null}

          {/* Injection Tracker — nur wenn Einspeisungsperiode relevant */}
          {injection ? (
            <InjectionTracker
              daysRemaining={injection.daysRemaining}
              gapToTarget={injection.gapToTarget}
              requiredDailyRate={injection.requiredDailyRate}
              actualDailyChange={injection.actualDailyChange}
              onTrack={injection.onTrack}
              periodActive={injection.periodActive}
              targetLabel={data.targetLabel ?? "Einspeisungsziel"}
              unit={data.unit ?? "Prozentpunkte"}
            />
          ) : null}

          {/* Hinweis-Panel */}
          {!hasLiveValue ? (
            <section className="detail-panel">
              <h2 className="detail-title-small">Hinweis</h2>
              <p>Statische Schwellenwert-Übersicht — kein Live-Wert.</p>
            </section>
          ) : null}
        </section>

        <aside className="detail-aside" aria-label="Deutschland-Relevanz und Quellen">
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Deutschland-Relevanz</h2>
            <p>{germanyText(data.germanyRelevance)}</p>
          </section>
          <section className="detail-aside-box">
            <h2 className="detail-title-small">Quelle</h2>
            <p>{data.quelle}</p>
            <SourcePills sources={sources} />
          </section>
          {data.lastIngestedAt ? (
            <section className="detail-aside-box">
              <h2 className="detail-title-small">Datenstand</h2>
              <p className="mono-meta">Letzte Abfrage: {DATE_FMT.format(data.lastIngestedAt)}</p>
            </section>
          ) : null}
          {data.linkedCascade ? (
            <section className="detail-aside-box">
              <h2 className="detail-title-small">Verknüpfte Wirkungskette</h2>
              <Link className="text-link" href={`/kaskaden/${data.linkedCascade}`}>Wirkungskette öffnen</Link>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
