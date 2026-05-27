import { z } from "zod";

const idField = z.string().min(1).max(120);
const slug = z.string().min(1).max(120);
const longText = z.string().min(1).max(4000);

const confidence = z.enum(["niedrig", "mittel", "hoch"]);
const severity = z.enum(["stabil", "beobachten", "erhoeht", "kritisch", "eskalierend"]);
const zeithorizont = z.enum(["kurzfristig", "wochen", "monate", "langfristig"]);
const methodologyTag = z.enum(["steep", "rca", "bia", "fmea", "scenario"]);
const aufwand = z.enum(["niedrig", "mittel", "hoch"]);

export const factSchema = z.object({
  id: idField,
  category: slug,
  valueLabel: longText,
  valueNumeric: z.string().optional().nullable(),
  unit: z.string().max(120).optional().nullable(),
  period: z.string().max(120).optional().nullable(),
  sourceName: z.string().min(1).max(240),
  sourceUrl: z.string().url(),
  sourceStand: z.string().min(1).max(120),
});

export const cascadeSchema = z.object({
  id: idField,
  title: longText,
  trigger: longText,
  confidence,
  severity,
  zeithorizont,
  methodologyTag,
  germanyRelevance: z.record(z.string(), z.unknown()),
  steps: z.array(z.record(z.string(), z.unknown())),
  haushaltswirkung: longText,
});

export const governanceSchema = z.object({
  id: idField,
  title: longText,
  versprechen: longText,
  realitaet: longText,
  haushaltswirkung: longText,
  confidence,
  linkedCascade: idField.optional().nullable(),
});

export const indicatorSchema = z.object({
  id: idField,
  label: longText,
  thresholdWarn: z.string().optional().nullable(),
  thresholdCritical: z.string().optional().nullable(),
  unit: z.string().max(120).optional().nullable(),
  system: slug,
  severityTrigger: severity,
  quelle: z.string().min(1).max(240),
  germanyRelevance: z.record(z.string(), z.unknown()),
  linkedCascade: idField.optional().nullable(),
});

export const costImpactSchema = z.object({
  id: idField,
  bereich: slug,
  titel: longText,
  beschreibung: longText,
  zeithorizont,
  confidence,
  unsicherheit: longText,
  causalLinks: z.array(z.record(z.string(), z.unknown())),
});

export const lagebildItemSchema = z.object({
  id: idField,
  bereich: slug,
  titel: longText,
  beschreibung: longText,
  severity,
  trend: z.string().min(1).max(120),
  primaerindikator: longText,
  confidence,
  factIds: z.array(idField),
});

export const supplyRiskSchema = z.object({
  id: idField,
  bereich: slug,
  titel: longText,
  beschreibung: longText,
  severity,
  zeithorizont,
  confidence,
  unsicherheit: z.string().max(4000).optional().nullable(),
  causalLinks: z.array(z.record(z.string(), z.unknown())),
});

export const citizenActionSchema = z.object({
  id: idField,
  bereich: slug,
  titel: longText,
  beschreibung: longText,
  aufwand,
  bezugZuBereich: z.array(slug),
  causalLinks: z.array(z.record(z.string(), z.unknown())),
});

export type FactInput = z.infer<typeof factSchema>;
export type CascadeInput = z.infer<typeof cascadeSchema>;
export type GovernanceInput = z.infer<typeof governanceSchema>;
export type IndicatorInput = z.infer<typeof indicatorSchema>;
export type CostImpactInput = z.infer<typeof costImpactSchema>;
export type LagebildItemInput = z.infer<typeof lagebildItemSchema>;
export type SupplyRiskInput = z.infer<typeof supplyRiskSchema>;
export type CitizenActionInput = z.infer<typeof citizenActionSchema>;

export const editorialItemTypes = [
  "facts",
  "cascades",
  "governance",
  "indicators",
  "costImpacts",
  "lagebildItems",
  "supplyRisks",
  "citizenActions",
] as const;

export type EditorialItemType = (typeof editorialItemTypes)[number];

export const rejectReasonSchema = z.object({
  reason: z.string().min(3).max(1000),
});
