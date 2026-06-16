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
  baseline_value?: number;
  baseline_period?: string;
  baseline_source_name?: string;
  baseline_source_url?: string;
  crisis_reference_value?: number;
  crisis_reference_period?: string;
  crisis_reference_source_name?: string;
  crisis_reference_source_url?: string;
  recent_reference_value?: number;
  recent_reference_period?: string;
  recent_reference_source_name?: string;
  recent_reference_source_url?: string;
  threshold_method?: string;
  headline_tier?: number;
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
    baselineValue: item.baseline_value != null ? String(item.baseline_value) : null,
    baselinePeriod: item.baseline_period ?? null,
    baselineSourceName: item.baseline_source_name ?? null,
    baselineSourceUrl: item.baseline_source_url ?? null,
    crisisReferenceValue: item.crisis_reference_value != null ? String(item.crisis_reference_value) : null,
    crisisReferencePeriod: item.crisis_reference_period ?? null,
    crisisReferenceSourceName: item.crisis_reference_source_name ?? null,
    crisisReferenceSourceUrl: item.crisis_reference_source_url ?? null,
    recentReferenceValue: item.recent_reference_value != null ? String(item.recent_reference_value) : null,
    recentReferencePeriod: item.recent_reference_period ?? null,
    recentReferenceSourceName: item.recent_reference_source_name ?? null,
    recentReferenceSourceUrl: item.recent_reference_source_url ?? null,
    thresholdMethod: item.threshold_method ?? null,
    headlineTier: item.headline_tier ?? null,
  };
});
