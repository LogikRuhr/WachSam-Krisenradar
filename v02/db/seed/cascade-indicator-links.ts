import type { InferInsertModel } from "drizzle-orm";
import { cascadeIndicatorLinks } from "../schema";
import type { RevisionCriterion } from "../schema";
import linkData from "./source-data/cascade-indicator-links.json";

export type NewCascadeIndicatorLink = InferInsertModel<typeof cascadeIndicatorLinks>;

type RawLink = (typeof linkData.links)[number] & {
  revision_criteria?: RevisionCriterion[] | null;
};

export const CASCADE_INDICATOR_LINKS: NewCascadeIndicatorLink[] = linkData.links.map((_item) => {
  const item = _item as RawLink;
  return {
    id: item.id,
    cascadeId: item.cascade_id,
    indicatorId: item.indicator_id,
    role: item.role as NewCascadeIndicatorLink["role"],
    relation: item.relation ?? null,
    lagHint: item.lag_hint ?? null,
    revisionCriteria: item.revision_criteria ?? null,
    retrievedAt: new Date(linkData.meta.retrieved_at),
  };
});
