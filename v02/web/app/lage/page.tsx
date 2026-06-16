import type { Metadata } from "next";
import Link from "next/link";
import { DbNotice } from "@/components/DbNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { Verdict } from "@/components/Verdict";
import { VitalsBoard } from "@/components/VitalsBoard";
import { computeVerdict, type Verdict as VerdictData, type VerdictTone } from "@/lib/personalization";
import { getHeadlineVitals, getNationalState, getSignalChains } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gesamtstand Deutschland · WachSam",
  description:
    "Nationale Gesamteinordnung und Vitalwerte für Deutschland — mit Quellenstand, Zonen und ehrlichen Leerzuständen.",
};

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

// overall_tone ist eine Severity-Stufe (national_state). Für die ruhige
// Gesamteinordnung mappen wir sie auf denselben Verdict-Ton wie computeVerdict,
// damit publizierter Gesamtstand und Fallback optisch konsistent bleiben.
const TONE_BY_SEVERITY: Record<string, VerdictTone> = {
  stabil: "ruhig",
  beobachten: "beobachten",
  erhoeht: "beobachten",
  kritisch: "angespannt",
  eskalierend: "ernst",
};

function formatStand(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date);
}

const OPERATOR_LABEL: Record<string, string> = {
  ">": "über",
  ">=": "ab",
  "<": "unter",
  "<=": "bis",
};

export default async function LagePage() {
  const [national, vitals, chains] = await Promise.all([
    getNationalState(),
    getHeadlineVitals(),
    getSignalChains(),
  ]);

  const connected = national.connected && vitals.connected && chains.connected;
  if (!connected) {
    const error = national.error ?? vitals.error ?? chains.error;
    return (
      <main className="page-shell" aria-labelledby="page-title">
        <SectionHeader label="Gesamtstand" title="Deutschland im Überblick" />
        <DbNotice error={error} />
      </main>
    );
  }

  const state = national.data;
  const hasState = state != null;

  const verdict: VerdictData = hasState
    ? { tone: TONE_BY_SEVERITY[state.overallTone] ?? "beobachten", text: state.executiveSummary }
    : computeVerdict(chains.rows.map((chain) => chain.signal));

  const stateStand = hasState ? formatStand(state.standDate) : null;
  const latestVitalStand = vitals.rows
    .map((indicator) => indicator.currentValueDate)
    .filter((value): value is Date => value instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const verdictStand = stateStand ?? formatStand(latestVitalStand);

  const revisionCriteria = hasState ? state.revisionCriteria : [];
  const gegentrends = hasState ? (state.gegentrends ?? []) : [];

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Gesamtstand" title="Deutschland im Überblick">
        <p>
          Eine ruhige Gesamteinordnung der Lage in Deutschland: Wie ist der Stand, woran
          würde sich die Einschätzung ändern — und welche Vitalwerte tragen das Bild?
        </p>
      </SectionHeader>

      <Verdict verdict={verdict} stand={verdictStand} />

      {!hasState ? (
        <section className="hero-card" aria-label="Hinweis zur Gesamteinschätzung">
          <p className="mono-label">Redaktionelle Gesamteinschätzung</p>
          <p className="lead">
            Eine eigenständige redaktionelle Gesamteinschätzung steht noch aus. Bis dahin
            zeigt WachSam oben eine vorläufige Einordnung, die aus den veröffentlichten
            Lagebild-Signalen abgeleitet ist — keine eigenständige Gesamtbewertung.
          </p>
          <Link className="text-link" href="/lagebild">Zum vollständigen Lagebild</Link>
        </section>
      ) : null}

      <VitalsBoard
        indicators={vitals.rows}
        heading="Vitalwerte Deutschland"
        intro="Headline-Indikatoren mit aktuellem Stand, Zone und Trend. Jede Kachel zeigt ihr eigenes Stand-Datum — die Kadenz unterscheidet sich je Wert."
      />

      {hasState && (revisionCriteria.length > 0 || gegentrends.length > 0) ? (
        <section className="lage-revision" aria-labelledby="lage-revision-heading">
          <div className="home-section-head">
            <p id="lage-revision-heading" className="mono-label">Was die Einschätzung ändern würde</p>
            <p>
              Diese Einordnung ist nicht endgültig. Sie wird überprüft, sobald die folgenden
              Marken erreicht werden oder sich gegenläufige Entwicklungen verfestigen.
            </p>
          </div>

          {revisionCriteria.length > 0 ? (
            <div className="detail-panel">
              <h2 className="detail-title-small">Revisionskriterien</h2>
              <ul className="detail-list">
                {revisionCriteria.map((criterion, index) => (
                  <li key={`${criterion.label}-${index}`}>
                    {criterion.label}: {OPERATOR_LABEL[criterion.operator] ?? criterion.operator}{" "}
                    {criterion.threshold}
                    {criterion.unit ? ` ${criterion.unit}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {gegentrends.length > 0 ? (
            <div className="detail-panel">
              <h2 className="detail-title-small">Gegentrends</h2>
              <ul className="detail-list">
                {gegentrends.map((trend, index) => (
                  <li key={`gegentrend-${index}`}>{trend}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="home-impact-band" aria-labelledby="lage-next-heading">
        <div>
          <p className="mono-label">Wirkungsketten</p>
          <h2 id="lage-next-heading" className="detail-title-small">Wie Entwicklungen zusammenhängen</h2>
          <p>
            Der Gesamtstand entsteht aus vielen Wirkungspfaden. Die Kaskaden zeigen, wie eine
            globale Entwicklung über betroffene Systeme bis in den Haushalt wirken kann.
          </p>
          <Link className="text-link" href="/kaskaden">Zu den Wirkungsketten</Link>
        </div>
        <div>
          <p className="mono-label">Datenstand</p>
          <p>{verdictStand ? `Letzter Stand dieser Einordnung: ${verdictStand}.` : "Noch kein gemeinsamer Stand verfügbar."}</p>
          <p>WachSam markiert Aktualität sichtbar und vermeidet Fake-Live-Optik.</p>
        </div>
      </section>
    </main>
  );
}
