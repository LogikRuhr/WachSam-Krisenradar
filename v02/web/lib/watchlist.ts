import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { userWatchlistItems } from "@wachsam/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SignalChain } from "@/lib/public-data";

export const WATCHLIST_ITEM_TYPE = "lagebild" as const;

export type UserWatchlistState =
  | { available: true; itemIds: string[]; items: SignalChain[]; reason: null }
  | { available: false; itemIds: string[]; items: SignalChain[]; reason: "no_database" | "schema_pending" | "read_error" };

function isMissingWatchlistTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("user_watchlist_items") && (message.includes("does not exist") || message.includes("42P01"));
}

function validItemId(value: string): boolean {
  return /^[a-z0-9._:-]+$/i.test(value) && value.length <= 160;
}

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

  const itemType = String(formData.get("itemType") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (itemType !== WATCHLIST_ITEM_TYPE || !validItemId(itemId)) return;

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
      const existing = await db
        .select({ id: userWatchlistItems.id })
        .from(userWatchlistItems)
        .where(
          and(
            eq(userWatchlistItems.userId, userId),
            eq(userWatchlistItems.itemType, WATCHLIST_ITEM_TYPE),
            eq(userWatchlistItems.itemId, itemId),
          ),
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(userWatchlistItems).values({
          id: randomUUID(),
          userId,
          itemType: WATCHLIST_ITEM_TYPE,
          itemId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    if (!isMissingWatchlistTable(error)) throw error;
  }

  revalidatePath("/profil");
}
