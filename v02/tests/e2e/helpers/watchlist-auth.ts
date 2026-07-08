import { randomUUID } from "node:crypto";
import { encode } from "@auth/core/jwt";
import { and, eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import type { BrowserContext } from "@playwright/test";
import * as schema from "../../../db/schema";

const WATCHLIST_ITEM_TYPE = "lagebild";
const AUTH_SESSION_COOKIE = "authjs.session-token";
const WATCHLIST_E2E_AUTH_SECRET = "watchlist-e2e-local-secret";

type WatchlistDb = PostgresJsDatabase<typeof schema>;

export type WatchlistTestClient = {
  db: WatchlistDb;
  sql: Sql;
};

export type WatchlistTestUser = {
  userId: string;
  email: string;
  sessionToken: string;
};

export function watchlistDatabaseUrl(): string {
  return process.env.WATCHLIST_E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
}

export function watchlistBaseUrl(): string {
  const port = process.env.PLAYWRIGHT_WATCHLIST_PORT ?? "3110";
  return `http://127.0.0.1:${port}`;
}

function watchlistAuthSecret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? WATCHLIST_E2E_AUTH_SECRET;
}

export function connectWatchlistTestDb(): WatchlistTestClient {
  const url = watchlistDatabaseUrl();
  if (!url) throw new Error("WATCHLIST_E2E_DATABASE_URL oder DATABASE_URL ist fuer smoke:watchlist erforderlich.");
  const sql = postgres(url, { max: 1, idle_timeout: 5 });
  return { db: drizzle(sql, { schema }), sql };
}

export async function closeWatchlistTestDb(client: WatchlistTestClient): Promise<void> {
  await client.sql.end();
}

export async function createWatchlistTestUser(client: WatchlistTestClient, label: string): Promise<WatchlistTestUser> {
  const suffix = randomUUID();
  const userId = `watchlist-e2e-${label}-${suffix}`;
  const email = `${userId}@example.invalid`;
  const now = new Date();
  const sessionToken = await encode({
    token: {
      sub: userId,
      email,
      role: "viewer",
      jti: suffix,
    },
    secret: watchlistAuthSecret(),
    salt: AUTH_SESSION_COOKIE,
    maxAge: 60 * 60,
  });

  await client.db.insert(schema.users).values({
    id: userId,
    email,
    role: "viewer",
    createdAt: now,
    updatedAt: now,
  });
  await client.db.insert(schema.sessions).values({
    sessionToken,
    userId,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  });

  return { userId, email, sessionToken };
}

export async function cleanupWatchlistTestUser(client: WatchlistTestClient, userId: string): Promise<void> {
  await client.db.delete(schema.users).where(eq(schema.users.id, userId));
}

export async function setWatchlistSessionCookie(context: BrowserContext, sessionToken: string): Promise<void> {
  await context.addCookies([
    {
      name: AUTH_SESSION_COOKIE,
      value: sessionToken,
      url: watchlistBaseUrl(),
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
}

export async function countWatchlistRows(
  client: WatchlistTestClient,
  userId: string,
  itemId: string,
): Promise<number> {
  const rows = await client.db
    .select({ id: schema.userWatchlistItems.id })
    .from(schema.userWatchlistItems)
    .where(
      and(
        eq(schema.userWatchlistItems.userId, userId),
        eq(schema.userWatchlistItems.itemType, WATCHLIST_ITEM_TYPE),
        eq(schema.userWatchlistItems.itemId, itemId),
      ),
    );
  return rows.length;
}

export async function firstWatchlistItemId(client: WatchlistTestClient, userId: string): Promise<string> {
  const rows = await client.db
    .select({ itemId: schema.userWatchlistItems.itemId })
    .from(schema.userWatchlistItems)
    .where(and(eq(schema.userWatchlistItems.userId, userId), eq(schema.userWatchlistItems.itemType, WATCHLIST_ITEM_TYPE)))
    .limit(1);
  const itemId = rows[0]?.itemId;
  if (!itemId) throw new Error("watchlist item was not inserted");
  return itemId;
}

export async function insertWatchlistRow(
  client: WatchlistTestClient,
  userId: string,
  itemId: string,
): Promise<void> {
  const now = new Date();
  await client.db
    .insert(schema.userWatchlistItems)
    .values({
      id: randomUUID(),
      userId,
      itemType: WATCHLIST_ITEM_TYPE,
      itemId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [schema.userWatchlistItems.userId, schema.userWatchlistItems.itemType, schema.userWatchlistItems.itemId],
    });
}
