import { confidenceLabel } from "@/lib/personalization";
import { DisclosureSection } from "./DisclosureSection";
import type { SourceLike } from "./SourcePill";

type CardMethodologyVariant = "lage" | "kosten";

type CardMethodologyProps = {
  variant: CardMethodologyVariant;
  sources?: SourceLike[];
  confidence?: string | null;
  stand?: string | null;
};

const COPY: Record<CardMethodologyVariant, { title: string; summary: string; focus: string }> = {
  lage: {
    title: "Wie entsteht diese Einschätzung?",
    summary: "WachSam trennt Entwicklung, Haushaltsauswirkung, Quellenlage und Unsicherheit.",
    focus: "Diese Lagekarte beginnt mit einem redaktionell geprüften Signal und ordnet anschließend ein, ob daraus eine realistische Haushaltsauswirkung entstehen kann.",
  },
  kosten: {
    title: "Wie entsteht diese Kosteneinschätzung?",
    summary: "Kostenkarten zeigen mögliche Belastungen, keine sichere Prognose.",
    focus: "Diese Kostenkarte verbindet einen Bereich, ein Zeitfenster und die dokumentierte Unsicherheit mit den verfügbaren Quellen.",
  },
};

export function CardMethodology({ variant, sources, confidence, stand }: CardMethodologyProps) {
  const copy = COPY[variant];
  const sourceCount = sources?.length ?? 0;
  const confidenceText = confidence ? confidenceLabel(confidence) : "redaktionell offen";

  return (
    <div className="card-methodology">
      <DisclosureSection number="?" title={copy.title} summary={copy.summary}>
        <p>{copy.focus}</p>
        <p>
          <strong>Quellenlage:</strong> {sourceCount > 0 ? `${sourceCount} benannte Quelle${sourceCount === 1 ? "" : "n"}` : "noch keine Quelle verbunden"}.
        </p>
        <p>
          <strong>Einschätzungssicherheit:</strong> {confidenceText}. Die Stufe beschreibt, wie belastbar die Einordnung aktuell ist — nicht, ob ein Ereignis sicher eintritt.
        </p>
        <p>
          <strong>Datenstand:</strong> {stand ?? "kein Stand hinterlegt"}. WachSam zeigt Aktualität sichtbar und vermeidet Fake-Live-Signale.
        </p>
      </DisclosureSection>
    </div>
  );
}
