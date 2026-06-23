import Link from "next/link";
import { DbNotice } from "@/components/DbNotice";
import { HouseholdCheck } from "@/components/HouseholdCheck";
import { HomeStorySteps } from "@/components/HomeStorySteps";
import { MethodikHinweis } from "@/components/MethodikHinweis";
import { NutzenBoard } from "@/components/NutzenBoard";
import { PfadHub } from "@/components/PfadHub";
import { SignalChain } from "@/components/SignalChain";
import { Verdict } from "@/components/Verdict";
import { VitalsBoard } from "@/components/VitalsBoard";
import { computeVerdict, personalNote, type Verdict as VerdictData, type VerdictTone } from "@/lib/personalization";
import { getFrontDoorSignals, getHeadlineVitals, getNationalState } from "@/lib/public-data";
import { getCurrentUserProfile } from "@/lib/use-user-modus";
import type { HouseholdCheckChain } from "@/lib/household-check";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

// overall_tone (national_state) ist eine Severity-Stufe; auf denselben Verdict-Ton
// abbilden, den computeVerdict nutzt, damit Gesamtstand und Fallback konsistent sind.
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

export default async function HomePage() {
  const profile = await getCurrentUserProfile();
  const [signals, national, vitals] = await Promise.all([
    getFrontDoorSignals(8),
    getNationalState(),
    getHeadlineVitals(),
  ]);
  const verdict = computeVerdict(signals.rows.map((chain) => chain.signal));
  const chainsWithImpact = signals.rows.filter((chain) => chain.impact).slice(0, 3);

  // Gesamtstand-Block: publizierter national_state bevorzugt, sonst der aus den
  // Signalen abgeleitete Verdict (kein eigenständiges Gesamturteil erfunden).
  const overallVerdict: VerdictData = national.data
    ? { tone: TONE_BY_SEVERITY[national.data.overallTone] ?? "beobachten", text: national.data.executiveSummary }
    : verdict;
  const overallStand = national.data ? formatStand(national.data.standDate) : null;
  const hasVitals = vitals.connected && vitals.rows.length > 0;
  const showOverall = signals.connected && (national.data != null || hasVitals);

  const latestStand = signals.rows
    .map((chain) => chain.signal.publishedAt ?? chain.signal.retrievedAt)
    .filter((value): value is Date => value instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const sourceCount = new Set(
    signals.rows.flatMap((chain) =>
      chain.signal.sources.map((source) => `${source.sourceName}-${source.sourceUrl}`),
    ),
  ).size;
  const checkChains: HouseholdCheckChain[] = signals.rows.map((chain) => ({
    signal: {
      id: chain.signal.id,
      bereich: chain.signal.bereich,
      severity: chain.signal.severity,
      trend: chain.signal.trend,
      titel: chain.signal.titel,
      beschreibung: chain.signal.beschreibung,
    },
    impact: chain.impact
      ? {
          kind: chain.impact.kind,
          bereich: chain.impact.bereich,
          titel: chain.impact.titel,
          beschreibung: chain.impact.beschreibung,
          confidence: chain.impact.confidence,
          zeithorizont: chain.impact.zeithorizont,
        }
      : null,
    action: chain.action
      ? {
          titel: chain.action.titel,
          beschreibung: chain.action.beschreibung,
          aufwand: chain.action.aufwand,
        }
      : null,
  }));

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <section className="home-hero" aria-labelledby="page-title">
        <div className="strich" aria-hidden="true" />
        <p className="mono-label">WachSam · Lage- und Auswirkungenradar</p>
        <h1 id="page-title" className="bebas-title">Was globale Entwicklungen für deinen Alltag in Deutschland bedeuten.</h1>
        <p className="lead">
          Energie, Preise, Lieferketten, Infrastruktur und Arbeitsmarkt wirken oft zusammen. WachSam ordnet Entwicklungen nach Deutschland-Relevanz, Haushaltsauswirkung, Quellenlage und realistischen Maßnahmen ein.
        </p>
        <p className="home-trustline">Keine Panik. Kein Newsfeed. Eine ruhige Lageeinordnung mit Quellenstand.</p>
        <div className="home-actions">
          <Link className="btn-rost" href="#aktuelle-lage">Aktuelle Lage ansehen</Link>
          <Link className="text-link" href="/massnahmen">Maßnahmen prüfen</Link>
        </div>
      </section>

      <HouseholdCheck chains={checkChains} connected={signals.connected} />

      <HomeStorySteps />

      <NutzenBoard activeModus={profile.modus} />

      {!signals.connected ? <DbNotice error={signals.error} /> : null}

      {signals.connected ? <Verdict verdict={verdict} stand={formatStand(latestStand)} /> : null}

      {signals.connected ? (
        <section className="app-state-band" aria-label="Quellen, Datenstand und Qualität dieser Lageeinordnung">
          <div className="app-state-item">
            <span className="mono-label">Quellenbasis</span>
            <strong>{sourceCount > 0 ? `${sourceCount} verbundene Quellen` : "Quellen in Prüfung"}</strong>
            <p>Jede öffentliche Lagekarte zeigt benannte Quellen mit Stand-Datum statt anonymer Rohmeldungen.</p>
          </div>
          <div className="app-state-item">
            <span className="mono-label">Datenstand</span>
            <strong>{formatStand(latestStand) ?? "noch kein Stand"}</strong>
            <p>WachSam markiert Aktualität sichtbar und vermeidet Fake-Live-Optik.</p>
          </div>
          <div className="app-state-item">
            <span className="mono-label">Qualität</span>
            <strong>Einordnung mit Unsicherheit</strong>
            <p>Confidence, Quellenlage und Haushaltsauswirkung werden getrennt angezeigt.</p>
          </div>
        </section>
      ) : null}

      {showOverall ? (
        <section className="home-overall" aria-labelledby="home-overall-title">
          <div className="home-section-head">
            <p className="mono-label">Gesamtstand Deutschland</p>
            <h2 id="home-overall-title" className="focus-title">Wie ist die Lage insgesamt?</h2>
            <p>
              {national.data
                ? "Redaktionelle Gesamteinordnung mit den wichtigsten Vitalwerten."
                : "Vorläufige Einordnung aus den veröffentlichten Signalen — die redaktionelle Gesamteinschätzung folgt."}
            </p>
          </div>
          <Verdict verdict={overallVerdict} stand={overallStand} />
          {hasVitals ? <VitalsBoard indicators={vitals.rows} limit={4} heading="Wichtigste Vitalwerte" /> : null}
          <div className="home-actions">
            <Link className="btn-rost" href="/lage">Zum vollständigen Lagebild</Link>
          </div>
        </section>
      ) : null}

      {chainsWithImpact.length > 0 ? (
        <section className="home-section" id="aktuelle-lage" aria-labelledby="aktuelle-lage-title">
          <div className="home-section-head">
            <p className="mono-label">Aktuelle Lagekarten</p>
            <h2 id="aktuelle-lage-title" className="focus-title">Entwicklungen mit Haushaltsauswirkung</h2>
            <p>Prominent erscheinen nur Einordnungen, bei denen eine konkrete Haushaltsauswirkung hinterlegt ist.</p>
          </div>
          <div className="signals-grid">
          {chainsWithImpact.map((chain) => (
            <SignalChain
              key={chain.signal.id}
              chain={chain}
              note={personalNote(chain.signal.bereich, profile)}
              stand={formatStand(chain.signal.publishedAt ?? chain.signal.retrievedAt)}
            />
          ))}
          </div>
        </section>
      ) : signals.connected ? (
        <section className="hero-card">
          <p className="lead">Aktuell liegen keine veröffentlichten Lagekarten mit konkreter Haushaltsauswirkung vor. Die übrigen Hinweise bleiben in redaktioneller Prüfung.</p>
          <Link className="text-link" href="/lagebild">Zum Lagebild</Link>
        </section>
      ) : null}

      <section className="home-impact-band" aria-labelledby="haushalt-title">
        <div>
          <p className="mono-label">Haushaltsauswirkungen</p>
          <h2 id="haushalt-title" className="detail-title-small">Was davon im Alltag ankommen kann</h2>
          <p>Kosten, Versorgung, Mobilität, Gesundheit, Arbeit und Planung werden nicht isoliert betrachtet, sondern als mögliche Folgen einer Entwicklung eingeordnet.</p>
        </div>
        <div>
          <p className="mono-label">Nächster Schritt</p>
          <p>Prüfe zuerst einfache und realistische Maßnahmen. WachSam zeigt mögliche Auswirkungen, keine sicheren Vorhersagen.</p>
          <Link className="text-link" href="/massnahmen">Maßnahmen prüfen</Link>
        </div>
      </section>

      <section className="home-transparency" aria-labelledby="transparenz-title">
        <p className="mono-label">Quellen und Transparenz</p>
        <h2 id="transparenz-title" className="detail-title-small">Einordnung mit Unsicherheit</h2>
        <p>Jede Einschätzung bleibt abhängig von Quellenlage, Datenqualität, Zeitfenster und redaktioneller Prüfung. WachSam ersetzt keine Behördeninformationen und keine rechtliche, medizinische oder finanzielle Beratung.</p>
        {formatStand(latestStand) ? <p className="mono-label">Datenstand: {formatStand(latestStand)}</p> : null}
        <Link className="text-link" href="/quellen">Quellen ansehen</Link>
      </section>

      <MethodikHinweis variant="lage" />

      <PfadHub />
    </main>
  );
}
