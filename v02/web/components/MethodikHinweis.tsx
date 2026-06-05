import { DisclosureSection } from "./DisclosureSection";

type MethodikVariant = "lage" | "indikator";

const CONTENT: Record<MethodikVariant, { title: string; summary: string; body: React.ReactNode }> = {
  lage: {
    title: "Wie entsteht diese Einschätzung?",
    summary: "WachSam liest Entwicklungen in vier ruhigen Schritten — von der Quelle bis zu deinem Haushalt.",
    body: (
      <>
        <p><strong>1. Signal.</strong> Eine Entwicklung aus öffentlichen, benannten Quellen mit Stand-Datum.</p>
        <p><strong>2. Deutschland-Relevanz.</strong> Ob und wie stark die Entwicklung Deutschland betrifft.</p>
        <p><strong>3. Systembelastung.</strong> Welche Bereiche — etwa Energie, Versorgung oder Finanzen — unter Druck geraten.</p>
        <p><strong>4. Haushaltsauswirkung.</strong> Was im Alltag ankommen kann — immer mit Einschätzungssicherheit und Quellenstand, nie als sichere Vorhersage.</p>
      </>
    ),
  },
  indikator: {
    title: "Wie liest WachSam diesen Indikator?",
    summary: "Ein Frühwarnwert wird an Schwellenwerten eingeordnet — als Orientierung, nicht als Alarm.",
    body: (
      <>
        <p><strong>Wert und Stand.</strong> Der aktuelle Wert stammt aus einer benannten Quelle; das Stand-Datum zeigt, wann zuletzt abgefragt wurde.</p>
        <p><strong>Schwellenwerte.</strong> Die Stufen Warn und Kritisch markieren, ab wann ein Wert genauer zu beobachten ist.</p>
        <p><strong>Einordnung.</strong> Daraus ergibt sich eine ruhige Zone — unkritisch, erhöht oder kritisch — ohne Dramatisierung.</p>
        <p><strong>Unsicherheit bleibt sichtbar.</strong> Quellenlage und Datenqualität bestimmen, wie belastbar die Einordnung ist.</p>
      </>
    ),
  },
};

/**
 * Aufklappbarer Methodik-Hinweis. Erklärt ruhig und in eigener Sprache, wie WachSam
 * zu einer Einschätzung kommt. Nutzt das vorhandene Disclosure-Muster (tastaturbedienbar,
 * ohne Animation), keine neuen Datenfelder.
 */
export function MethodikHinweis({ variant = "lage" }: { variant?: MethodikVariant }) {
  const content = CONTENT[variant];
  return (
    <DisclosureSection number="?" title={content.title} summary={content.summary}>
      {content.body}
    </DisclosureSection>
  );
}
