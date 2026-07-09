import assert from "node:assert/strict";
import {
  isMissingWatchlistTable,
  isValidWatchlistItemId,
  parseWatchlistActionInput,
  WATCHLIST_ITEM_TYPE,
} from "./watchlist-core";

function form(entries: Record<string, string>): Pick<FormData, "get"> {
  return {
    get(name: string) {
      return entries[name] ?? null;
    },
  };
}

assert.equal(isValidWatchlistItemId("lage-energie:2026.07"), true, "gueltige Lage-ID wird akzeptiert");
assert.equal(isValidWatchlistItemId("../secret"), false, "Pfad-artige IDs werden abgewiesen");
assert.equal(isValidWatchlistItemId("x".repeat(161)), false, "zu lange IDs werden abgewiesen");

assert.deepEqual(
  parseWatchlistActionInput(form({ itemType: WATCHLIST_ITEM_TYPE, itemId: "lage-1", intent: "add" })),
  { ok: true, itemId: "lage-1", intent: "add" },
  "Add-Intent wird normalisiert",
);
assert.deepEqual(
  parseWatchlistActionInput(form({ itemType: WATCHLIST_ITEM_TYPE, itemId: "lage-1", intent: "remove" })),
  { ok: true, itemId: "lage-1", intent: "remove" },
  "Remove-Intent wird normalisiert",
);
assert.deepEqual(
  parseWatchlistActionInput(form({ itemType: "kosten", itemId: "lage-1", intent: "add" })),
  { ok: false, reason: "invalid_item_type" },
  "nur Lagekarten sind in Scope",
);
assert.deepEqual(
  parseWatchlistActionInput(form({ itemType: WATCHLIST_ITEM_TYPE, itemId: "lage-1", intent: "delete-all" })),
  { ok: false, reason: "invalid_intent" },
  "unbekannte Intents werden abgewiesen",
);

assert.equal(
  isMissingWatchlistTable(new Error('relation "user_watchlist_items" does not exist')),
  true,
  "Postgres missing-table-Text wird erkannt",
);
assert.equal(isMissingWatchlistTable(new Error("42P01: user_watchlist_items")), true, "Postgres 42P01 wird erkannt");
assert.equal(isMissingWatchlistTable(new Error("duplicate key value violates unique constraint")), false);

console.log("watchlist-core.test.ts: PASS");
