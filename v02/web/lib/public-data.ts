import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "./db";

const PUBLISHED = "published" as const;

export const DB_PLACEHOLDER = "Datenbank nicht verbunden — bitte `docker compose up postgres && pnpm db:migrate && pnpm db:seed`";

export type DbState<T> = { rows: T[]; connected: boolean; error?: string };
export type DbItemState<T> = { data: T | null; connected: boolean; error?: string };
export type WithSources<T> = T & { sources: SourceRow[] };
export type SourceRow = typeof schema.itemSources.$inferSelect;
export type ItemSourceType = SourceRow["itemType"];

const severityRank: Record<string, number> = {
  stabil: 1,
  beobachten: 2,
  erhoeht: 3,
  kritisch: 4,
  eskalierend: 5,
};

function database() {
  return db as typeof db | null;
}

export function severityValue(value: string) {
  return severityRank[value] ?? 0;
}

export function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

async function safe<T>(query: () => Promise<T[]>): Promise<DbState<T>> {
  const activeDb = database();
  if (!activeDb) return { rows: [], connected: false };
  try {
    const rows = await query();
    return { rows, connected: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "DB-Abfrage fehlgeschlagen";
    console.error("[WachSam DB]", msg);
    return { rows: [], connected: false, error: msg };
  }
}

async function attachSources<T extends { id: string }>(itemType: SourceRow["itemType"], rows: T[]): Promise<WithSources<T>[]> {
  const activeDb = database();
  if (!activeDb || rows.length === 0) return rows.map((row) => ({ ...row, sources: [] }));
  const ids = rows.map((row) => row.id);
  const sources = await activeDb
    .select()
    .from(schema.itemSources)
    .where(inArray(schema.itemSources.itemId, ids))
    .orderBy(asc(schema.itemSources.orderIdx));
  return rows.map((row) => ({
    ...row,
    sources: sources.filter((source) => source.itemType === itemType && source.itemId === row.id),
  }));
}

export async function getLagebildItems() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.lagebildItems)
      .where(eq(schema.lagebildItems.editorialStatus, PUBLISHED))
      .orderBy(desc(schema.lagebildItems.severity), asc(schema.lagebildItems.bereich)),
  );
  const rows = await attachSources("lagebild", state.rows);
  rows.sort((a, b) => severityValue(b.severity) - severityValue(a.severity) || a.bereich.localeCompare(b.bereich));
  return { ...state, rows };
}

export async function getCostImpacts() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.costImpacts)
      .where(eq(schema.costImpacts.editorialStatus, PUBLISHED))
      .orderBy(asc(schema.costImpacts.bereich)),
  );
  return { ...state, rows: await attachSources("cost", state.rows) };
}

export async function getSupplyRisks() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.supplyRisks)
      .where(eq(schema.supplyRisks.editorialStatus, PUBLISHED))
      .orderBy(desc(schema.supplyRisks.severity)),
  );
  const rows = await attachSources("supply", state.rows);
  rows.sort((a, b) => severityValue(b.severity) - severityValue(a.severity) || a.bereich.localeCompare(b.bereich));
  return { ...state, rows };
}

export async function getCascades() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.cascades)
      .where(eq(schema.cascades.editorialStatus, PUBLISHED))
      .orderBy(asc(schema.cascades.id)),
  );
  return { ...state, rows: await attachSources("cascade", state.rows) };
}

async function safeSingle<T>(query: () => Promise<T[]>): Promise<DbItemState<T>> {
  const state = await safe(query);
  return { connected: state.connected, error: state.error, data: state.connected ? (state.rows[0] ?? null) : null };
}

export async function getCascadeById(id: string) {
  const state = await safeSingle(() =>
    database()!
      .select()
      .from(schema.cascades)
      .where(and(eq(schema.cascades.id, id), eq(schema.cascades.editorialStatus, PUBLISHED)))
      .limit(1),
  );
  if (!state.connected || !state.data) return state;
  const [data] = await attachSources("cascade", [state.data]);
  return { ...state, data };
}

export async function getGovernanceById(id: string) {
  const state = await safeSingle(() =>
    database()!
      .select()
      .from(schema.governance)
      .where(and(eq(schema.governance.id, id), eq(schema.governance.editorialStatus, PUBLISHED)))
      .limit(1),
  );
  if (!state.connected || !state.data) return state;
  const [data] = await attachSources("governance", [state.data]);
  return { ...state, data };
}

export async function getIndicatorById(id: string) {
  const state = await safeSingle(() =>
    database()!
      .select()
      .from(schema.indicators)
      .where(and(eq(schema.indicators.id, id), eq(schema.indicators.editorialStatus, PUBLISHED)))
      .limit(1),
  );
  if (!state.connected || !state.data) return state;
  const [data] = await attachSources("indicator", [state.data]);
  return { ...state, data };
}

export async function getHotspotById(id: string) {
  const state = await safeSingle(() =>
    database()!
      .select()
      .from(schema.cascades)
      .where(and(eq(schema.cascades.id, id), eq(schema.cascades.editorialStatus, PUBLISHED)))
      .limit(1),
  );
  if (!state.connected || !state.data) return state;
  const [data] = await attachSources("cascade", [state.data]);
  return { ...state, data };
}

export async function getItemSources(itemType: ItemSourceType, itemId: string): Promise<DbItemState<SourceRow[]>> {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.itemSources)
      .where(eq(schema.itemSources.itemId, itemId))
      .orderBy(asc(schema.itemSources.orderIdx)),
  );
  if (!state.connected) return { data: null, connected: false, error: state.error };
  return { data: state.rows.filter((source) => source.itemType === itemType), connected: true };
}

export async function getCitizenActions() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.citizenActions)
      .where(eq(schema.citizenActions.editorialStatus, PUBLISHED))
      .orderBy(asc(schema.citizenActions.bereich)),
  );
  return { ...state, rows: await attachSources("action", state.rows) };
}

export async function getGovernanceItems() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.governance)
      .where(eq(schema.governance.editorialStatus, PUBLISHED))
      .orderBy(asc(schema.governance.id)),
  );
  return { ...state, rows: await attachSources("governance", state.rows) };
}

export async function getIndicators() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.indicators)
      .where(eq(schema.indicators.editorialStatus, PUBLISHED))
      .orderBy(asc(schema.indicators.system)),
  );
  return { ...state, rows: await attachSources("indicator", state.rows) };
}

export async function getSourceTrustLayer() {
  const state = await safe(() => database()!.select().from(schema.itemSources).orderBy(asc(schema.itemSources.sourceName)));
  const byUrl = new Map<string, SourceRow & { citedItems: string[] }>();
  for (const source of state.rows) {
    const key = source.sourceUrl;
    const existing = byUrl.get(key);
    if (existing) {
      existing.citedItems.push(`${source.itemType}:${source.itemId}`);
    } else {
      byUrl.set(key, { ...source, citedItems: [`${source.itemType}:${source.itemId}`] });
    }
  }
  return { ...state, rows: Array.from(byUrl.values()) };
}

export async function getHeroLagebild() {
  const lagebild = await getLagebildItems();
  return { ...lagebild, rows: lagebild.rows.slice(0, 1) };
}

export function describeLinks(links: Array<Record<string, unknown>> | null | undefined) {
  if (!links?.length) return [];
  return links.map((link) => Object.values(link).filter(Boolean).join(" → ")).filter(Boolean);
}
