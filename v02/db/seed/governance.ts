import type { InferInsertModel } from "drizzle-orm";
import { governance } from "../schema";
import governanceData from "./source-data/governance.json";

export type NewGovernance = InferInsertModel<typeof governance>;

export const GOVERNANCE_ITEMS: NewGovernance[] = governanceData.items.map((item) => ({
  id: item.id,
  title: item.title,
  versprechen: item.versprechen,
  realitaet: item.realitaet,
  haushaltswirkung: item.haushaltswirkung,
  confidence: item.confidence,
  linkedCascade: item.linked_cascade ?? null,
}));
