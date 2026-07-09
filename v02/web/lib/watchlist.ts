import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { userWatchlistItems } from "@wachsam/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SignalChain } from "@/lib/public-data";
import { isMissingWatchlistTable, parseWatchlistActionInput, WATCHLIST_ITEM_TYPE } from "./watchlist-core";

export { WATCHLIST_ITEM_TYPE } from "./watchlist-core";

export type UserWatchlistState =
  | { available: true; itemIds: string[]; items: SignalChain[]; reason: null }
  | { available: false; itemIds: string[]; items: SignalChain[]; reason: "no_database" | "schema_pending" | "read_error" };

export async function getUserWatchlistState(userId: string, chains: SignalChain[]): Promise<UserWatchlistState> {
  if (!db) return { available: false, itemIds: [], items: [], reason: "no_database" };

  try {
    const rows = await db
      .select()
      .from(userWatchlistItems)
      .where(and(eq(userWatchlistItems.userId, userId), eq(userWatchlistItems.itemType, WATCHLIST_ITEM_TYPE)))
      .orderBy(desc(userWatchlistItems.createdAt));
    const itemIds = rows.map((row) => row.itemId);
    const byId = new Map(chains.map((chain) => [chain.signal.id, chain]));
    const items = itemIds.map((id) => byId.get(id)).filter((item): item is SignalChain => item != null);
    return { available: true, itemIds, items, reason: null };
  } catch (error) {
    if (isMissingWatchlistTable(error)) return { available: false, itemIds: [], items: [], reason: "schema_pending" };
    return { available: false, itemIds: [], items: [], reason: "read_error" };
  }
}

export async function toggleWatchlistItemAction(formData: FormData): Promise<void> {
  "use server";

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !db) return;

  const parsed = parseWatchlistActionInput(formData);
  if (!parsed.ok) return;
  const { itemId, intent } = parsed;

  try {
    if (intent === "remove") {
      await db
        .delete(userWatchlistItems)
        .where(
          and(
            eq(userWatchlistItems.userId, userId),
            eq(userWatchlistItems.itemType, WATCHLIST_ITEM_TYPE),
            eq(userWatchlistItems.itemId, itemId),
          ),
        );
    } else if (intent === "add") {
      await db
        .insert(userWatchlistItems)
        .values({
          id: randomUUID(),
          userId,
          itemType: WATCHLIST_ITEM_TYPE,
          itemId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing({
          target: [userWatchlistItems.userId, userWatchlistItems.itemType, userWatchlistItems.itemId],
        });
    }
  } catch (error) {
    if (!isMissingWatchlistTable(error)) throw error;
  }

  revalidatePath("/profil");
}
