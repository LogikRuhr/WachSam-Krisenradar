import type { SignalChain } from "./public-data";

export const WATCHLIST_ITEM_TYPE = "lagebild" as const;

export type WatchlistUnavailableReason = "no_database" | "schema_pending" | "read_error";

export function validWatchlistItemId(value: string): boolean {
  return /^[a-z0-9._:-]+$/i.test(value) && value.length <= 160;
}

export function isMissingWatchlistTable(error: unknown): boolean {
  const code = typeof error === "object" && error != null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "42P01" ||
    (message.includes("user_watchlist_items") && (message.includes("does not exist") || message.includes("42P01")))
  );
}

export function isDuplicateWatchlistItemError(error: unknown): boolean {
  const record = typeof error === "object" && error != null ? (error as Record<string, unknown>) : {};
  const code = typeof record.code === "string" ? record.code : "";
  const constraint = typeof record.constraint === "string" ? record.constraint : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "23505" &&
    (constraint === "user_watchlist_items_user_item_unique" || message.includes("user_watchlist_items_user_item_unique"))
  );
}

export function mapWatchlistIdsToChains(itemIds: string[], chains: SignalChain[]): SignalChain[] {
  const byId = new Map(chains.map((chain) => [chain.signal.id, chain]));
  return itemIds.map((id) => byId.get(id)).filter((item): item is SignalChain => item != null);
}

export function hasKnownWatchlistItem(itemId: string, chains: SignalChain[]): boolean {
  return chains.some((chain) => chain.signal.id === itemId);
}
