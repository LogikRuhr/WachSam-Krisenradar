import Link from "next/link";
import { indicatorVitals, type TrendDirection } from "@/lib/indicator-zones";
import { systemLabel } from "@/lib/personalization";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

const NUM_FMT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

/** Strukturelle Sicht auf eine Indikator-Row (Ergebnis von getHeadlineVitals()). */
export type VitalIndicator = {
  id: string;
  label: string;
  system: string;
  unit: string | null;
  currentValue: string | number | null;
  previousValue: string | number | null;
  currentValueDate: Date | null;
  thresholdWarn: string | number | null;
  thresholdCritical: string | number | null;
  scaleDirection: string;
  zoneTextUncritical: string | null;
  zoneTextElevated: string | null;
  zoneTextCritical: string | null;
};

const TREND_LABEL: Record<TrendDirection, string> = {
  up: "höher als zuvor",
  down: "niedriger als zuvor",
  flat: "unverändert",
};

const TREND_SYMBOL: Record<TrendDirection, string> = {
  up: "▲",
  down: "▼",
  flat: "→",
};

function formatNumber(value: number): string {
  return NUM_FMT.format(value);
}

function VitalCard({ indicator }: { indicator: VitalIndicator }) {
  const vitals = indicatorVitals(indicator);
  const zoneKey = vitals.zone?.zone ?? null;
  const stand = vitals.currentValueDate ? DATE_FMT.format(vitals.currentValueDate) : null;
  const unit = indicator.unit ?? "";

  return (
    <Link
      className={`vital-card hover-rost${zoneKey ? ` vital-card-${zoneKey}` : ""}`}
      href={`/indikatoren/${indicator.id}`}
      aria-label={`${indicator.label} — Detailansicht öffnen`}
    >
      <span className="mono-label vital-system">{systemLabel(indicator.system)}</span>
      <span className="vital-label">{indicator.label}</span>

      {vitals.pending ? (
        <span className="vital-value vital-value-pending">Stand ausstehend</span>
      ) : (
        <span className="vital-value">
          <strong>{formatNumber(vitals.currentValue as number)}</strong>
          {unit ? <span className="vital-unit">{unit}</span> : null}
        </span>
      )}

      <div className="vital-meta">
        {vitals.zone ? (
          <span className={`vital-zone vital-zone-${vitals.zone.zone}`}>{vitals.zone.zoneLabel}</span>
        ) : !vitals.pending ? (
          <span className="vital-zone vital-zone-none">Keine Schwellen hinterlegt</span>
        ) : null}

        {!vitals.pending && vitals.delta != null ? (
          <span className={`vital-trend vital-trend-${vitals.trend}`}>
            <span aria-hidden="true">{TREND_SYMBOL[vitals.trend]}</span> {TREND_LABEL[vitals.trend]}
            {vitals.delta !== 0 ? ` (${vitals.delta > 0 ? "+" : ""}${formatNumber(vitals.delta)}${unit ? ` ${unit}` : ""})` : ""}
          </span>
        ) : null}
      </div>

      <span className="mono-label vital-stand">{stand ? `Stand ${stand}` : "Stand ausstehend"}</span>
    </Link>
  );
}

/**
 * Vitalwert-Board des Gesamtstands. Rendert die Headline-Indikatoren als Kachel-
 * Board mit Zonen-Farbe (computeZone wiederverwendet), Trend (current vs previous)
 * und ehrlichem Leerzustand ("Stand ausstehend"), wenn kein Live-Wert vorliegt —
 * keine erfundenen Zahlen. Jede Kachel zeigt ihr eigenes Stand-Datum, damit
 * gemischte Kadenz (Quartal/Monat/Datum) nicht gleichaktuell wirkt.
 */
export function VitalsBoard({
  indicators,
  limit,
  heading = "Vitalwerte Deutschland",
  intro,
}: {
  indicators: VitalIndicator[];
  limit?: number;
  heading?: string;
  intro?: string;
}) {
  const rows = limit != null ? indicators.slice(0, limit) : indicators;

  if (rows.length === 0) {
    return (
      <section className="vitals-board-empty" aria-label="Vitalwerte Deutschland">
        <p className="mono-label">{heading}</p>
        <p>
          Aktuell sind keine Headline-Vitalwerte freigegeben. Sobald Indikatoren mit
          aktuellem Stand vorliegen, erscheinen sie hier mit Wert, Zone und Datenstand.
        </p>
      </section>
    );
  }

  const anyPending = rows.some((indicator) => indicatorVitals(indicator).pending);

  return (
    <section className="vitals-board-wrap" aria-labelledby="vitals-board-heading">
      <div className="home-section-head">
        <p id="vitals-board-heading" className="mono-label">{heading}</p>
        {intro ? <p>{intro}</p> : null}
      </div>
      <div className="vitals-board">
        {rows.map((indicator) => (
          <VitalCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
      {anyPending ? (
        <p className="vitals-board-note mono-label">
          Einzelne Werte sind als „Stand ausstehend“ markiert — WachSam zeigt keine
          Platzhalter-Zahlen, sondern den ehrlichen Stand der Datenanbindung.
        </p>
      ) : null}
    </section>
  );
}
