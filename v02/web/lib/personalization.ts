import type { HouseholdHeizart, HouseholdModus } from "./profile";

// Reine Funktionen — keine DB, keine Server-Abhängigkeit. Testbar in Isolation.

const SEVERITY_RANK: Record<string, number> = {
  stabil: 1,
  beobachten: 2,
  erhoeht: 3,
  kritisch: 4,
  eskalierend: 5,
};

const AUFWAND_RANK: Record<string, number> = { niedrig: 1, mittel: 2, hoch: 3 };
const CONFIDENCE_RANK: Record<string, number> = { niedrig: 1, mittel: 2, hoch: 3 };

const AUFWAND_LABEL: Record<string, string> = { niedrig: "Niedrig", mittel: "Mittel", hoch: "Hoch" };

export const BEREICH_LABEL: Record<string, string> = {
  energie: "Energie",
  lebensmittel: "Lebensmittel",
  mobilitaet: "Mobilität",
  gesundheit: "Gesundheit",
  infrastruktur: "Infrastruktur",
  industrie: "Industrie",
  logistik: "Logistik",
  finanzen: "Finanzen",
  arbeit: "Arbeit",
  gesellschaft: "Gesellschaft",
};

export function severityRank(severity: string): number {
  return SEVERITY_RANK[severity] ?? 0;
}

export function aufwandRank(aufwand: string): number {
  return AUFWAND_RANK[aufwand] ?? 99;
}

/** Deutsche Anzeige für den Aufwand-Slug; unbekannte Werte bleiben unverändert (nie leer). */
export function aufwandLabel(aufwand: string): string {
  return AUFWAND_LABEL[aufwand] ?? aufwand;
}

export function confidenceRank(confidence: string): number {
  return CONFIDENCE_RANK[confidence] ?? 0;
}

const CONFIDENCE_EXPLAIN: Record<string, string> = {
  niedrig:
    "Wenige oder noch unsichere Quellen. Eher ein erster Hinweis als ein belastbares Bild — bitte mit Vorsicht lesen.",
  mittel:
    "Mehrere Quellen deuten in eine Richtung, einzelne Fragen bleiben offen. Die Einordnung ist plausibel, Details können sich noch ändern.",
  hoch:
    "Mehrere belastbare Quellen stützen die Einordnung. Größere Überraschungen sind weniger wahrscheinlich, sicher ist sie trotzdem nicht.",
};

const CONFIDENCE_EXPLAIN_FALLBACK =
  "Wie belastbar die Einschätzung ist, hängt von Quellenlage, Datenqualität und Unsicherheit ab.";

/** Einheitliches Label für die Einschätzungssicherheit; nie leer. */
export function confidenceLabel(confidence: string): string {
  return `Einschätzungssicherheit: ${confidence}`;
}

/** Ruhige Klartext-Erklärung, was eine Confidence-Stufe praktisch bedeutet. */
export function confidenceExplain(confidence: string | null | undefined): string {
  if (!confidence) return CONFIDENCE_EXPLAIN_FALLBACK;
  return CONFIDENCE_EXPLAIN[confidence] ?? CONFIDENCE_EXPLAIN_FALLBACK;
}

export function isRising(trend: string): boolean {
  return trend === "steigend" || trend === "eskalierend";
}

export function bereichLabel(bereich: string): string {
  return BEREICH_LABEL[bereich] ?? bereich;
}

/**
 * Label für Systembereiche in Wirkungsketten. Bewusst dieselbe Quelle wie
 * bereichLabel, damit Karten und Kaskaden nicht auseinanderdriften.
 */
export function systemLabel(system: string): string {
  return bereichLabel(system);
}

export function trendLabel(trend: string): string {
  if (trend === "steigend") return "steigt";
  if (trend === "eskalierend") return "eskaliert";
  if (trend === "gleichbleibend") return "stabil";
  return trend;
}

// --- Verdikt -----------------------------------------------------------------

export type VerdictTone = "ruhig" | "beobachten" | "angespannt" | "ernst";
export type Verdict = { tone: VerdictTone; text: string };

type VerdictItem = { severity: string; bereich: string; trend: string };

/** Ein-Satz-Verdikt aus der Severity-Verteilung. Sachlich, nicht alarmistisch. */
export function computeVerdict(items: VerdictItem[]): Verdict {
  if (items.length === 0) {
    return { tone: "ruhig", text: "Aktuell liegen keine bewerteten Signale vor." };
  }

  const sorted = [...items].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity) || Number(isRising(b.trend)) - Number(isRising(a.trend)),
  );
  const maxRank = severityRank(sorted[0].severity);
  const drivers = sorted
    .slice(0, 2)
    .map((item) => bereichLabel(item.bereich))
    .filter((value, index, all) => all.indexOf(value) === index);
  const driverText = drivers.join(" & ");

  if (maxRank >= 5) {
    return { tone: "ernst", text: `Aktuell ernst: ${driverText} eskalieren. Hinweise beachten.` };
  }
  if (maxRank === 4) {
    return { tone: "angespannt", text: `Aktuell angespannt: ${driverText} unter Druck — kein akuter Notfall.` };
  }
  if (maxRank === 3) {
    return { tone: "beobachten", text: `Leicht erhöht: ${driverText} beobachten.` };
  }
  return { tone: "ruhig", text: "Aktuell ruhig: keine erhöhten Belastungen." };
}

// --- "Für dich"-Notiz --------------------------------------------------------

const MODUS_LEAD: Record<HouseholdModus, string> = {
  single: "Für dich als Single sind besonders Kosten- und Versorgungsfolgen ohne geteilte Haushaltslast spürbar.",
  familie: "Für deine Familie zählt, welche Signale Alltag, Planung und gemeinsame Haushaltskosten berühren.",
  selbststaendig: "Für dich als Selbstständige(n) greifen Haushalts- und Arbeitsrisiken oft ineinander.",
  rentner: "Für dich zählen planbare Kosten, verlässliche Versorgung und stabile Routinen.",
};

const HEIZART_ENERGY_NOTE: Record<HouseholdHeizart, string | null> = {
  gas: "Du heizt mit Gas: Gaspreis und Speicherstand treffen dich diesen Winter direkt.",
  oel: "Du heizt mit Öl: Der Heizölpreis (Brent-gekoppelt) ist für dich der zentrale Hebel.",
  fernwaerme: "Du beziehst Fernwärme: Energiepreise wirken zeitverzögert über deinen Versorger.",
  waermepumpe: "Du heizt mit Wärmepumpe: Der Strompreis ist für dich der entscheidende Faktor.",
  strom: "Du heizt elektrisch: Der Strompreis ist für dich der entscheidende Faktor.",
  unbekannt: null,
};

/**
 * Bereichs- UND modusabhängige "Für dich"-Einordnung für die zentralen
 * Haushaltsbereiche. Damit zeigen mehrere Nicht-Energie-Signalkarten nicht
 * denselben generischen Modus-Satz, sondern je Bereich eine passende Betonung.
 * Reine Betonung — verändert nie die Fakten. Bereiche ohne Eintrag fallen
 * ruhig auf modusLead zurück.
 */
const BEREICH_MODUS_NOTE: Record<string, Record<HouseholdModus, string>> = {
  lebensmittel: {
    single: "Als Single triffst du Lebensmittelpreise vor allem bei kleineren Mengen — wenig Puffer, schnell spürbar.",
    familie: "Für eine Familie summieren sich Lebensmittelpreise im Wocheneinkauf besonders deutlich.",
    selbststaendig: "Als Selbstständige(r) gehen schwankende Lebensmittelpreise zusätzlich in deine Alltagskalkulation ein.",
    rentner: "Bei festem Budget machen sich Lebensmittelpreise im Alltag besonders bemerkbar.",
  },
  mobilitaet: {
    single: "Als Single hängt deine Mobilität oft an einzelnen Wegen — Sprit- und Ticketpreise wirken direkt.",
    familie: "Für eine Familie summieren sich Mobilitätskosten über mehrere Wege und Personen.",
    selbststaendig: "Als Selbstständige(r) wirken Mobilitäts- und Spritkosten unmittelbar auf deine Betriebskosten.",
    rentner: "Für dich zählen bei Mobilität planbare, verlässliche Wege ohne Kostensprünge.",
  },
  finanzen: {
    single: "Als Single trägst du Finanzbelastungen ohne geteilten Haushalt allein — Veränderungen wirken direkt.",
    familie: "Für eine Familie berühren Finanzsignale Planung, Rücklagen und gemeinsame Fixkosten zugleich.",
    selbststaendig: "Als Selbstständige(r) greifen private und betriebliche Finanzen ineinander — Zinsen und Preise doppelt spürbar.",
    rentner: "Für dich zählen bei Finanzthemen planbare, stabile Belastungen statt kurzfristiger Schwankungen.",
  },
};

export function modusLead(modus: HouseholdModus | null): string | null {
  return modus ? MODUS_LEAD[modus] : null;
}

/**
 * "Für dich"-Satz pro Signal. Reihenfolge: Energie-Signale folgen der Heizart;
 * zentrale Haushaltsbereiche (Lebensmittel, Mobilität, Finanzen) bekommen eine
 * bereichs- und modusabhängige Betonung; sonst der generische Modus-Lead.
 * Verändert nur die Betonung, nie die Fakten.
 */
export function personalNote(
  bereich: string,
  profile: { modus: HouseholdModus | null; heizart: HouseholdHeizart | null },
): string | null {
  if (bereich === "energie" && profile.heizart) {
    const note = HEIZART_ENERGY_NOTE[profile.heizart];
    if (note) return note;
  }
  if (profile.modus) {
    const bereichNote = BEREICH_MODUS_NOTE[bereich]?.[profile.modus];
    if (bereichNote) return bereichNote;
  }
  return modusLead(profile.modus);
}

// --- Member-Bereich: Profilstatus & Relevanz ---------------------------------

export type ProfileField = { key: "modus" | "plz" | "heizart"; label: string; set: boolean };
export type ProfileCompleteness = { filled: number; total: number; fields: ProfileField[] };

/**
 * Ehrliche Vollständigkeit des Haushaltsprofils. "unbekannt"/leer zählt nicht als
 * gesetzt — damit der Member-Bereich ruhig erklären kann, was noch fehlt.
 */
export function profileCompleteness(profile: {
  modus: HouseholdModus | null;
  plz: string | null;
  heizart: HouseholdHeizart | null;
}): ProfileCompleteness {
  const fields: ProfileField[] = [
    { key: "modus", label: "Haushaltsmodus", set: profile.modus != null },
    { key: "plz", label: "Postleitzahl", set: profile.plz != null && profile.plz.trim() !== "" },
    { key: "heizart", label: "Heizart", set: profile.heizart != null && profile.heizart !== "unbekannt" },
  ];
  return { filled: fields.filter((field) => field.set).length, total: fields.length, fields };
}

/** Bereiche, die für dieses Profil besonders relevant sind. Bewusst eng gehalten. */
export function profileRelevantBereiche(profile: { heizart: HouseholdHeizart | null }): string[] {
  if (profile.heizart && profile.heizart !== "unbekannt") return ["energie"];
  return [];
}

// Bereiche, die ein privater Haushalt direkt im Alltag spürt (vs. vorgelagerte
// Bereiche wie Industrie/Logistik/Infrastruktur). Quelle der Haushaltsrelevanz.
const HOUSEHOLD_CORE_BEREICHE = new Set(["energie", "lebensmittel", "mobilitaet", "finanzen", "gesundheit"]);

/**
 * Haushaltsrelevanz eines Bereichs als Tier: 0 = profil-spitz (Energie bei
 * gesetzter Heizart), 1 = Haushalts-Kernbereich, 2 = Rest. Reine Reihenfolge-
 * Gewichtung — verändert nie Fakten, filtert nichts weg.
 */
export function householdRelevanceTier(
  bereich: string,
  profile: { heizart: HouseholdHeizart | null },
): number {
  if (bereich === "energie" && profile.heizart && profile.heizart !== "unbekannt") return 0;
  return HOUSEHOLD_CORE_BEREICHE.has(bereich) ? 1 : 2;
}

/**
 * Ruhige Sortierung von Maßnahmen nach Profil: nach Haushaltsrelevanz-Tier
 * (profil-spitz, dann Kernbereich, dann Rest), innerhalb gleicher Relevanz nach
 * niedrigerem Aufwand. Reine Reihenfolge, kein Urteil und keine Filterung von Fakten.
 */
export function prioritizeActionsForProfile<T extends { aufwand: string; bezugZuBereich: string[] }>(
  actions: T[],
  profile: { heizart: HouseholdHeizart | null },
  limit?: number,
): T[] {
  const tier = (action: T) =>
    action.bezugZuBereich.length
      ? Math.min(...action.bezugZuBereich.map((bereich) => householdRelevanceTier(bereich, profile)))
      : 2;
  const sorted = [...actions].sort(
    (a, b) => tier(a) - tier(b) || aufwandRank(a.aufwand) - aufwandRank(b.aufwand),
  );
  return limit != null ? sorted.slice(0, limit) : sorted;
}

/**
 * Persönliche Priorisierung der Signalketten für den Member-Bereich: nach
 * Haushaltsrelevanz-Tier, dann höherer Severity, dann steigendem Trend zuerst.
 * Reine Reihenfolge — keine Filterung, keine Veränderung der Fakten.
 */
export function prioritizeSignalsForProfile<
  T extends { signal: { bereich: string; severity: string; trend: string } },
>(chains: T[], profile: { heizart: HouseholdHeizart | null }, limit?: number): T[] {
  const sorted = [...chains].sort(
    (a, b) =>
      householdRelevanceTier(a.signal.bereich, profile) - householdRelevanceTier(b.signal.bereich, profile) ||
      severityRank(b.signal.severity) - severityRank(a.signal.severity) ||
      Number(isRising(b.signal.trend)) - Number(isRising(a.signal.trend)),
  );
  return limit != null ? sorted.slice(0, limit) : sorted;
}

// --- Member-Bereich: ruhige Prüf-Checkliste (ohne Speicherung) ----------------

export type CheckStep = { key: string; text: string };

const HEIZART_CHECK: Record<HouseholdHeizart, CheckStep | null> = {
  gas: { key: "heiz-gas", text: "Gas-Abschlag mit dem aktuellen Gaspreis und deinem Vorjahresverbrauch abgleichen." },
  oel: { key: "heiz-oel", text: "Heizöl-Bestellung am Brent-gekoppelten Heizölpreis ausrichten statt spontan." },
  fernwaerme: { key: "heiz-fw", text: "Fernwärme-Abrechnung auf die zeitverzögerte Preisanpassung deines Versorgers prüfen." },
  waermepumpe: { key: "heiz-wp", text: "Stromtarif für die Wärmepumpe vergleichen — Heizstrom-Tarife lohnen den Check." },
  strom: { key: "heiz-strom", text: "Stromtarif vergleichen — beim Heizen mit Strom ist der Tarif der größte Hebel." },
  unbekannt: null,
};

const MODUS_CHECK: Record<HouseholdModus, CheckStep> = {
  single: { key: "modus-single", text: "Feste Einzelkosten (Strom, Internet, Versicherungen) einmal jährlich auf Anpassungen prüfen." },
  familie: { key: "modus-familie", text: "Wocheneinkauf grob planen, um Preisspitzen bei Grundnahrungsmitteln auszuweichen." },
  selbststaendig: { key: "modus-sst", text: "Private und betriebliche Fixkosten getrennt im Blick behalten — beide reagieren auf Preissignale." },
  rentner: { key: "modus-rentner", text: "Planbare Monatsbelastungen (Energie, Miete, Versicherungen) auf angekündigte Erhöhungen prüfen." },
};

const UNIVERSAL_CHECKS: CheckStep[] = [
  { key: "uni-abschlag", text: "Aktuelle Abschläge mit dem tatsächlichen Verbrauch des letzten Jahres abgleichen." },
];

/**
 * Ruhige, aus dem Profil abgeleitete Prüfschritte — reine Orientierung, keine
 * Beratung, ohne neue Speicherung. Heizart-/modus-spezifische Schritte (wenn
 * vorhanden) plus universelle. Bewusst knapp gehalten.
 */
export function householdCheckSteps(profile: {
  modus: HouseholdModus | null;
  heizart: HouseholdHeizart | null;
}): CheckStep[] {
  const steps: CheckStep[] = [];
  if (profile.heizart) {
    const heiz = HEIZART_CHECK[profile.heizart];
    if (heiz) steps.push(heiz);
  }
  if (profile.modus) steps.push(MODUS_CHECK[profile.modus]);
  steps.push(...UNIVERSAL_CHECKS);
  return steps;
}
