import type { InferInsertModel } from "drizzle-orm";
import { costImpacts } from "../schema";
import { dateOrNull } from "./_helpers";
import costData from "./source-data/costImpacts.json";

export type NewCostImpact = InferInsertModel<typeof costImpacts>;

export const COST_IMPACTS: NewCostImpact[] = costData.map((item) => ({
  id: item.id,
  bereich: item.bereich,
  titel: item.titel,
  beschreibung: item.beschreibung,
  zeithorizont: item.zeithorizont,
  confidence: item.confidence,
  unsicherheit: item.unsicherheit,
  causalLinks: item.causalLinks ?? [],
  retrievedAt: dateOrNull(item.retrieved_at),
}));
