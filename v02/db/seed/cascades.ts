import type { InferInsertModel } from "drizzle-orm";
import { cascades } from "../schema";
import cascadeData from "./source-data/cascades.json";

export type NewCascade = InferInsertModel<typeof cascades>;

const W6_DRAFT_CASCADE_IDS = new Set([
  "cascade-m", "cascade-n", "cascade-o", "cascade-p", "cascade-q", "cascade-r", "cascade-s",
]);

export const CASCADES: NewCascade[] = cascadeData.cascades.map((item) => ({
  id: item.id,
  title: item.title,
  trigger: item.trigger,
  confidence: item.confidence,
  severity: item.severity,
  zeithorizont: item.zeithorizont,
  methodologyTag: item.methodology_tag,
  germanyRelevance: item.germany_relevance,
  steps: item.steps,
  haushaltswirkung: item.haushaltswirkung,
  retrievedAt: new Date(cascadeData.meta.retrieved_at),
  ...(W6_DRAFT_CASCADE_IDS.has(item.id) ? { editorialStatus: "draft" as const } : {}),
}));
