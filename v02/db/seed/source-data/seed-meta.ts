/**
 * Meta-Information zum Seed-Datensatz.
 * Wird oben auf der Homepage als Banner angezeigt, damit kein Item
 * fälschlich als Live-Messwert verstanden wird.
 */

export const SEED_META = {
  marker: 'INITIAL CONTROLLED SEED DATA',
  stand: '12. Mai 2026',
  hinweis:
    'Die Inhalte sind ein kontrollierter Beispiel-Datensatz, der die WachSam-Methodik demonstriert. ' +
    'Die genannten Quellen existieren real, die Zahlen sind Stand der Recherche und werden in v0.1 ' +
    'nicht live aktualisiert. Diese Version zeigt, wie WachSam Krisen in Haushaltsauswirkungen übersetzt — ' +
    'sie ist kein Echtzeit-Frühwarnsystem.',
  produktkern:
    'WachSam analysiert globale Krisen, Kaskaden und Systemrisiken und bewertet deren mögliche ' +
    'Auswirkungen auf Kosten, Versorgung und Stabilität deutscher Haushalte.',
} as const;
