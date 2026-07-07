import { DbNotice } from "@/components/DbNotice";
import { PainCard } from "@/components/PainCard";
import { toggleWatchlistItemAction, WATCHLIST_ITEM_TYPE, type UserWatchlistState } from "@/lib/watchlist";
import type { WatchlistDigestPreview } from "@/lib/watchlist-digest";
import type { SignalChain } from "@/lib/public-data";

type WatchlistPanelProps = {
  signalsConnected: boolean;
  signalsError?: string;
  state: UserWatchlistState;
  suggestions: SignalChain[];
  digest: WatchlistDigestPreview;
};

function WatchlistButton({ itemId, intent }: { itemId: string; intent: "add" | "remove" }) {
  return (
    <form action={toggleWatchlistItemAction}>
      <input type="hidden" name="itemType" value={WATCHLIST_ITEM_TYPE} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="intent" value={intent} />
      <button className={intent === "add" ? "btn-rost" : "text-link"} type="submit">
        {intent === "add" ? "Beobachten" : "Entfernen"}
      </button>
    </form>
  );
}

function WatchlistSetupNotice({ reason }: { reason: UserWatchlistState["reason"] }) {
  const text =
    reason === "schema_pending"
      ? "Der Watchlist-Speicher ist vorbereitet und wird nach der Datenbank-Migration aktiviert."
      : "Die Watchlist ist aktuell nicht verfügbar. Die öffentlichen Lagekarten bleiben nutzbar.";
  return (
    <div className="detail-aside-box">
      <p>{text}</p>
    </div>
  );
}

export function WatchlistPanel({ signalsConnected, signalsError, state, suggestions, digest }: WatchlistPanelProps) {
  return (
    <section className="home-section" aria-labelledby="watchlist-title">
      <div className="home-section-head">
        <p className="mono-label">Watchlist</p>
        <h2 id="watchlist-title" className="focus-title">Beobachten statt suchen</h2>
        <p>Speichere öffentliche Lagekarten in deinem Konto und lies daraus eine ruhige Wochenvorschau.</p>
      </div>

      {!signalsConnected ? <DbNotice error={signalsError} /> : null}
      {!state.available ? <WatchlistSetupNotice reason={state.reason} /> : null}

      {state.available ? (
        <div className="watchlist-layout">
          <div className="watchlist-column">
            <p className="mono-label">Beobachtet</p>
            {state.items.length > 0 ? (
              <div className="watchlist-card-list">
                {state.items.map((chain) => (
                  <PainCard
                    key={chain.signal.id}
                    number="★"
                    title={chain.signal.titel}
                    meta={<span className="mono-label">{chain.signal.bereich} · {chain.signal.severity}</span>}
                  >
                    <p>{chain.impact?.titel ?? chain.signal.beschreibung}</p>
                    <WatchlistButton itemId={chain.signal.id} intent="remove" />
                  </PainCard>
                ))}
              </div>
            ) : (
              <p className="lead">Noch keine Lagekarte beobachtet.</p>
            )}
          </div>

          <div className="watchlist-column">
            <p className="mono-label">Vorschläge</p>
            {suggestions.length > 0 ? (
              <div className="watchlist-suggestion-list">
                {suggestions.map((chain) => (
                  <div key={chain.signal.id} className="watchlist-suggestion">
                    <div>
                      <strong>{chain.signal.titel}</strong>
                      <p>{chain.impact?.titel ?? chain.signal.beschreibung}</p>
                    </div>
                    <WatchlistButton itemId={chain.signal.id} intent="add" />
                  </div>
                ))}
              </div>
            ) : (
              <p>Keine weiteren veröffentlichten Vorschläge verfügbar.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="digest-preview" aria-label="Digest-Vorschau">
        <p className="mono-label">Wochen-Digest</p>
        <h3 className="detail-title-small">{digest.title}</h3>
        <p>{digest.intro}</p>
        {digest.watchItems.length > 0 ? (
          <ul className="detail-list">
            {digest.watchItems.map((item) => (
              <li key={item.id}>
                {item.title}: {item.impactTitle ?? `${item.severity}, ${item.trend}`}
              </li>
            ))}
          </ul>
        ) : null}
        {digest.weeklyItems.length > 0 ? (
          <p className="weekly-methodology">
            Wochenbewegungen: {digest.weeklyItems.map((item) => item.title).join(", ")}.
          </p>
        ) : (
          <p className="weekly-methodology">Noch keine ausreichenden Wochenbewegungen für eine Vorschau.</p>
        )}
      </div>
    </section>
  );
}
