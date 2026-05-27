import type { InferInsertModel } from "drizzle-orm";
import { supplyRisks } from "../schema";
import { SUPPLY_RISKS as sourceSupplyRisks } from "./source-data/supply-risks";

export type NewSupplyRisk = InferInsertModel<typeof supplyRisks>;

export const SUPPLY_RISKS: NewSupplyRisk[] = sourceSupplyRisks.map((item) => ({
  id: item.id,
  bereich: item.bereich,
  titel: item.titel,
  beschreibung: item.beschreibung,
  severity: item.schweregrad,
  zeithorizont: item.zeithorizont,
  confidence: item.confidence,
  unsicherheit: item.unsicherheit,
  causalLinks: item.causalLinks ?? [],
}));
