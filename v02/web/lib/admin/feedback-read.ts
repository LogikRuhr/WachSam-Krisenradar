import { desc } from "drizzle-orm";
import { db, schema } from "../db";
import { requireEditorRole } from "./permissions";

export type FeedbackRow = typeof schema.feedback.$inferSelect;

/** Liste der Feedback-Einträge (neueste zuerst) — nur für editor/admin. */
export async function listFeedback(limit = 200): Promise<FeedbackRow[]> {
  await requireEditorRole();
  if (!db) return [];
  return db.select().from(schema.feedback).orderBy(desc(schema.feedback.createdAt)).limit(limit);
}
