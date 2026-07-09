import { eq } from "drizzle-orm";
import { auth, isAuthRuntimeConfigured } from "../auth";
import { db, schema } from "../db";

export type EditorRole = "editor" | "admin";

export class NotAuthorizedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "NotAuthorizedError";
  }
}

export async function requireEditorRole(): Promise<{ userId: string; role: EditorRole }> {
  if (!isAuthRuntimeConfigured()) {
    throw new NotAuthorizedError("Auth-Runtime nicht konfiguriert.");
  }
  const session = await auth();
  if (!session?.user?.id) {
    throw new NotAuthorizedError("Keine Session — Login erforderlich.");
  }
  if (!db) {
    throw new NotAuthorizedError("Datenbank nicht erreichbar.");
  }
  const userId = session.user.id;
  const [row] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!row) {
    throw new NotAuthorizedError("Benutzer nicht gefunden.");
  }
  if (row.role !== "editor" && row.role !== "admin") {
    throw new NotAuthorizedError("Editorial-Rolle erforderlich.");
  }
  return { userId, role: row.role };
}
