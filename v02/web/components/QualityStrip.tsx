import { confidenceLabel } from "@/lib/personalization";
import type { SourceLike } from "./SourcePill";

type QualityStripProps = {
  sources?: SourceLike[];
  confidence?: string | null;
  stand?: string | null;
  context?: string;
};

export function QualityStrip({ sources, confidence, stand, context = "Einordnung" }: QualityStripProps) {
  const sourceCount = sources?.length ?? 0;
  const confidenceText = confidence ? confidenceLabel(confidence) : "redaktionell offen";

  return (
    <div className="quality-strip" aria-label={`${context}: Quellen, Sicherheit und Datenstand`}>
      <span>
        <strong>{sourceCount > 0 ? sourceCount : "–"}</strong>
        Quellen
      </span>
      <span>
        <strong>{confidenceText}</strong>
        Sicherheit
      </span>
      <span>
        <strong>{stand ?? "kein Stand"}</strong>
        Datenstand
      </span>
    </div>
  );
}
