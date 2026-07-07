// Themenkanäle: deterministische 4-stufige Bewertungslogik (Wirkungsachse).
// Schwellen-/Regeländerungen sind Commits, keine DB-Einträge (PRODUKTPLAN §5).

export type ThemeState = "normal" | "beobachten" | "erhoeht" | "hoch";
export type ThemeZone = "uncritical" | "elevated" | "critical" | "pending";
export type ThemeIndicatorInput = { id: string; zone: ThemeZone; label: string };
export type ThemeStateResult = { state: ThemeState; drivers: ThemeIndicatorInput[]; reason: string };

export const THEME_STATE_LABEL: Record<ThemeState, string> = {
  normal: "Normal",
  beobachten: "Beobachten",
  erhoeht: "Erhöht",
  hoch: "Hoch",
};

export type ThemeChannel = {
  key: string;
  title: string;
  question: string;
  indicatorIds: string[];
  leadText: Record<ThemeState, string>;
};

// Kuratierte Kanäle — Indikator-IDs aus db/seed/source-data/warning-indicators.json.
export const THEME_CHANNELS: ThemeChannel[] = [
  {
    key: "mobilitaet",
    title: "Mobilitätskosten",
    question: "Wird Fahren teurer?",
    indicatorIds: [
      "wi-kraftstoffpreis-diesel",
      "wi-kraftstoffpreis-super-e5",
      "wi-kraftstoffpreis-super-e10",
      "wi-oel-brent",
    ],
    leadText: {
      normal: "Kraftstoff- und Ölpreise bewegen sich im normalen Band.",
      beobachten: "Ein Preissignal fällt auf — noch ohne Bestätigung durch weitere Quellen.",
      erhoeht: "Mehrere Preissignale ziehen an. Pendler sollten die Kostenentwicklung beobachten.",
      hoch: "Kraftstoffkosten steigen deutlich und breit abgestützt.",
    },
  },
  {
    key: "heizen-energie",
    title: "Heiz- & Stromkosten",
    question: "Wird Heizen und Strom teurer?",
    indicatorIds: [
      "wi-gaspreis-europa",
      "wi-gaspreis-haushalt-efh",
      "wi-strompreis-haushalt",
      "wi-gasspeicher-fuellstand",
    ],
    leadText: {
      normal: "Gas- und Strompreise sowie Speicherstände sind unauffällig.",
      beobachten: "Ein Energiesignal fällt auf — Entwicklung unklar.",
      erhoeht: "Mehrere Energiesignale zeigen in dieselbe Richtung. Abschläge prüfen lohnt sich.",
      hoch: "Energiekosten-Signale sind breit im kritischen Bereich.",
    },
  },
  {
    key: "lebensmittel",
    title: "Lebensmittelpreise",
    question: "Wird der Einkauf teurer?",
    indicatorIds: ["wi-fao-food-price-index", "wi-duengemittel-preis", "wi-destatis-lebensmittel-yoy-de"],
    leadText: {
      normal: "Vorlauf-Indikatoren für Lebensmittelpreise sind unauffällig.",
      beobachten: "Ein Vorlauf-Signal fällt auf — wirkt, wenn überhaupt, mit Monaten Verzögerung.",
      erhoeht: "Mehrere Vorlauf-Signale steigen. Preisdruck im Supermarkt wird wahrscheinlicher.",
      hoch: "Deutlicher, breit abgestützter Preisdruck in der Lebensmittelkette.",
    },
  },
  {
    key: "geld-zinsen",
    title: "Geld & Zinsen",
    question: "Was passiert mit Kaufkraft und Krediten?",
    indicatorIds: ["wi-ezb-leitzins", "wi-inflation-vpi-de"],
    leadText: {
      normal: "Inflation und Leitzins bewegen sich im erwartbaren Rahmen.",
      beobachten: "Ein Geldwert-Signal fällt auf.",
      erhoeht: "Inflations- und Zinssignale sind gemeinsam auffällig — Kredit- und Sparentscheidungen betroffen.",
      hoch: "Deutliche Anspannung bei Geldwert und Finanzierung.",
    },
  },
  {
    key: "arbeit-wirtschaft",
    title: "Arbeit & Wirtschaft",
    question: "Wie stabil sind Jobs und Betriebe?",
    indicatorIds: ["wi-arbeitslosigkeit-de", "wi-insolvenzen-de", "wi-bip-wachstum-de"],
    leadText: {
      normal: "Arbeitsmarkt- und Konjunktursignale sind unauffällig.",
      beobachten: "Ein Konjunktursignal fällt auf.",
      erhoeht: "Mehrere Signale zeigen wirtschaftliche Abkühlung — mittelbar relevant für Jobs und Aufträge.",
      hoch: "Breite wirtschaftliche Anspannung über mehrere Indikatoren.",
    },
  },
  {
    key: "staat-vertrauen",
    title: "Staat & Sicherheit",
    question: "Wie belastbar sind Staat und digitale Infrastruktur?",
    indicatorIds: ["wi-bsi-cyberbedrohung", "wi-staatsschuldenquote-de", "wi-vertrauen-politik"],
    leadText: {
      normal: "Cyber-, Schulden- und Vertrauenssignale sind unauffällig.",
      beobachten: "Ein Signal in diesem Bereich fällt auf.",
      erhoeht: "Mehrere Belastungssignale gleichzeitig — Entwicklung beobachten.",
      hoch: "Breite Anspannung bei staatlicher Belastbarkeit.",
    },
  },
];

// Amtliche Warnlage ist ein Sonderkanal: DWD/NINA umgehen das Scoring (PRODUKTPLAN §5.2).
export const WARNLAGE_CHANNEL = {
  key: "warnlage",
  title: "Akute Warnlage (amtlich)",
  question: "Gibt es amtliche Warnungen?",
  indicatorIds: ["wi-dwd-warnings-de", "wi-nina-zivilschutz-de"],
} as const;

const NOTEWORTHY: ReadonlySet<ThemeZone> = new Set(["elevated", "critical"]);

export function computeThemeState(inputs: ThemeIndicatorInput[]): ThemeStateResult {
  const drivers = inputs.filter((i) => NOTEWORTHY.has(i.zone));
  const critical = drivers.filter((i) => i.zone === "critical").length;
  const noteworthy = drivers.length;

  let state: ThemeState = "normal";
  if (critical >= 1 && noteworthy >= 2) state = "hoch";
  else if (critical >= 1 || noteworthy >= 2) state = "erhoeht";
  else if (noteworthy === 1) state = "beobachten";

  const reason =
    inputs.length === 0
      ? "Keine Indikatordaten verfügbar."
      : `${noteworthy} von ${inputs.length} Indikatoren auffällig (davon ${critical} kritisch).`;
  return { state, drivers, reason };
}

// DWD max_level (0–5) → Kanalstufe, amtliche Logik unverändert durchgereicht.
export function computeWarnlageState(maxLevel: number): ThemeState {
  if (maxLevel >= 4) return "hoch";
  if (maxLevel >= 3) return "erhoeht";
  if (maxLevel >= 1) return "beobachten";
  return "normal";
}
