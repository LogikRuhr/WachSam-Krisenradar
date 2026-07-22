"use server";

import { count, eq } from "drizzle-orm";
import { auth, isAuthRuntimeConfigured } from "./auth";
import { db, schema } from "./db";

export async function getPasskeyCountForUser(userId: string): Promise<number> {
  if (!db) return 0;

  const [result] = await db
    .select({ value: count() })
    .from(schema.authenticators)
    .where(eq(schema.authenticators.userId, userId));
  return result?.value ?? 0;
}

export async function removeOwnPasskeysAction(): Promise<void> {
  if (!isAuthRuntimeConfigured() || !db) {
    throw new Error("Passkey-Verwaltung ist derzeit nicht verfuegbar.");
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Anmeldung erforderlich.");
  }

  await db.delete(schema.authenticators).where(eq(schema.authenticators.userId, userId));
}
