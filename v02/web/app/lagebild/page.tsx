import { DbNotice } from "@/components/DbNotice";
import { SectionHeader } from "@/components/SectionHeader";
import { SignalChain } from "@/components/SignalChain";
import { Verdict } from "@/components/Verdict";
import { computeVerdict, personalNote } from "@/lib/personalization";
import { getSignalChains } from "@/lib/public-data";
import { getCurrentUserProfile } from "@/lib/use-user-modus";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

function formatStand(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FMT.format(date);
}

export default async function LagebildPage() {
  const profile = await getCurrentUserProfile();
  const state = await getSignalChains();
  const verdict = computeVerdict(state.rows.map((chain) => chain.signal));

  const latestStand = state.rows
    .map((chain) => chain.signal.publishedAt ?? chain.signal.retrievedAt)
    .filter((value): value is Date => value instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Lagebild" title="Deutschland in zehn Bereichen">
        <p>Jeder Bereich: was sich bewegt, was es für deinen Haushalt bedeutet, was du tun kannst.</p>
      </SectionHeader>

      {!state.connected ? <DbNotice error={state.error} /> : null}

      {state.connected ? <Verdict verdict={verdict} stand={formatStand(latestStand)} /> : null}

      {state.rows.length > 0 ? (
        <section className="signals-grid" aria-label="Lage in den Bereichen">
          {state.rows.map((chain) => (
            <SignalChain
              key={chain.signal.id}
              chain={chain}
              note={personalNote(chain.signal.bereich, profile)}
              stand={formatStand(chain.signal.publishedAt ?? chain.signal.retrievedAt)}
            />
          ))}
        </section>
      ) : state.connected ? (
        <section className="hero-card">
          <p className="lead">Aktuell liegen keine veröffentlichten Lagebild-Signale vor.</p>
        </section>
      ) : null}
    </main>
  );
}
