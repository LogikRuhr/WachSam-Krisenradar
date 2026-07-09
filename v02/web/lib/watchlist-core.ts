export const WATCHLIST_ITEM_TYPE = "lagebild" as const;

export type WatchlistIntent = "add" | "remove";
export type WatchlistActionInput =
  | { ok: true; itemId: string; intent: WatchlistIntent }
  | { ok: false; reason: "invalid_item_type" | "invalid_item_id" | "invalid_intent" };

export function isMissingWatchlistTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("user_watchlist_items") && (message.includes("does not exist") || message.includes("42P01"));
}

export function isValidWatchlistItemId(value: string): boolean {
  return /^[a-z0-9._:-]+$/i.test(value) && value.length <= 160;
}

export function parseWatchlistActionInput(formData: Pick<FormData, "get">): WatchlistActionInput {
  const itemType = String(formData.get("itemType") ?? "");
  if (itemType !== WATCHLIST_ITEM_TYPE) return { ok: false, reason: "invalid_item_type" };

  const itemId = String(formData.get("itemId") ?? "");
  if (!isValidWatchlistItemId(itemId)) return { ok: false, reason: "invalid_item_id" };

  const intent = String(formData.get("intent") ?? "");
  if (intent !== "add" && intent !== "remove") return { ok: false, reason: "invalid_intent" };

  return { ok: true, itemId, intent };
}
