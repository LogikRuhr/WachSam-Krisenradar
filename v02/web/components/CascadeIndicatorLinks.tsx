import Link from "next/link";
import { indicatorVitals } from "@/lib/indicator-zones";
import { systemLabel } from "@/lib/personalization";
import type { CascadeIndicatorLink } from "@/lib/public-data";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
const NUM_FMT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

const ROLE_LABEL: Record<string, string> = {
  driver: "Treiber",
  affected: "Betroffen",
};

function IndicatorLinkRow({ link }: { link: CascadeIndicatorLink }) {
  const indicator = link.indicator;
  if (!indicator) return null;
  const vitals = indicatorVitals(indicator);
  const unit = indicator.unit ?? "";
  const stand = vitals.currentValueDate ? DATE_FMT.format(vitals.currentValueDate) : null;
  const zoneKey = vitals.zone?.zone ?? null;

  return (
    <li className="cascade-indicator-row">
      <div className="cascade-indicator-head">
        <span className={`vital-zone vital-role-${link.role}`}>{ROLE_LABEL[link.role] ?? link.role}</span>
        <Link className="text-link" href={`/indikatoren/${indicator.id}`}>{indicator.label}</Link>
        <span className="mono-label">{systemLabel(indicator.system)}</span>
      </div>

      <div className="cascade-indicator-value">
        {vitals.pending ? (
          <span className="vital-value-pending">Stand ausstehend</span>
        ) : (
          <span className={`cascade-indicator-current${zoneKey ? ` vital-zone-${zoneKey}` : ""}`}>
            <strong>{NUM_FMT.format(vitals.currentValue as number)}</strong>
            {unit ? <span className="vital-unit">{unit}</span> : null}
            {vitals.zone ? <span className="mono-label"> · {vitals.zone.zoneLabel}</span> : null}
          </span>
        )}
        {stand ? <span className="mono-label cascade-indicator-stand">Stand {stand}</span> : null}
      </div>

      {link.relation ? <p className="cascade-indicator-relation">{link.relation}</p> : null}
      {link.lagHint ? <p className="mono-label cascade-indicator-lag">Zeitversatz: {link.lagHint}</p> : null}
    </li>
  );
}

/**
 * Additiver Abschnitt der Kaskaden-Detailseite: zeigt die verknüpften Treiber- und
 * Betroffen-Indikatoren mit Ist-Wert, Zone und Zeitversatz-Hinweis (lag_hint).
 * Ehrlicher Leerzustand bei fehlendem Live-Wert; rendert nichts ohne Links.
 */
export function CascadeIndicatorLinks({ links }: { links: CascadeIndicatorLink[] }) {
  const visible = links.filter((link) => link.indicator != null);
  if (visible.length === 0) return null;

  return (
    <section className="cascade-indicator-band" aria-labelledby="cascade-indicator-heading">
      <div>
        <p className="mono-label">Verknüpfte Indikatoren</p>
        <h2 id="cascade-indicator-heading" className="detail-title-small">Woran sich diese Kette messen lässt</h2>
        <p>
          Treiber-Indikatoren stehen am Anfang der Kette, betroffene Indikatoren weiter hinten.
          Der Zeitversatz beschreibt, wie verzögert eine Bewegung dort ankommen kann — kein
          Automatismus, sondern eine redaktionelle Einordnung.
        </p>
      </div>
      <ul className="cascade-indicator-list">
        {visible.map((link) => (
          <IndicatorLinkRow key={link.id} link={link} />
        ))}
      </ul>
    </section>
  );
}
