import { confidenceExplain, confidenceLabel } from "@/lib/personalization";

export function ConfidenceBadge({ value }: { value?: string | null }) {
  const key = value ?? "niedrig";
  return (
    <span className={`confidence-badge confidence-${key}`} title={confidenceExplain(key)}>
      {confidenceLabel(key)}
    </span>
  );
}
