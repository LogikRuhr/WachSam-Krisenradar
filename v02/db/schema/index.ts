import { relations, sql } from "drizzle-orm";
import { boolean, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const householdModusEnum = pgEnum("household_modus", ["single", "familie", "selbststaendig", "rentner"]);
export const heizartEnum = pgEnum("heizart", ["gas", "oel", "fernwaerme", "waermepumpe", "strom", "unbekannt"]);
export const confidenceEnum = pgEnum("confidence", ["niedrig", "mittel", "hoch"]);
export const severityEnum = pgEnum("severity", ["stabil", "beobachten", "erhoeht", "kritisch", "eskalierend"]);
export const zeithorizontEnum = pgEnum("zeithorizont", ["kurzfristig", "wochen", "monate", "langfristig"]);
export const methodologyTagEnum = pgEnum("methodology_tag", ["steep", "rca", "bia", "fmea", "scenario"]);
export const aufwandEnum = pgEnum("aufwand", ["niedrig", "mittel", "hoch"]);
export const itemSourceTypeEnum = pgEnum("item_source_type", [
  "lagebild",
  "cost",
  "supply",
  "cascade",
  "governance",
  "indicator",
  "action",
]);
export const editorialStatusEnum = pgEnum("editorial_status", ["draft", "approved", "rejected", "published"]);
export const userRoleEnum = pgEnum("user_role", ["viewer", "editor", "admin"]);
export const editorialActionEnum = pgEnum("editorial_action", [
  "create",
  "update",
  "approve",
  "reject",
  "publish",
  "unpublish",
  "ingest_value",
]);
export const sourceHealthStatusEnum = pgEnum("source_health_status", [
  "fresh",
  "stale",
  "error",
  "disabled",
  "unknown",
  "anomaly",
]);
export const evidenceType = pgEnum("evidence_type", ["fakt", "schaetzung", "annahme", "bewertung"]);
export const cascadeIndicatorRole = pgEnum("cascade_indicator_role", ["driver", "affected"]);
export const feedbackCategoryEnum = pgEnum("feedback_category", ["lob", "problem", "idee", "datenfehler", "sonstiges"]);

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
const retrievedAt = timestamp("retrieved_at", { withTimezone: true });
const editorialReviewedAt = timestamp("editorial_reviewed_at", { withTimezone: true });
const publishedAt = timestamp("published_at", { withTimezone: true });
const editorialStatus = editorialStatusEnum("editorial_status").notNull().default("published");
const editorialReviewedBy = text("editorial_reviewed_by");

export type RevisionCriterion = { indicatorId?: string; label: string; operator: ">" | "<" | ">=" | "<="; threshold: number; unit?: string };

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    name: text("name"),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("viewer"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (verificationToken) => [primaryKey({ columns: [verificationToken.identifier, verificationToken.token] })],
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [primaryKey({ columns: [authenticator.userId, authenticator.credentialID] })],
);

export const households = pgTable("households", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  modus: householdModusEnum("modus").notNull(),
  plz: text("plz").notNull(),
  heizart: heizartEnum("heizart").notNull().default("unbekannt"),
  createdAt,
  updatedAt,
});

export const userWatchlistItems = pgTable(
  "user_watchlist_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    itemId: text("item_id").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("user_watchlist_items_user_item_unique").on(table.userId, table.itemType, table.itemId)],
);

export const facts = pgTable("facts", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  valueLabel: text("value_label").notNull(),
  valueNumeric: numeric("value_numeric"),
  unit: text("unit"),
  period: text("period"),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceStand: text("source_stand").notNull(),
  evidenceType: evidenceType("evidence_type"),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const cascades = pgTable("cascades", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  trigger: text("trigger").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  severity: severityEnum("severity").notNull(),
  zeithorizont: zeithorizontEnum("zeithorizont").notNull(),
  methodologyTag: methodologyTagEnum("methodology_tag").notNull(),
  germanyRelevance: jsonb("germany_relevance").$type<Record<string, unknown>>().notNull(),
  steps: jsonb("steps").$type<Array<Record<string, unknown>>>().notNull(),
  haushaltswirkung: text("haushaltswirkung").notNull(),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const governance = pgTable("governance", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  versprechen: text("versprechen").notNull(),
  realitaet: text("realitaet").notNull(),
  haushaltswirkung: text("haushaltswirkung").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  linkedCascade: text("linked_cascade").references(() => cascades.id, { onDelete: "set null" }),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const indicators = pgTable("indicators", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  thresholdWarn: numeric("threshold_warn"),
  thresholdCritical: numeric("threshold_critical"),
  unit: text("unit"),
  system: text("system").notNull(),
  severityTrigger: severityEnum("severity_trigger").notNull(),
  quelle: text("quelle").notNull(),
  germanyRelevance: jsonb("germany_relevance").$type<Record<string, unknown>>().notNull(),
  linkedCascade: text("linked_cascade").references(() => cascades.id, { onDelete: "set null" }),

  // Live-Wert-Felder (Ingestion)
  currentValue: numeric("current_value"),
  currentValueDate: timestamp("current_value_date", { withTimezone: true }),
  previousValue: numeric("previous_value"),
  previousValueDate: timestamp("previous_value_date", { withTimezone: true }),
  lastIngestedAt: timestamp("last_ingested_at", { withTimezone: true }),

  // Skalen-Konfiguration
  scaleDirection: text("scale_direction").notNull().default("higher_is_worse"),

  // Redaktionelle Zonen-Texte
  zoneTextUncritical: text("zone_text_uncritical"),
  zoneTextElevated: text("zone_text_elevated"),
  zoneTextCritical: text("zone_text_critical"),

  // Einspeisungsperiode (z.B. Gasspeicher-Füllvorgabe)
  targetValue: numeric("target_value"),
  targetDeadline: timestamp("target_deadline", { withTimezone: true }),
  targetLabel: text("target_label"),

  // Schwellen-Herleitung / Referenzwerte
  baselineValue: numeric("baseline_value"),
  baselinePeriod: text("baseline_period"),
  baselineSourceName: text("baseline_source_name"),
  baselineSourceUrl: text("baseline_source_url"),
  crisisReferenceValue: numeric("crisis_reference_value"),
  crisisReferencePeriod: text("crisis_reference_period"),
  crisisReferenceSourceName: text("crisis_reference_source_name"),
  crisisReferenceSourceUrl: text("crisis_reference_source_url"),
  recentReferenceValue: numeric("recent_reference_value"),
  recentReferencePeriod: text("recent_reference_period"),
  recentReferenceSourceName: text("recent_reference_source_name"),
  recentReferenceSourceUrl: text("recent_reference_source_url"),
  thresholdMethod: text("threshold_method"),
  headlineTier: integer("headline_tier"),

  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const costImpacts = pgTable("cost_impacts", {
  id: text("id").primaryKey(),
  bereich: text("bereich").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung").notNull(),
  zeithorizont: zeithorizontEnum("zeithorizont").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  unsicherheit: text("unsicherheit").notNull(),
  causalLinks: jsonb("causal_links").$type<Array<Record<string, unknown>>>().notNull(),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const lagebildItems = pgTable("lagebild_items", {
  id: text("id").primaryKey(),
  bereich: text("bereich").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung").notNull(),
  severity: severityEnum("severity").notNull(),
  trend: text("trend").notNull(),
  primaerindikator: text("primaerindikator").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  factIds: jsonb("fact_ids").$type<string[]>().notNull(),
  evidenceType: evidenceType("evidence_type"),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const supplyRisks = pgTable("supply_risks", {
  id: text("id").primaryKey(),
  bereich: text("bereich").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung").notNull(),
  severity: severityEnum("severity").notNull(),
  zeithorizont: zeithorizontEnum("zeithorizont").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  unsicherheit: text("unsicherheit"),
  causalLinks: jsonb("causal_links")
    .$type<Array<Record<string, unknown>>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const citizenActions = pgTable("citizen_actions", {
  id: text("id").primaryKey(),
  bereich: text("bereich").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung").notNull(),
  aufwand: aufwandEnum("aufwand").notNull(),
  bezugZuBereich: jsonb("bezug_zu_bereich").$type<string[]>().notNull(),
  causalLinks: jsonb("causal_links")
    .$type<Array<Record<string, unknown>>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const itemSources = pgTable("item_sources", {
  id: text("id").primaryKey(),
  itemType: itemSourceTypeEnum("item_type").notNull(),
  itemId: text("item_id").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceStand: text("source_stand").notNull(),
  orderIdx: integer("order_idx").notNull().default(0),
  createdAt,
  updatedAt,
});

export const sources = pgTable(
  "sources",
  {
    id: text("id").primaryKey(),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url").notNull(),
    sourceStand: text("source_stand").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("sources_source_url_unique").on(table.sourceUrl)],
);

export const factRefs = pgTable("fact_refs", {
  id: text("id").primaryKey(),
  itemType: itemSourceTypeEnum("item_type").notNull(),
  itemId: text("item_id").notNull(),
  factId: text("fact_id")
    .notNull()
    .references(() => facts.id, { onDelete: "cascade" }),
  orderIdx: integer("order_idx").notNull().default(0),
  createdAt,
  updatedAt,
});

export const seedMeta = pgTable("seed_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt,
});

export const editorialAuditLog = pgTable("editorial_audit_log", {
  id: text("id").primaryKey(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  action: editorialActionEnum("action").notNull(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  fromStatus: editorialStatusEnum("from_status"),
  toStatus: editorialStatusEnum("to_status"),
  reason: text("reason"),
  createdAt,
});

export const usersRelations = relations(users, ({ many }) => ({
  households: many(households),
  watchlistItems: many(userWatchlistItems),
}));

export const householdsRelations = relations(households, ({ one }) => ({
  user: one(users, {
    fields: [households.userId],
    references: [users.id],
  }),
}));

export const userWatchlistItemsRelations = relations(userWatchlistItems, ({ one }) => ({
  user: one(users, {
    fields: [userWatchlistItems.userId],
    references: [users.id],
  }),
}));

export const cascadesRelations = relations(cascades, ({ many }) => ({
  governanceItems: many(governance),
  indicators: many(indicators),
  cascadeIndicatorLinks: many(cascadeIndicatorLinks),
}));

export const governanceRelations = relations(governance, ({ one }) => ({
  cascade: one(cascades, {
    fields: [governance.linkedCascade],
    references: [cascades.id],
  }),
}));

export const indicatorObservations = pgTable(
  "indicator_observations",
  {
    indicatorId: text("indicator_id")
      .notNull()
      .references(() => indicators.id, { onDelete: "cascade" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    value: numeric("value").notNull(),
    sourceStand: text("source_stand"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.indicatorId, table.observedAt] })],
);

export const sourceHealth = pgTable("source_health", {
  sourceId: text("source_id").primaryKey(),
  sourceName: text("source_name").notNull(),
  target: text("target").notNull(),
  status: sourceHealthStatusEnum("status").notNull().default("unknown"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).notNull(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  itemCount: integer("item_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  errorMessages: jsonb("error_messages").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt,
  updatedAt,
});

export const nationalState = pgTable("national_state", {
  id: text("id").primaryKey(),
  standDate: timestamp("stand_date", { withTimezone: true }).notNull(),
  overallTone: severityEnum("overall_tone").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  revisionCriteria: jsonb("revision_criteria").$type<RevisionCriterion[]>().notNull().default(sql`'[]'::jsonb`),
  gegentrends: jsonb("gegentrends").$type<string[]>(),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
});

export const cascadeIndicatorLinks = pgTable("cascade_indicator_links", {
  id: text("id").primaryKey(),
  cascadeId: text("cascade_id").notNull().references(() => cascades.id, { onDelete: "cascade" }),
  indicatorId: text("indicator_id").notNull().references(() => indicators.id, { onDelete: "cascade" }),
  role: cascadeIndicatorRole("role").notNull(),
  relation: text("relation"),
  lagHint: text("lag_hint"),
  revisionCriteria: jsonb("revision_criteria").$type<RevisionCriterion[]>(),
  retrievedAt,
  editorialStatus,
  editorialReviewedAt,
  editorialReviewedBy,
  publishedAt,
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex("cascade_indicator_links_unique").on(table.cascadeId, table.indicatorId, table.role)]);

export const indicatorsRelations = relations(indicators, ({ one, many }) => ({
  cascade: one(cascades, {
    fields: [indicators.linkedCascade],
    references: [cascades.id],
  }),
  observations: many(indicatorObservations),
  cascadeIndicatorLinks: many(cascadeIndicatorLinks),
}));

export const indicatorObservationsRelations = relations(indicatorObservations, ({ one }) => ({
  indicator: one(indicators, {
    fields: [indicatorObservations.indicatorId],
    references: [indicators.id],
  }),
}));

export const cascadeIndicatorLinksRelations = relations(cascadeIndicatorLinks, ({ one }) => ({
  cascade: one(cascades, {
    fields: [cascadeIndicatorLinks.cascadeId],
    references: [cascades.id],
  }),
  indicator: one(indicators, {
    fields: [cascadeIndicatorLinks.indicatorId],
    references: [indicators.id],
  }),
}));

/**
 * In-App-Feedback der Bürger:innen. Anonym erlaubt (userId nullable, set null
 * beim Löschen des Kontos); contactEmail rein freiwillig. Kein IP-/Tracking-Feld —
 * DSGVO-minimal. Auswertung über das Editorial-CMS (editor/admin).
 */
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  category: feedbackCategoryEnum("category").notNull().default("sonstiges"),
  message: text("message").notNull(),
  pagePath: text("page_path"),
  rating: integer("rating"),
  contactEmail: text("contact_email"),
  createdAt,
});

export const regionalWarnings = pgTable(
  "regional_warnings",
  {
    regionCode: text("region_code").notNull(),
    source: text("source").notNull().default("dwd"),
    warningCount: integer("warning_count").notNull(),
    maxLevel: integer("max_level").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.regionCode, table.source] })],
);
