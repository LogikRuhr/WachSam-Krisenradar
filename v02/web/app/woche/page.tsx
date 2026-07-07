import type { Metadata } from "next";
import { DbNotice } from "@/components/DbNotice";
import { LageViewsNav } from "@/components/LageViewsNav";
import { SectionHeader } from "@/components/SectionHeader";
import { ThemeStateBadge } from "@/components/ThemeStateBadge";
import { type ThemeState } from "@/lib/themes";
import { getWeeklyOverview, type WeeklyChannel } from "@/lib/weekly";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Was sich diese Woche verändert hat · WachSam",
  description: "Änderungsansicht der Themenkanäle: Stufe heute im Vergleich zu vor 7 Tagen.",
};

const STATE_RANK: Record<ThemeState, number> = { normal: 0, beobachten: 1, erhoeht: 2, hoch: 3 };

/** Hochstufung: Stufe ist gestiegen UND eine Vorwoche-Stufe war überhaupt bekannt. */
function isUpgrade(channel: WeeklyChannel): boolean {
  return channel.changed && channel.stateWeekAgo != null && STATE_RANK[channel.stateNow] > STATE_RANK[channel.stateWeekAgo];
}

/** "+3,2 %" bzw. "−1,5 %" — Minuszeichen (U+2212) statt Bindestrich, Komma statt Punkt. */
function formatDeltaPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(1).replace(".", ",")} %`;
}

type MoverChannel = WeeklyChannel & { topMover: NonNullable<WeeklyChannel["topMover"]> };

export default async function WochePage() {
  const { channels, connected } = await getWeeklyOverview();
  const upgrades = channels.filter(isUpgrade).length;
  const movers: MoverChannel[] = channels
    .filter((channel): channel is MoverChannel => channel.topMover != null)
    .sort((a, b) => Math.abs(b.topMover.deltaPercent) - Math.abs(a.topMover.deltaPercent));

  return (
    <main className="page-shell" aria-labelledby="page-title">
      <SectionHeader label="Änderungen" title="Was sich diese Woche verändert hat">
        <p>
          Änderungsansicht der Lage: Stufe der Themenkanäle heute im Vergleich zu vor 7 Tagen —
          deterministisch aus den zuletzt veröffentlichten Indikatorwerten abgeleitet.
        </p>
      </SectionHeader>

      <LageViewsNav current="woche" />

      {!connected ? <DbNotice /> : null}

      {connected ? (
        <>
          <section className="weekly-channels" aria-label="Themenkanäle im Wochenvergleich">
            <ul className="weekly-channel-list">
              {channels.map((channel) => (
                <li key={channel.key} className="weekly-channel-row">
                  <span className="weekly-channel-title">{channel.title}</span>
                  <div className="weekly-state-transition">
                    {channel.stateWeekAgo == null ? (
                      <span className="mono-label weekly-no-history">Keine ausreichende Historie</span>
                    ) : channel.changed ? (
                      <>
                        <ThemeStateBadge state={channel.stateWeekAgo} />
                        <span className="weekly-arrow" aria-hidden="true">
                          →
                        </span>
                      </>
                    ) : null}
                    <ThemeStateBadge state={channel.stateNow} />
                    {channel.stateWeekAgo != null && !channel.changed ? (
                      <span className="mono-label weekly-unchanged">Unverändert seit letzter Woche</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="weekly-movers" aria-label="Größte Bewegungen der Woche">
            <p className="mono-label">Größte Bewegungen</p>
            {movers.length === 0 ? (
              <p>Keine ausreichenden Datenpunkte für Bewegungen in dieser Woche.</p>
            ) : (
              <ul className="weekly-mover-list">
                {movers.map((channel) => (
                  <li key={channel.key} className="weekly-mover">
                    <span className="weekly-mover-label">{channel.topMover.label}</span>
                    <span className="weekly-mover-delta">{formatDeltaPercent(channel.topMover.deltaPercent)}</span>
                    <span className="mono-label weekly-mover-channel">{channel.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="weekly-honesty" aria-label="Ehrlichkeit">
            <p className="mono-label">Ehrlichkeit</p>
            <p>
              {upgrades === 0
                ? "Keine Hochstufungen in dieser Woche."
                : `${upgrades} von ${channels.length} Themenkanälen wurden diese Woche hochgestuft.`}
            </p>
            <p className="weekly-methodology">
              Methodik: Die Stufe „vor 7 Tagen“ wird aus dem jüngsten Beobachtungswert vor dem Stichtag
              berechnet, aber mit den heute gültigen Schwellenwerten bewertet — Schwellen selbst haben
              keine eigene Historie. Ein Kanal ohne historische Datenpunkte zeigt „Keine ausreichende
              Historie“ statt einer erfundenen Stufe.
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}
