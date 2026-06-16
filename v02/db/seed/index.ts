import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import { CITIZEN_ACTIONS } from "./actions";
import { CASCADES } from "./cascades";
import { CASCADE_INDICATOR_LINKS } from "./cascade-indicator-links";
import { COST_IMPACTS } from "./cost-impacts";
import { FACT_REFS } from "./fact-refs";
import { FACTS } from "./facts";
import { GOVERNANCE_ITEMS } from "./governance";
import { INDICATORS } from "./indicators";
import { ITEM_SOURCES } from "./item-sources";
import { LAGEBILD_ITEMS } from "./lagebild";
import { NATIONAL_STATE } from "./national-state";
import { SEED_META } from "./seed-meta";
import { SOURCES } from "./sources";
import { SUPPLY_RISKS } from "./supply-risks";

export const seedData = {
  facts: FACTS,
  factRefs: FACT_REFS,
  cascades: CASCADES,
  cascadeIndicatorLinks: CASCADE_INDICATOR_LINKS,
  governance: GOVERNANCE_ITEMS,
  indicators: INDICATORS,
  costImpacts: COST_IMPACTS,
  lagebildItems: LAGEBILD_ITEMS,
  nationalState: NATIONAL_STATE,
  supplyRisks: SUPPLY_RISKS,
  citizenActions: CITIZEN_ACTIONS,
  itemSources: ITEM_SOURCES,
  sources: SOURCES,
  seedMeta: SEED_META,
};

export type SeedStats = Record<keyof typeof seedData, number>;

export const getSeedStats = (): SeedStats => ({
  facts: FACTS.length,
  factRefs: FACT_REFS.length,
  cascades: CASCADES.length,
  cascadeIndicatorLinks: CASCADE_INDICATOR_LINKS.length,
  governance: GOVERNANCE_ITEMS.length,
  indicators: INDICATORS.length,
  costImpacts: COST_IMPACTS.length,
  lagebildItems: LAGEBILD_ITEMS.length,
  nationalState: NATIONAL_STATE.length,
  supplyRisks: SUPPLY_RISKS.length,
  citizenActions: CITIZEN_ACTIONS.length,
  itemSources: ITEM_SOURCES.length,
  sources: SOURCES.length,
  seedMeta: SEED_META.length,
});

const assertUnique = (label: string, ids: readonly string[]): string[] => {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  }).map((id) => `${label}: doppelte ID ${id}`);
};

export const validateSeedData = (): string[] => {
  const errors: string[] = [];
  const factIds = new Set(FACTS.map((fact) => fact.id));
  const cascadeIds = new Set(CASCADES.map((cascade) => cascade.id));
  const indicatorIds = new Set(INDICATORS.map((indicator) => indicator.id));

  errors.push(...assertUnique("facts", FACTS.map((item) => item.id)));
  errors.push(...assertUnique("fact_refs", FACT_REFS.map((item) => item.id)));
  errors.push(...assertUnique("cascades", CASCADES.map((item) => item.id)));
  errors.push(...assertUnique("cascade_indicator_links", CASCADE_INDICATOR_LINKS.map((item) => item.id)));
  errors.push(...assertUnique("governance", GOVERNANCE_ITEMS.map((item) => item.id)));
  errors.push(...assertUnique("indicators", INDICATORS.map((item) => item.id)));
  errors.push(...assertUnique("cost_impacts", COST_IMPACTS.map((item) => item.id)));
  errors.push(...assertUnique("lagebild_items", LAGEBILD_ITEMS.map((item) => item.id)));
  errors.push(...assertUnique("national_state", NATIONAL_STATE.map((item) => item.id)));
  errors.push(...assertUnique("supply_risks", SUPPLY_RISKS.map((item) => item.id)));
  errors.push(...assertUnique("citizen_actions", CITIZEN_ACTIONS.map((item) => item.id)));
  errors.push(...assertUnique("item_sources", ITEM_SOURCES.map((item) => item.id)));
  errors.push(...assertUnique("sources", SOURCES.map((item) => item.id)));
  errors.push(...assertUnique("sources.url", SOURCES.map((item) => item.sourceUrl)));
  errors.push(...assertUnique("seed_meta", SEED_META.map((item) => item.key)));

  for (const item of LAGEBILD_ITEMS) {
    for (const factId of item.factIds) {
      if (!factIds.has(factId)) errors.push(`lagebild_items.${item.id}: unbekannte factId ${factId}`);
    }
  }

  for (const item of FACT_REFS) {
    if (!factIds.has(item.factId)) errors.push(`fact_refs.${item.id}: unbekannte factId ${item.factId}`);
  }

  for (const item of GOVERNANCE_ITEMS) {
    if (item.linkedCascade && !cascadeIds.has(item.linkedCascade)) {
      errors.push(`governance.${item.id}: unbekannte linkedCascade ${item.linkedCascade}`);
    }
  }

  for (const item of INDICATORS) {
    if (item.linkedCascade && !cascadeIds.has(item.linkedCascade)) {
      errors.push(`indicators.${item.id}: unbekannte linkedCascade ${item.linkedCascade}`);
    }
  }

  for (const item of CASCADE_INDICATOR_LINKS) {
    if (!cascadeIds.has(item.cascadeId)) {
      errors.push(`cascade_indicator_links.${item.id}: unbekannte cascadeId ${item.cascadeId}`);
    }
    if (!indicatorIds.has(item.indicatorId)) {
      errors.push(`cascade_indicator_links.${item.id}: unbekannte indicatorId ${item.indicatorId}`);
    }
  }

  return errors;
};

type Db = PostgresJsDatabase<typeof schema>;

export const connectDatabase = (databaseUrl: string): { db: Db; close: () => Promise<void> } => {
  const client = postgres(databaseUrl, { max: 1 });
  return { db: drizzle(client, { schema }), close: () => client.end() };
};

export const seedDatabase = async (db: Db): Promise<SeedStats> => {
  const now = new Date();

  for (const row of FACTS) {
    await db.insert(schema.facts).values(row).onConflictDoUpdate({
      target: schema.facts.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of FACT_REFS) {
    await db.insert(schema.factRefs).values(row).onConflictDoUpdate({
      target: schema.factRefs.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of CASCADES) {
    await db.insert(schema.cascades).values(row).onConflictDoUpdate({
      target: schema.cascades.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of GOVERNANCE_ITEMS) {
    await db.insert(schema.governance).values(row).onConflictDoUpdate({
      target: schema.governance.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of INDICATORS) {
    await db.insert(schema.indicators).values(row).onConflictDoUpdate({
      target: schema.indicators.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of CASCADE_INDICATOR_LINKS) {
    await db.insert(schema.cascadeIndicatorLinks).values(row).onConflictDoUpdate({
      target: schema.cascadeIndicatorLinks.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of NATIONAL_STATE) {
    await db.insert(schema.nationalState).values(row).onConflictDoUpdate({
      target: schema.nationalState.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of COST_IMPACTS) {
    await db.insert(schema.costImpacts).values(row).onConflictDoUpdate({
      target: schema.costImpacts.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of LAGEBILD_ITEMS) {
    await db.insert(schema.lagebildItems).values(row).onConflictDoUpdate({
      target: schema.lagebildItems.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of SUPPLY_RISKS) {
    await db.insert(schema.supplyRisks).values(row).onConflictDoUpdate({
      target: schema.supplyRisks.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of CITIZEN_ACTIONS) {
    await db.insert(schema.citizenActions).values(row).onConflictDoUpdate({
      target: schema.citizenActions.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of ITEM_SOURCES) {
    await db.insert(schema.itemSources).values(row).onConflictDoUpdate({
      target: schema.itemSources.id,
      set: { ...row, updatedAt: now },
    });
  }

  for (const row of SOURCES) {
    await db.insert(schema.sources).values(row).onConflictDoUpdate({
      target: schema.sources.sourceUrl,
      set: {
        sourceName: row.sourceName,
        sourceStand: row.sourceStand,
        updatedAt: now,
      },
    });
  }

  for (const row of SEED_META) {
    await db.insert(schema.seedMeta).values(row).onConflictDoUpdate({
      target: schema.seedMeta.key,
      set: { value: row.value, updatedAt: now },
    });
  }

  return getSeedStats();
};
