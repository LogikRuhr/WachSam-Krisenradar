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

export function modusLead(modus: HouseholdModus | null): string | null {
  return modus ? MODUS_LEAD[modus] : null;
}

/**
 * "Für dich"-Satz pro Signal. Für Energie-Signale entscheidet die Heizart
 * (verändert nur die Betonung, nie die Fakten); sonst der Modus.
 */
export function personalNote(
  bereich: string,
  profile: { modus: HouseholdModus | null; heizart: HouseholdHeizart | null },
): string | null {
  if (bereich === "energie" && profile.heizart) {
    const note = HEIZART_ENERGY_NOTE[profile.heizart];
    if (note) return note;
  }
  return modusLead(profile.modus);
}
