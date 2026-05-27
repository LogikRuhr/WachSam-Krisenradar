import type { InferInsertModel } from "drizzle-orm";
import { cascades } from "../schema";
import cascadeData from "./source-data/cascades.json";

export type NewCascade = InferInsertModel<typeof cascades>;

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
}));
