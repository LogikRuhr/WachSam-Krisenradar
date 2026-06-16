import type { InferInsertModel } from "drizzle-orm";
import { nationalState } from "../schema";
import type { RevisionCriterion } from "../schema";
import data from "./source-data/national-state.json";

export type NewNationalState = InferInsertModel<typeof nationalState>;

export const NATIONAL_STATE: NewNationalState[] = data.states.map((item) => ({
  id: item.id,
  standDate: new Date(item.stand_date),
  overallTone: item.overall_tone as NewNationalState["overallTone"],
  executiveSummary: item.executive_summary,
  revisionCriteria: item.revision_criteria as RevisionCriterion[],
  gegentrends: item.gegentrends,
  editorialStatus: "draft",
  retrievedAt: new Date(data.meta.retrieved_at),
}));
