import Link from "next/link";
import { SourcePills } from "./SourcePill";
import { ThemeStateBadge } from "./ThemeStateBadge";
import { WARNLAGE_CHANNEL } from "@/lib/themes";
import type { RadarTheme } from "@/lib/radar-data";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

function formatStand(value: string | Date | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date);
}

/** "≈ +8 €/Monat" bzw. "≈ −3 €/Monat" — Minuszeichen (U+2212) statt Bindestrich. */
function formatMonthlyDelta(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `≈ ${sign}${Math.abs(value)} €/Monat`;
}

function formatDriverMeta(currentValueDate: Date | null, sourceName: string | null): string {
  const stand = formatStand(currentValueDate) ? `Stand ${formatStand(currentValueDate)}` : "Stand ausstehend";
  return sourceName ? `${stand} · Quelle: ${sourceName}` : stand;
}

/**
 * Karte für einen Radar-Themenkanal (oder den amtlichen Warnlage-Sonderkanal).
 * Die Warnlage (`theme.key === WARNLAGE_CHANNEL.key`) wird bewusst NICHT über
 * die Treiber-Zonen erklärt (der einzige Treiber steht bis zum Schwellen-Seed
 * in Task 9 auf Zone "pending"), sondern über ihren amtlichen Charakter: Badge,
 * Quellenhinweis "DWD (amtlich)" und Stand — ehrlich als "Datenstand ausstehend"
 * markiert, wenn `sinceDate` fehlt.
 */
export function ThemeCard({ theme }: { theme: RadarTheme }) {
  const isWarnlage = theme.key === WARNLAGE_CHANNEL.key;
  const stand = formatStand(theme.sinceDate);

  return (
    <article
      className={`theme-card${isWarnlage ? " theme-card-official" : ""}`}
      aria-label={`Themenkanal ${theme.title}`}
    >
      <h3 className="theme-title">{theme.title}</h3>
      <span className="chain-label theme-question">{theme.question}</span>

      <div className="theme-card-head">
        <ThemeStateBadge state={theme.state} />
        {isWarnlage ? <span className="mono-label">Quelle: DWD (amtlich)</span> : null}
      </div>

      <p className="lead">{theme.lead}</p>

      <p className="theme-reason">
        <span className="chain-label">Warum sehe ich das?</span> {theme.reason}
      </p>

      {!isWarnlage && theme.drivers.length > 0 ? (
        <ul className="theme-driver-list">
          {theme.drivers.map((driver) => (
            <li key={driver.id} className="theme-driver">
              <span className="theme-driver-main">
                <span className={`zone-dot zone-dot-${driver.zone}`} aria-hidden="true" />
                <Link
                  className="theme-driver-link"
                  href={`/indikatoren/${driver.id}`}
                  aria-label={`${driver.label} Indikator öffnen`}
                >
                  {driver.label}
                </Link>
                {driver.currentValue != null ? (
                  <span className="mono-meta">
                    {driver.currentValue}
                    {driver.unit ? ` ${driver.unit}` : ""}
                  </span>
                ) : null}
              </span>
              <span className="mono-meta theme-driver-stand">{formatDriverMeta(driver.currentValueDate, driver.sourceName)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!isWarnlage && theme.sources.length > 0 ? <SourcePills sources={theme.sources} compact /> : null}

      {theme.costEstimate ? (
        <div className="theme-cost">
          <span className="theme-cost-value">{formatMonthlyDelta(theme.costEstimate.monthlyDeltaEur)}</span>
          <span className="theme-cost-note">
            Modellrechnung, keine Vorhersage — Basis: {theme.costEstimate.basis}; Annahmen:{" "}
            {theme.costEstimate.assumptions}
          </span>
        </div>
      ) : null}

      {stand || isWarnlage ? (
        <span className="mono-label theme-stand">{stand ? `Stand ${stand}` : "Datenstand ausstehend"}</span>
      ) : null}
    </article>
  );
}
