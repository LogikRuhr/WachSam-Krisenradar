import Link from "next/link";
import { redirect } from "next/navigation";
import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { ProfileStatus } from "@/components/ProfileStatus";
import { SectionHeader } from "@/components/SectionHeader";
import { SignalChain } from "@/components/SignalChain";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { auth, isAuthRuntimeConfigured } from "@/lib/auth";
import {
  aufwandLabel,
  bereichLabel,
  householdCheckSteps,
  modusLead,
  personalNote,
  prioritizeActionsForProfile,
  prioritizeSignalsForProfile,
  profileCompleteness,
} from "@/lib/personalization";
import { buildProfileOnboardingSteps } from "@/lib/onboarding";
import { getHouseholdByUserId, upsertHouseholdAction } from "@/lib/profile";
import { getCitizenActions, getSignalChains } from "@/lib/public-data";
import { getCurrentUserProfile } from "@/lib/use-user-modus";
import { getUserWatchlistState } from "@/lib/watchlist";
import { buildWatchlistDigestPreview } from "@/lib/watchlist-digest";
import { getWeeklyOverview } from "@/lib/weekly";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

function formatStand(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date);
}

export default async function ProfilPage() {
  if (!isAuthRuntimeConfigured()) {
    redirect("/login");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const [household, profile, signalsState, actionsState, weeklyState] = await Promise.all([
    getHouseholdByUserId(userId),
    getCurrentUserProfile(),
    getSignalChains(8),
    getCitizenActions(),
    getWeeklyOverview(),
  ]);

  const completeness = profileCompleteness(profile);
  const topChains = prioritizeSignalsForProfile(signalsState.rows, profile, 3);
  const watchlist = await getUserWatchlistState(userId, signalsState.rows);
  const watchlistIds = new Set(watchlist.itemIds);
  const watchlistSuggestions = prioritizeSignalsForProfile(signalsState.rows, profile, 6)
    .filter((chain) => !watchlistIds.has(chain.signal.id))
    .slice(0, 4);
  const digestPreview = buildWatchlistDigestPreview({
    watchItems: watchlist.items.map((chain) => ({
      id: chain.signal.id,
      title: chain.signal.titel,
      bereich: chain.signal.bereich,
      severity: chain.signal.severity,
      trend: chain.signal.trend,
      impactTitle: chain.impact?.titel ?? null,
    })),
    weeklyItems: weeklyState.channels.map((channel) => ({
      title: channel.title,
      stateNow: channel.stateNow,
      stateWeekAgo: channel.stateWeekAgo,
      changed: channel.changed,
      topMover: channel.topMover,
    })),
  });
  const energieNote = profile.heizart && profile.heizart !== "unbekannt" ? personalNote("energie", profile) : null;
  const actions = prioritizeActionsForProfile(actionsState.rows, profile, 4);
  const checkSteps = householdCheckSteps(profile);
  const modusIntro = modusLead(profile.modus);
  const onboardingSteps = buildProfileOnboardingSteps({
    profileFieldsFilled: completeness.filled,
    profileFieldsTotal: completeness.total,
    hasRelevantSignals: topChains.length > 0,
    hasActions: actions.length > 0,
    hasCheckSteps: checkSteps.length > 0,
  });

  return (
    <main className="page-shell">
      <SectionHeader label="Mein Bereich" title="Dein persönlicher WachSam-Bereich">
        <p>
          Hier sortiert WachSam Lage, Auswirkungen und Maßnahmen ruhig nach deinem Haushalt.{" "}
          {modusIntro ?? "Lege unten dein Profil an, damit die Hinweise zu dir passen."}
        </p>
      </SectionHeader>

      <ProfileStatus completeness={completeness} />

      <OnboardingChecklist
        title="Deine ersten WachSam-Schritte"
        label="Onboarding"
        description="WachSam wird nützlicher, sobald Profil, Lage, Maßnahmen und Prüfliste zusammen gelesen werden."
        steps={onboardingSteps}
      />

      <WatchlistPanel
        signalsConnected={signalsState.connected}
        signalsError={signalsState.error}
        state={watchlist}
        suggestions={watchlistSuggestions}
        digest={digestPreview}
      />

      <section className="home-section" aria-labelledby="relevanz-title">
        <div className="home-section-head">
          <p className="mono-label">Was betrifft mich wirklich?</p>
          <h2 id="relevanz-title" className="focus-title">Aktuelle Lage für deinen Haushalt</h2>
          <p>Nach deinem Haushalt sortiert: die Bereiche, die dich direkt treffen, zuerst — mit einem Hinweis, was sie konkret für dich bedeuten können.</p>
        </div>
        {!signalsState.connected ? (
          <DbNotice error={signalsState.error} />
        ) : topChains.length ? (
          <div className="signals-grid">
            {topChains.map((chain) => (
              <SignalChain
                key={chain.signal.id}
                chain={chain}
                note={personalNote(chain.signal.bereich, profile)}
                stand={formatStand(chain.signal.publishedAt ?? chain.signal.retrievedAt)}
              />
            ))}
          </div>
        ) : (
          <p className="lead">Aktuell liegen keine veröffentlichten Lagekarten vor.</p>
        )}
      </section>

      {energieNote ? (
        <section className="home-impact-band" aria-labelledby="energie-title">
          <div>
            <p className="mono-label">Dein Energie-Hinweis</p>
            <h2 id="energie-title" className="detail-title-small">Was deine Heizart betrifft</h2>
            <p>{energieNote}</p>
          </div>
          <div>
            <p className="mono-label">Tiefer einordnen</p>
            <p><Link className="text-link" href="/kosten">Kostenradar ansehen</Link></p>
            <p><Link className="text-link" href="/versorgung">Versorgung prüfen</Link></p>
          </div>
        </section>
      ) : null}

      <section className="home-section" aria-labelledby="schritte-title">
        <div className="home-section-head">
          <p className="mono-label">Nächste sinnvolle Prüfschritte</p>
          <h2 id="schritte-title" className="focus-title">Passende Maßnahmen für dich</h2>
          <p>Ruhige, praktische Schritte — nach deinem Profil sortiert, einfache zuerst.</p>
        </div>
        {!actionsState.connected ? (
          <DbNotice error={actionsState.error} />
        ) : actions.length ? (
          <div className="single-list">
            {actions.map((action, index) => (
              <PainCard
                key={action.id}
                number={String(index + 1).padStart(2, "0")}
                title={action.titel}
                meta={<span className="mono-label">Aufwand: {aufwandLabel(action.aufwand)}</span>}
              >
                <p>{action.beschreibung}</p>
                <p><strong>Bezug:</strong> {action.bezugZuBereich.map(bereichLabel).join(", ")}</p>
              </PainCard>
            ))}
            <Link className="text-link" href="/massnahmen">Alle Maßnahmen ansehen</Link>
          </div>
        ) : (
          <p className="lead">Aktuell sind keine Maßnahmen hinterlegt.</p>
        )}
      </section>

      <section className="home-section" aria-labelledby="checkliste-title">
        <div className="home-section-head">
          <p className="mono-label">Deine Prüf-Checkliste</p>
          <h2 id="checkliste-title" className="focus-title">Ruhige Schritte für deinen Haushalt</h2>
          <p>Aus deinem Profil abgeleitete Prüfschritte — Orientierung zum Selbermachen. Nichts davon wird gespeichert.</p>
        </div>
        <div className="detail-aside-box">
          <ul className="check-steps">
            {checkSteps.map((step) => (
              <li key={step.key}>{step.text}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="profil-bearbeiten" className="home-section" aria-labelledby="profil-edit-title">
        <div className="home-section-head">
          <p className="mono-label">Profil bearbeiten</p>
          <h2 id="profil-edit-title" className="focus-title">Haushaltsperspektive festlegen</h2>
        </div>
        <div className="profile-scope-note">
          <p>
            Diese Angaben bleiben aus der öffentlichen Navigation heraus. Sie steuern nur, wie Lage, Kosten, Versorgung und
            Maßnahmen für deinen Alltag sortiert werden.
          </p>
        </div>
        <ProfileForm
          action={upsertHouseholdAction}
          defaultModus={household?.modus ?? "familie"}
          defaultHeizart={household?.heizart ?? "unbekannt"}
        />
      </section>

      <section className="home-transparency" aria-labelledby="member-grenze-title">
        <p className="mono-label">Was WachSam hier leistet — und was nicht</p>
        <h2 id="member-grenze-title" className="detail-title-small">Orientierung, keine Beratung</h2>
        <p>
          WachSam sortiert öffentlich einsehbare Lage-Einordnungen nach deinem Haushalt. Die Hinweise sind eine ruhige
          Orientierung — keine Finanz-, Rechts- oder medizinische Beratung und keine sichere Vorhersage. Gespeichert sind
          Modus, Heizart und bei Nutzung der Watchlist die IDs beobachteter öffentlicher Lagekarten; keine Verknüpfung
          mit Tracking oder Werbung.
        </p>
      </section>
    </main>
  );
}
