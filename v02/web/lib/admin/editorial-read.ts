import { count, desc, eq, sql } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db, schema } from "../db";
import { requireEditorRole } from "./permissions";
import { editorialItemTypes, type EditorialItemType } from "./schemas";
import type { EditorialAction, EditorialStatus } from "./audit-log";

export type AdminFieldKind = "text" | "textarea" | "json" | "select";

export type AdminFieldMeta = {
  name: string;
  label: string;
  kind: AdminFieldKind;
  required?: boolean;
  options?: string[];
  help?: string;
};

export type EditorialTypeMeta = {
  type: EditorialItemType;
  auditType: string;
  label: string;
  singularLabel: string;
  titleField: string;
  description: string;
  publicPath?: string;
  fields: AdminFieldMeta[];
};

type EditorialTable = PgTable & {
  id: AnyPgColumn;
  editorialStatus: AnyPgColumn;
  editorialReviewedAt: AnyPgColumn;
  publishedAt: AnyPgColumn;
};

export type EditorialOverviewRow = {
  type: EditorialItemType;
  label: string;
  description: string;
  counts: Record<EditorialStatus, number>;
};

export type EditorialListItem = {
  id: string;
  title: string;
  status: EditorialStatus;
  editorialReviewedAt: Date | null;
  publishedAt: Date | null;
};

export type EditorialItem = Record<string, unknown> & {
  id: string;
  editorialStatus: EditorialStatus;
  editorialReviewedAt: Date | null;
  publishedAt: Date | null;
};

export type EditorialAuditEventRow = {
  id: string;
  createdAt: Date;
  itemType: string;
  itemId: string;
  action: EditorialAction;
  actorId: string | null;
  fromStatus: EditorialStatus | null;
  toStatus: EditorialStatus | null;
  reason: string | null;
};

const statuses: EditorialStatus[] = ["draft", "approved", "rejected", "published"];
const confidenceOptions = ["niedrig", "mittel", "hoch"];
const severityOptions = ["stabil", "beobachten", "erhoeht", "kritisch", "eskalierend"];
const zeithorizontOptions = ["kurzfristig", "wochen", "monate", "langfristig"];
const methodologyOptions = ["steep", "rca", "bia", "fmea", "scenario"];
const aufwandOptions = ["niedrig", "mittel", "hoch"];

export const editorialTypeMeta = {
  facts: {
    type: "facts",
    auditType: "fact",
    label: "Fakten",
    singularLabel: "Fakt",
    titleField: "valueLabel",
    description: "Quellennahe Kennzahlen und Faktenreferenzen.",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "category", label: "Kategorie", kind: "text", required: true },
      { name: "valueLabel", label: "Wert / Label", kind: "textarea", required: true },
      { name: "valueNumeric", label: "Numerischer Wert", kind: "text" },
      { name: "unit", label: "Einheit", kind: "text" },
      { name: "period", label: "Zeitraum", kind: "text" },
      { name: "sourceName", label: "Quelle", kind: "text", required: true },
      { name: "sourceUrl", label: "Quell-URL", kind: "text", required: true },
      { name: "sourceStand", label: "Quellenstand", kind: "text", required: true },
    ],
  },
  cascades: {
    type: "cascades",
    auditType: "cascade",
    label: "Kaskaden",
    singularLabel: "Kaskade",
    titleField: "title",
    description: "Wirkungsketten mit Deutschland-Relevanz und Schritten.",
    publicPath: "/kaskaden",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "title", label: "Titel", kind: "textarea", required: true },
      { name: "trigger", label: "Auslöser", kind: "textarea", required: true },
      { name: "confidence", label: "Confidence", kind: "select", required: true, options: confidenceOptions },
      { name: "severity", label: "Severity", kind: "select", required: true, options: severityOptions },
      { name: "zeithorizont", label: "Zeithorizont", kind: "select", required: true, options: zeithorizontOptions },
      { name: "methodologyTag", label: "Methodik", kind: "select", required: true, options: methodologyOptions },
      { name: "germanyRelevance", label: "Deutschland-Relevanz (JSON)", kind: "json", required: true, help: "Objekt, z.B. {\"...\":\"...\"}" },
      { name: "steps", label: "Schritte (JSON)", kind: "json", required: true, help: "Array von Objekten." },
      { name: "haushaltswirkung", label: "Haushaltswirkung", kind: "textarea", required: true },
    ],
  },
  governance: {
    type: "governance",
    auditType: "governance",
    label: "Governance",
    singularLabel: "Governance-Item",
    titleField: "title",
    description: "Versprechen, Realität und Haushaltswirkung.",
    publicPath: "/governance",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "title", label: "Titel", kind: "textarea", required: true },
      { name: "versprechen", label: "Versprechen", kind: "textarea", required: true },
      { name: "realitaet", label: "Realität", kind: "textarea", required: true },
      { name: "haushaltswirkung", label: "Haushaltswirkung", kind: "textarea", required: true },
      { name: "confidence", label: "Confidence", kind: "select", required: true, options: confidenceOptions },
      { name: "linkedCascade", label: "Verknüpfte Kaskade", kind: "text" },
    ],
  },
  indicators: {
    type: "indicators",
    auditType: "indicator",
    label: "Indikatoren",
    singularLabel: "Indikator",
    titleField: "label",
    description: "Frühwarnindikatoren und Schwellenwerte.",
    publicPath: "/indikatoren",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "label", label: "Label", kind: "textarea", required: true },
      { name: "thresholdWarn", label: "Warn-Schwelle", kind: "text" },
      { name: "thresholdCritical", label: "Kritische Schwelle", kind: "text" },
      { name: "unit", label: "Einheit", kind: "text" },
      { name: "system", label: "System", kind: "text", required: true },
      { name: "severityTrigger", label: "Severity-Trigger", kind: "select", required: true, options: severityOptions },
      { name: "quelle", label: "Quelle", kind: "text", required: true },
      { name: "germanyRelevance", label: "Deutschland-Relevanz (JSON)", kind: "json", required: true },
      { name: "linkedCascade", label: "Verknüpfte Kaskade", kind: "text" },
    ],
  },
  costImpacts: {
    type: "costImpacts",
    auditType: "cost_impact",
    label: "Kostenwirkungen",
    singularLabel: "Kostenwirkung",
    titleField: "titel",
    description: "Haushaltsnahe Kosten- und Preiswirkungen.",
    publicPath: "/kosten",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "bereich", label: "Bereich", kind: "text", required: true },
      { name: "titel", label: "Titel", kind: "textarea", required: true },
      { name: "beschreibung", label: "Beschreibung", kind: "textarea", required: true },
      { name: "zeithorizont", label: "Zeithorizont", kind: "select", required: true, options: zeithorizontOptions },
      { name: "confidence", label: "Confidence", kind: "select", required: true, options: confidenceOptions },
      { name: "unsicherheit", label: "Unsicherheit", kind: "textarea", required: true },
      { name: "causalLinks", label: "Wirkungsbezüge (JSON)", kind: "json", required: true, help: "Array von Objekten." },
    ],
  },
  lagebildItems: {
    type: "lagebildItems",
    auditType: "lagebild_item",
    label: "Lagebild",
    singularLabel: "Lagebild-Item",
    titleField: "titel",
    description: "Systembereiche, Trends und Primärindikatoren.",
    publicPath: "/lagebild",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "bereich", label: "Bereich", kind: "text", required: true },
      { name: "titel", label: "Titel", kind: "textarea", required: true },
      { name: "beschreibung", label: "Beschreibung", kind: "textarea", required: true },
      { name: "severity", label: "Severity", kind: "select", required: true, options: severityOptions },
      { name: "trend", label: "Trend", kind: "text", required: true },
      { name: "primaerindikator", label: "Primärindikator", kind: "textarea", required: true },
      { name: "confidence", label: "Confidence", kind: "select", required: true, options: confidenceOptions },
      { name: "factIds", label: "Fact-IDs (JSON)", kind: "json", required: true, help: "Array von IDs." },
    ],
  },
  supplyRisks: {
    type: "supplyRisks",
    auditType: "supply_risk",
    label: "Versorgung",
    singularLabel: "Versorgungsrisiko",
    titleField: "titel",
    description: "Versorgungsrisiken mit Unsicherheit und Wirkungsbezug.",
    publicPath: "/versorgung",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "bereich", label: "Bereich", kind: "text", required: true },
      { name: "titel", label: "Titel", kind: "textarea", required: true },
      { name: "beschreibung", label: "Beschreibung", kind: "textarea", required: true },
      { name: "severity", label: "Severity", kind: "select", required: true, options: severityOptions },
      { name: "zeithorizont", label: "Zeithorizont", kind: "select", required: true, options: zeithorizontOptions },
      { name: "confidence", label: "Confidence", kind: "select", required: true, options: confidenceOptions },
      { name: "unsicherheit", label: "Unsicherheit", kind: "textarea" },
      { name: "causalLinks", label: "Wirkungsbezüge (JSON)", kind: "json", required: true },
    ],
  },
  citizenActions: {
    type: "citizenActions",
    auditType: "citizen_action",
    label: "Maßnahmen",
    singularLabel: "Maßnahme",
    titleField: "titel",
    description: "Ruhige Prüf- und Orientierungsschritte für Bürger.",
    publicPath: "/massnahmen",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "bereich", label: "Bereich", kind: "text", required: true },
      { name: "titel", label: "Titel", kind: "textarea", required: true },
      { name: "beschreibung", label: "Beschreibung", kind: "textarea", required: true },
      { name: "aufwand", label: "Aufwand", kind: "select", required: true, options: aufwandOptions },
      { name: "bezugZuBereich", label: "Bezug zu Bereichen (JSON)", kind: "json", required: true, help: "Array von Bereichs-IDs." },
      { name: "causalLinks", label: "Wirkungsbezüge (JSON)", kind: "json", required: true },
    ],
  },
  nationalState: {
    type: "nationalState",
    auditType: "national_state",
    label: "Gesamtstand",
    singularLabel: "Gesamtstand",
    titleField: "executiveSummary",
    description: "Gesamtstand Deutschland: Tonalität, Kurzlage und Revisionskriterien.",
    publicPath: "/lage",
    fields: [
      { name: "id", label: "ID", kind: "text", required: true },
      { name: "standDate", label: "Stand (ISO-Zeitstempel)", kind: "text", required: true, help: "ISO 8601, z.B. 2026-06-15T00:00:00Z" },
      { name: "overallTone", label: "Gesamttonalität", kind: "select", required: true, options: severityOptions },
      { name: "executiveSummary", label: "Kurzlage", kind: "textarea", required: true },
      { name: "revisionCriteria", label: "Revisionskriterien (JSON)", kind: "json", required: true, help: "Array von Objekten {label, operator, threshold, ...}." },
      { name: "gegentrends", label: "Gegentrends (JSON)", kind: "json", help: "Array von Strings." },
    ],
  },
} as const satisfies Record<EditorialItemType, EditorialTypeMeta>;

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

function ensureDb() {
  if (!db) throw new Error("Datenbank nicht erreichbar.");
  return db;
}

export function parseEditorialType(value: string): EditorialItemType | null {
  return (editorialItemTypes as readonly string[]).includes(value) ? (value as EditorialItemType) : null;
}

export function getTypeMeta(itemType: EditorialItemType): EditorialTypeMeta {
  return editorialTypeMeta[itemType];
}

function table(itemType: EditorialItemType) {
  return tableMap[itemType] as EditorialTable;
}

function normalizeCounts(rows: Array<{ status: EditorialStatus; count: number }>): Record<EditorialStatus, number> {
  const result = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<EditorialStatus, number>;
  for (const row of rows) result[row.status] = Number(row.count);
  return result;
}

export async function getEditorialOverview(): Promise<EditorialOverviewRow[]> {
  await requireEditorRole();
  const activeDb = ensureDb();
  const overview: EditorialOverviewRow[] = [];
  for (const itemType of editorialItemTypes) {
    const t = table(itemType);
    const rows = (await activeDb
      .select({ status: t.editorialStatus, count: count() })
      .from(t as never)
      .groupBy(t.editorialStatus as never)) as Array<{ status: EditorialStatus; count: number }>;
    const meta = getTypeMeta(itemType);
    overview.push({ type: itemType, label: meta.label, description: meta.description, counts: normalizeCounts(rows) });
  }
  return overview;
}

export async function listEditorialItems(itemType: EditorialItemType): Promise<EditorialListItem[]> {
  await requireEditorRole();
  const activeDb = ensureDb();
  const t = table(itemType);
  const meta = getTypeMeta(itemType);
  const rows = (await activeDb.select().from(t as never).orderBy(t.editorialStatus as never, t.id as never)) as EditorialItem[];
  return rows.map((row) => ({
    id: row.id,
    title: String(row[meta.titleField] ?? row.id),
    status: row.editorialStatus,
    editorialReviewedAt: row.editorialReviewedAt,
    publishedAt: row.publishedAt,
  }));
}

export async function getEditorialItem(itemType: EditorialItemType, id: string): Promise<EditorialItem | null> {
  await requireEditorRole();
  const activeDb = ensureDb();
  const t = table(itemType);
  const rows = (await activeDb.select().from(t as never).where(eq(t.id as never, id as never)).limit(1)) as EditorialItem[];
  return rows[0] ?? null;
}

export async function listAuditEvents(limit = 100): Promise<EditorialAuditEventRow[]> {
  await requireEditorRole();
  const activeDb = ensureDb();
  return (await activeDb
    .select({
      id: schema.editorialAuditLog.id,
      createdAt: schema.editorialAuditLog.createdAt,
      itemType: schema.editorialAuditLog.itemType,
      itemId: schema.editorialAuditLog.itemId,
      action: schema.editorialAuditLog.action,
      actorId: schema.editorialAuditLog.actorId,
      fromStatus: schema.editorialAuditLog.fromStatus,
      toStatus: schema.editorialAuditLog.toStatus,
      reason: schema.editorialAuditLog.reason,
    })
    .from(schema.editorialAuditLog)
    .orderBy(desc(schema.editorialAuditLog.createdAt), sql`${schema.editorialAuditLog.id} desc`)
    .limit(limit)) as EditorialAuditEventRow[];
}
