// Reine Funktionen für die redaktionelle Sichtbarkeit — keine DB, keine
// Server-Abhängigkeit. Zentralisiert deutsche Editorial-/Audit-Labels und ruhige
// Erklärungen, damit Status, Prüfstand und Audit-Verlauf nachvollziehbar werden.
// Nutzt ausschließlich bereits vorhandene Felder; keine neue Statuslogik.

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  published: "Publiziert",
};

const ACTION_LABEL: Record<string, string> = {
  create: "Erstellt",
  update: "Aktualisiert",
  approve: "Freigegeben",
  reject: "Abgelehnt",
  publish: "Publiziert",
  unpublish: "Zurückgezogen",
  ingest_value: "Wert aktualisiert",
};

const STATUS_EXPLAIN: Record<string, string> = {
  draft: "Entwurf — noch nicht redaktionell geprüft und nicht öffentlich sichtbar.",
  approved: "Redaktionell freigegeben, aber noch nicht publiziert — noch nicht öffentlich.",
  rejected: "Abgelehnt — mit Begründung zurück in die Bearbeitung, nicht öffentlich.",
  published: "Öffentlich sichtbar — nur dieser Status passiert das Public-UI-Gate.",
};

const STATUS_EXPLAIN_FALLBACK =
  "Redaktioneller Status dieses Eintrags. Öffentlich sichtbar ist ausschließlich der Status Publiziert.";

/** Deutsches Label für einen Editorial-Status; unbekannte Werte bleiben roh, null → „—". */
export function editorialStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS_LABEL[status] ?? status;
}

/** Deutsches Label für eine Audit-Action; unbekannte Werte bleiben roh, null → „—". */
export function editorialActionLabel(action: string | null | undefined): string {
  if (!action) return "—";
  return ACTION_LABEL[action] ?? action;
}

/** Ruhige Klartext-Erklärung, was ein Status praktisch bedeutet; nie leer. */
export function editorialStatusExplain(status: string | null | undefined): string {
  if (!status) return STATUS_EXPLAIN_FALLBACK;
  return STATUS_EXPLAIN[status] ?? STATUS_EXPLAIN_FALLBACK;
}

/**
 * Lesbare Ein-Satz-Zusammenfassung eines Audit-Events: „Aktion: von → zu".
 * Ohne von-Status entfällt der linke Teil; ohne Übergang bleibt nur die Aktion.
 */
export function auditTransitionSummary(event: {
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
}): string {
  const action = editorialActionLabel(event.action);
  if (event.toStatus) {
    const to = editorialStatusLabel(event.toStatus);
    if (event.fromStatus) return `${action}: ${editorialStatusLabel(event.fromStatus)} → ${to}`;
    return `${action}: → ${to}`;
  }
  return action;
}
