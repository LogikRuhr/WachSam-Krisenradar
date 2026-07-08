import assert from "node:assert/strict";
import {
  hasKnownWatchlistItem,
  isDuplicateWatchlistItemError,
  isMissingWatchlistTable,
  mapWatchlistIdsToChains,
  validWatchlistItemId,
} from "./watchlist-core";
import type { SignalChain } from "./public-data";

const chain = (id: string, title = id): SignalChain =>
  ({
    signal: { id, titel: title },
    impact: null,
    action: null,
  }) as SignalChain;

{
  assert.equal(validWatchlistItemId("energie-oel-hormus"), true, "seed-style ids are valid");
  assert.equal(validWatchlistItemId("wi.pegelonline:kaub_1"), true, "known safe separators are valid");
  assert.equal(validWatchlistItemId(""), false, "blank ids are invalid");
  assert.equal(validWatchlistItemId("../secret"), false, "path-like ids are invalid");
  assert.equal(validWatchlistItemId("x".repeat(161)), false, "overlong ids are invalid");
}

{
  assert.equal(
    isMissingWatchlistTable({ code: "42P01", message: 'relation "user_watchlist_items" does not exist' }),
    true,
    "Postgres missing-table code is recognized",
  );
  assert.equal(
    isMissingWatchlistTable(new Error('relation "user_watchlist_items" does not exist')),
    true,
    "missing-table message is recognized",
  );
  assert.equal(isMissingWatchlistTable(new Error("connection refused")), false, "other errors are not hidden");
}

{
  assert.equal(
    isDuplicateWatchlistItemError({
      code: "23505",
      constraint: "user_watchlist_items_user_item_unique",
      message: "duplicate key value violates unique constraint",
    }),
    true,
    "watchlist unique conflicts are idempotent",
  );
  assert.equal(
    isDuplicateWatchlistItemError({ code: "23505", constraint: "users_email_unique" }),
    false,
    "unrelated unique conflicts are not hidden",
  );
}

{
  const chains = [chain("energie"), chain("lebensmittel"), chain("mobilitaet")];
  const mapped = mapWatchlistIdsToChains(["mobilitaet", "missing", "energie"], chains);
  assert.deepEqual(
    mapped.map((item) => item.signal.id),
    ["mobilitaet", "energie"],
    "watchlist mapping preserves DB order and drops stale ids",
  );
  assert.equal(hasKnownWatchlistItem("lebensmittel", chains), true, "known signal ids are accepted");
  assert.equal(hasKnownWatchlistItem("unknown", chains), false, "unknown signal ids are rejected for add");
}

console.log("watchlist-core.test.ts: PASS");
