import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db, schema } from "./db";
import { aufwandRank, confidenceRank, isRising } from "./personalization";

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

type ParentTable = PgTable & { id: AnyPgColumn; editorialStatus: AnyPgColumn };

// item_sources zeigt polymorph (itemType:itemId) auf das Parent-Item und trägt selbst
// keinen editorial_status. Quellen dürfen nur sichtbar werden, wenn das Parent-Item
// veröffentlicht ist — sonst leaken Quellen unpublizierter Drafts über /quellen & Detailrouten.
const ITEM_SOURCE_PARENTS: Record<ItemSourceType, ParentTable> = {
  lagebild: schema.lagebildItems as unknown as ParentTable,
  cost: schema.costImpacts as unknown as ParentTable,
  supply: schema.supplyRisks as unknown as ParentTable,
  cascade: schema.cascades as unknown as ParentTable,
  governance: schema.governance as unknown as ParentTable,
  indicator: schema.indicators as unknown as ParentTable,
  action: schema.citizenActions as unknown as ParentTable,
};

async function keepPublishedSources(rows: SourceRow[]): Promise<SourceRow[]> {
  const activeDb = database();
  if (!activeDb || rows.length === 0) return rows;
  const idsByType = new Map<ItemSourceType, string[]>();
  for (const row of rows) {
    const list = idsByType.get(row.itemType) ?? [];
    list.push(row.itemId);
    idsByType.set(row.itemType, list);
  }
  const published = new Set<string>();
  for (const [itemType, ids] of idsByType) {
    const cols = ITEM_SOURCE_PARENTS[itemType];
    const found = await activeDb
      .select({ id: cols.id })
      .from(cols)
      .where(and(inArray(cols.id, ids), eq(cols.editorialStatus, PUBLISHED)));
    for (const row of found) published.add(`${itemType}:${String(row.id)}`);
  }
  return rows.filter((row) => published.has(`${row.itemType}:${row.itemId}`));
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

export type IndicatorRow = typeof schema.indicators.$inferSelect;
export type CascadeIndicatorLink = typeof schema.cascadeIndicatorLinks.$inferSelect & {
  indicator: IndicatorRow | null;
};
export type CascadeWithLinks = WithSources<typeof schema.cascades.$inferSelect> & {
  indicatorLinks: CascadeIndicatorLink[];
};

/**
 * Lädt die cascade_indicator_links einer Kaskade samt verlinkter, publizierter
 * Indikatoren (mit Live-Werten). Nur Links mit publiziertem Status UND publiziertem
 * Indikator werden sichtbar — sonst leaken Draft-Indikatoren über die Detailseite.
 * Treiber-Links (driver) zuerst, dann betroffene (affected); stabile Reihenfolge.
 */
async function attachIndicatorLinks(cascadeId: string): Promise<CascadeIndicatorLink[]> {
  const activeDb = database();
  if (!activeDb) return [];
  const links = await activeDb
    .select()
    .from(schema.cascadeIndicatorLinks)
    .where(
      and(
        eq(schema.cascadeIndicatorLinks.cascadeId, cascadeId),
        eq(schema.cascadeIndicatorLinks.editorialStatus, PUBLISHED),
      ),
    );
  if (links.length === 0) return [];

  const indicatorIds = Array.from(new Set(links.map((link) => link.indicatorId)));
  const indicators = await activeDb
    .select()
    .from(schema.indicators)
    .where(
      and(inArray(schema.indicators.id, indicatorIds), eq(schema.indicators.editorialStatus, PUBLISHED)),
    );
  const byId = new Map(indicators.map((indicator) => [indicator.id, indicator]));

  return links
    .map((link) => ({ ...link, indicator: byId.get(link.indicatorId) ?? null }))
    .filter((link) => link.indicator !== null)
    .sort(
      (a, b) =>
        Number(a.role === "affected") - Number(b.role === "affected") ||
        a.indicatorId.localeCompare(b.indicatorId),
    );
}

export async function getCascadeById(id: string): Promise<DbItemState<CascadeWithLinks>> {
  const state = await safeSingle(() =>
    database()!
      .select()
      .from(schema.cascades)
      .where(and(eq(schema.cascades.id, id), eq(schema.cascades.editorialStatus, PUBLISHED)))
      .limit(1),
  );
  if (!state.connected || !state.data) return state as DbItemState<CascadeWithLinks>;
  const [withSources] = await attachSources("cascade", [state.data]);
  const indicatorLinks = await attachIndicatorLinks(id);
  return { ...state, data: { ...withSources, indicatorLinks } };
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
  const typed = state.rows.filter((source) => source.itemType === itemType);
  return { data: await keepPublishedSources(typed), connected: true };
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

/** Vitalwerte des Gesamtstands: publizierte Indikatoren mit gesetztem headlineTier, nach Rang. */
export async function getHeadlineVitals() {
  const state = await safe(() =>
    database()!
      .select()
      .from(schema.indicators)
      .where(and(eq(schema.indicators.editorialStatus, PUBLISHED), isNotNull(schema.indicators.headlineTier)))
      .orderBy(asc(schema.indicators.headlineTier)),
  );
  return { ...state, rows: await attachSources("indicator", state.rows) };
}

/** Neuester publizierter Gesamtstand Deutschland. */
export async function getNationalState() {
  return safeSingle(() =>
    database()!
      .select()
      .from(schema.nationalState)
      .where(eq(schema.nationalState.editorialStatus, PUBLISHED))
      .orderBy(desc(schema.nationalState.standDate))
      .limit(1),
  );
}

export async function getSourceTrustLayer() {
  const state = await safe(() => database()!.select().from(schema.itemSources).orderBy(asc(schema.itemSources.sourceName)));
  const visible = await keepPublishedSources(state.rows);
  const byUrl = new Map<string, SourceRow & { citedItems: string[] }>();
  for (const source of visible) {
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

export type LagebildRow = WithSources<typeof schema.lagebildItems.$inferSelect>;

export type FrontDoorImpact = {
  kind: "cost" | "supply";
  id: string;
  bereich: string;
  titel: string;
  beschreibung: string;
  confidence: string;
  zeithorizont: string;
};

export type FrontDoorAction = {
  id: string;
  titel: string;
  beschreibung: string;
  aufwand: string;
};

export type SignalChain = {
  signal: LagebildRow;
  impact: FrontDoorImpact | null;
  action: FrontDoorAction | null;
};

/**
 * Verkettet Lagebild-Signale je zu Auswirkung (Kosten/Versorgung im selben Bereich)
 * und Maßnahme (Bürgeraktion mit Bereichsbezug). Join läuft über `bereich`, keine
 * neue Tabelle. Fehlt Auswirkung/Maßnahme, bleibt das Feld null (graceful degrade).
 * Sortiert nach Severity, dann steigender Trend zuerst. Ohne `limit`: alle Signale.
 */
export async function getSignalChains(limit?: number): Promise<DbState<SignalChain>> {
  const [lagebild, costs, supplies, actions] = await Promise.all([
    getLagebildItems(),
    getCostImpacts(),
    getSupplyRisks(),
    getCitizenActions(),
  ]);

  if (!lagebild.connected) {
    return { rows: [], connected: false, error: lagebild.error };
  }

  const sorted = [...lagebild.rows].sort(
    (a, b) =>
      severityValue(b.severity) - severityValue(a.severity) ||
      Number(isRising(b.trend)) - Number(isRising(a.trend)),
  );
  const signals = limit != null ? sorted.slice(0, limit) : sorted;

  const rows: SignalChain[] = signals.map((signal) => {
    const cost = costs.rows
      .filter((row) => row.bereich === signal.bereich)
      .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))[0];
    const supply = supplies.rows
      .filter((row) => row.bereich === signal.bereich)
      .sort((a, b) => severityValue(b.severity) - severityValue(a.severity))[0];

    let impact: FrontDoorImpact | null = null;
    if (cost) {
      impact = {
        kind: "cost",
        id: cost.id,
        bereich: cost.bereich,
        titel: cost.titel,
        beschreibung: cost.beschreibung,
        confidence: cost.confidence,
        zeithorizont: cost.zeithorizont,
      };
    } else if (supply) {
      impact = {
        kind: "supply",
        id: supply.id,
        bereich: supply.bereich,
        titel: supply.titel,
        beschreibung: supply.beschreibung,
        confidence: supply.confidence,
        zeithorizont: supply.zeithorizont,
      };
    }

    const action = actions.rows
      .filter((row) => Array.isArray(row.bezugZuBereich) && row.bezugZuBereich.includes(signal.bereich))
      .sort((a, b) => aufwandRank(a.aufwand) - aufwandRank(b.aufwand))[0];

    return {
      signal,
      impact,
      action: action
        ? { id: action.id, titel: action.titel, beschreibung: action.beschreibung, aufwand: action.aufwand }
        : null,
    };
  });

  return { rows, connected: true };
}

/** Eingangstür: nur Signalketten mit konkreter Haushaltsauswirkung. */
export async function getFrontDoorSignals(limit = 3): Promise<DbState<SignalChain>> {
  const state = await getSignalChains();
  return { ...state, rows: state.rows.filter((chain) => chain.impact !== null).slice(0, limit) };
}

export function describeLinks(links: Array<Record<string, unknown>> | null | undefined) {
  if (!links?.length) return [];
  return links.map((link) => Object.values(link).filter(Boolean).join(" → ")).filter(Boolean);
}
