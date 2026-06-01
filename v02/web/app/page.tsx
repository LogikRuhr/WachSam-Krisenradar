import { DbNotice } from "@/components/DbNotice";
import { PfadHub } from "@/components/PfadHub";
import { SectionHeader } from "@/components/SectionHeader";
import { SignalChain } from "@/components/SignalChain";
import { Verdict } from "@/components/Verdict";
import { computeVerdict, personalNote } from "@/lib/personalization";
import { getFrontDoorSignals } from "@/lib/public-data";
import { getCurrentUserProfile } from "@/lib/use-user-modus";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

function formatStand(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date);
}

export default async function HomePage() {
  const profile = await getCurrentUserProfile();
  const signals = await getFrontDoorSignals();
  const verdict = computeVerdict(signals.rows.map((chain) => chain.signal));

  const latestStand = signals.rows
    .map((chain) => chain.signal.publishedAt ?? chain.signal.retrievedAt)
    .filter((value): value is Date => value instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Heute im Fokus" title="Die Lage für deinen Haushalt">
        <p>Was sich bewegt, was es für dich bedeutet, was du tun kannst — ruhig eingeordnet.</p>
      </SectionHeader>

      {!signals.connected ? <DbNotice error={signals.error} /> : null}

      {signals.connected ? <Verdict verdict={verdict} stand={formatStand(latestStand)} /> : null}

      {signals.rows.length > 0 ? (
        <section className="signals-grid" aria-label="Aktuelle Signale">
          {signals.rows.map((chain) => (
            <SignalChain
              key={chain.signal.id}
              chain={chain}
              note={personalNote(chain.signal.bereich, profile)}
              stand={formatStand(chain.signal.publishedAt ?? chain.signal.retrievedAt)}
            />
          ))}
        </section>
      ) : signals.connected ? (
        <section className="hero-card">
          <p className="lead">Aktuell liegen keine veröffentlichten Signale vor. Die Lage wirkt ruhig.</p>
        </section>
      ) : null}

      {!profile.modus ? (
        <p className="mono-label" style={{ marginTop: "8px" }}>
          Tipp: Mit einem Haushaltsprofil (Modus + Heizart) ordnet WachSam die Signale auf deinen Alltag zu.
        </p>
      ) : null}

      <PfadHub />
    </main>
  );
}
