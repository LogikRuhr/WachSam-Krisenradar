"use server";

import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "../db";
import { logAuditEvent, type EditorialStatus } from "./audit-log";
import { requireEditorRole } from "./permissions";
import {
  cascadeSchema,
  citizenActionSchema,
  costImpactSchema,
  factSchema,
  governanceSchema,
  indicatorSchema,
  lagebildItemSchema,
  nationalStateSchema,
  rejectReasonSchema,
  supplyRiskSchema,
  type EditorialItemType,
} from "./schemas";

type EditorialTable = PgTable & {
  id: { name: string };
  editorialStatus: { name: string };
  editorialReviewedAt: { name: string };
  editorialReviewedBy: { name: string };
  publishedAt: { name: string };
};

const tableMap = {
  facts: schema.facts,
  cascades: schema.cascades,
  governance: schema.governance,
  indicators: schema.indicators,
  costImpacts: schema.costImpacts,
  lagebildItems: schema.lagebildItems,
  supplyRisks: schema.supplyRisks,
  citizenActions: schema.citizenActions,
  nationalState: schema.nationalState,
} as const satisfies Record<EditorialItemType, unknown>;

const schemaMap = {
  facts: factSchema,
  cascades: cascadeSchema,
  governance: governanceSchema,
  indicators: indicatorSchema,
  costImpacts: costImpactSchema,
  lagebildItems: lagebildItemSchema,
  supplyRisks: supplyRiskSchema,
  citizenActions: citizenActionSchema,
  nationalState: nationalStateSchema,
} as const satisfies Record<EditorialItemType, z.ZodTypeAny>;

const auditItemTypeMap: Record<EditorialItemType, string> = {
  facts: "fact",
  cascades: "cascade",
  governance: "governance",
  indicators: "indicator",
  costImpacts: "cost_impact",
  lagebildItems: "lagebild_item",
  supplyRisks: "supply_risk",
  citizenActions: "citizen_action",
  nationalState: "national_state",
};

function ensureDb() {
  if (!db) throw new Error("Datenbank nicht erreichbar.");
  return db;
}

function table(itemType: EditorialItemType) {
  return tableMap[itemType];
}

function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/lagebild");
  revalidatePath("/kosten");
  revalidatePath("/versorgung");
  revalidatePath("/kaskaden");
  revalidatePath("/massnahmen");
  revalidatePath("/quellen");
  revalidatePath("/governance");
  revalidatePath("/indikatoren");
  revalidatePath("/lage");
}

async function loadStatus(itemType: EditorialItemType, id: string): Promise<EditorialStatus | null> {
  const activeDb = ensureDb();
  const t = table(itemType) as unknown as EditorialTable;
  const rows = await activeDb
    .select({ status: t.editorialStatus as never })
    .from(t)
    .where(eq(t.id as never, id as never))
    .limit(1);
  return (rows[0]?.status as EditorialStatus | undefined) ?? null;
}

export async function createDraft(itemType: EditorialItemType, payload: unknown) {
  const { userId } = await requireEditorRole();
  const data = schemaMap[itemType].parse(payload);
  const activeDb = ensureDb();
  await activeDb.insert(table(itemType) as never).values({
    ...(data as Record<string, unknown>),
    editorialStatus: "draft",
    editorialReviewedBy: userId,
    editorialReviewedAt: new Date(),
  } as never);
  await logAuditEvent({
    itemType: auditItemTypeMap[itemType],
    itemId: (data as { id: string }).id,
    action: "create",
    actorId: userId,
    toStatus: "draft",
  });
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateDraft(itemType: EditorialItemType, payload: unknown) {
  const { userId } = await requireEditorRole();
  const data = schemaMap[itemType].parse(payload) as { id: string };
  const activeDb = ensureDb();
  const t = table(itemType) as unknown as EditorialTable;
  const current = await loadStatus(itemType, data.id);
  if (current !== "draft" && current !== "rejected") {
    throw new Error(`Update nur erlaubt aus Status 'draft' oder 'rejected' (aktuell: ${current ?? "unbekannt"}).`);
  }
  await activeDb
    .update(t as never)
    .set({
      ...(data as Record<string, unknown>),
      editorialReviewedBy: userId,
      editorialReviewedAt: new Date(),
    } as never)
    .where(eq(t.id as never, data.id as never));
  await logAuditEvent({
    itemType: auditItemTypeMap[itemType],
    itemId: data.id,
    action: "update",
    actorId: userId,
    fromStatus: current,
    toStatus: current,
  });
  return { ok: true, id: data.id };
}

async function transition(
  itemType: EditorialItemType,
  id: string,
  to: EditorialStatus,
  expectedFrom: EditorialStatus[],
  action: "approve" | "reject" | "publish" | "unpublish",
  reason?: string,
) {
  const { userId } = await requireEditorRole();
  const activeDb = ensureDb();
  const t = table(itemType) as unknown as EditorialTable;
  const current = await loadStatus(itemType, id);
  if (!current || !expectedFrom.includes(current)) {
    throw new Error(
      `Transition '${action}' nur erlaubt aus ${expectedFrom.join(" | ")} (aktuell: ${current ?? "unbekannt"}).`,
    );
  }
  const patch: Record<string, unknown> = {
    editorialStatus: to,
    editorialReviewedBy: userId,
    editorialReviewedAt: new Date(),
  };
  if (to === "published") patch.publishedAt = new Date();
  await activeDb
    .update(t as never)
    .set(patch as never)
    .where(eq(t.id as never, id as never));
  await logAuditEvent({
    itemType: auditItemTypeMap[itemType],
    itemId: id,
    action,
    actorId: userId,
    fromStatus: current,
    toStatus: to,
    reason: reason ?? null,
  });
  if (to === "published" || current === "published") revalidatePublic();
  return { ok: true, id };
}

export async function approveItem(itemType: EditorialItemType, id: string) {
  return transition(itemType, id, "approved", ["draft"], "approve");
}

export async function rejectItem(itemType: EditorialItemType, id: string, reasonInput: unknown) {
  const { reason } = rejectReasonSchema.parse(reasonInput);
  return transition(itemType, id, "rejected", ["draft", "approved"], "reject", reason);
}

export async function publishItem(itemType: EditorialItemType, id: string) {
  return transition(itemType, id, "published", ["approved"], "publish");
}

export async function unpublishItem(itemType: EditorialItemType, id: string) {
  return transition(itemType, id, "draft", ["published"], "unpublish");
}
