import { randomUUID } from "node:crypto";
import { db, schema } from "../db";

export type EditorialAction = "create" | "update" | "approve" | "reject" | "publish" | "unpublish";
export type EditorialStatus = "draft" | "approved" | "rejected" | "published";

export type AuditEvent = {
  itemType: string;
  itemId: string;
  action: EditorialAction;
  actorId: string;
  fromStatus?: EditorialStatus | null;
  toStatus?: EditorialStatus | null;
  reason?: string | null;
};

export async function logAuditEvent(event: AuditEvent) {
  if (!db) return;
  await db.insert(schema.editorialAuditLog).values({
    id: randomUUID(),
    itemType: event.itemType,
    itemId: event.itemId,
    action: event.action,
    actorId: event.actorId,
    fromStatus: event.fromStatus ?? null,
    toStatus: event.toStatus ?? null,
    reason: event.reason ?? null,
  });
}
