import type { InferInsertModel } from "drizzle-orm";
import { indicators } from "../schema";
import indicatorData from "./source-data/warning-indicators.json";

export type NewIndicator = InferInsertModel<typeof indicators>;

// The JSON has new optional fields that TypeScript's inferred type doesn't cover yet.
// We cast each item to access them safely.
type RawIndicator = (typeof indicatorData.indicators)[number] & {
  scale_direction?: string;
  zone_text_uncritical?: string;
  zone_text_elevated?: string;
  zone_text_critical?: string;
  target_value?: number;
  target_deadline?: string;
  target_label?: string;
};

export const INDICATORS: NewIndicator[] = indicatorData.indicators.map((_item) => {
  const item = _item as RawIndicator;
  return {
    id: item.id,
    label: item.label,
    thresholdWarn: String(item.threshold_warn),
    thresholdCritical: String(item.threshold_critical),
    unit: item.unit,
    system: item.system,
    severityTrigger: item.severity_trigger,
    quelle: item.quelle,
    germanyRelevance: { description: item.germany_relevance },
    linkedCascade: item.linked_cascade ?? null,
    scaleDirection: item.scale_direction ?? "higher_is_worse",
    zoneTextUncritical: item.zone_text_uncritical ?? null,
    zoneTextElevated: item.zone_text_elevated ?? null,
    zoneTextCritical: item.zone_text_critical ?? null,
    targetValue: item.target_value != null ? String(item.target_value) : null,
    targetDeadline: item.target_deadline ? new Date(item.target_deadline) : null,
    targetLabel: item.target_label ?? null,
  };
});
