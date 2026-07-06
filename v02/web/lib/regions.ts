// Bundesland-Filter für /radar: Codes müssen exakt der DWD-Warnwetter-API
// entsprechen (`stateShort`), NICHT ISO-3166-2:DE (dort wäre Niedersachsen z.B.
// "DE-NI"). Live gegen die echte DWD-API verifiziert sind Stand 2026-07-04
// bislang nur MV, NS und SH (siehe .superpowers/sdd/task-5-report.md, Abschnitt
// „Live-Verifikation") — die übrigen 13 Codes stammen aus der bekannten
// DWD-Warnapp-Codeliste und sind bei der nächsten bundesweiten Großwetterlage
// noch gegen echte Warnungen zu prüfen, bevor sie als gesichert gelten.
//
// Der Radar-Regionalfilter bleibt trotzdem robust gegen unbekannte/ungeprüfte
// Codes: fehlt ein Eintrag in `regional_warnings` für einen Code, ist das kein
// Fehler, sondern schlicht "keine aktiven Warnungen im Datensatz" (siehe
// radar-data.ts).

export const REGION_COOKIE = "ws-region";

export type Bundesland = { code: string; name: string };

export const BUNDESLAENDER: Bundesland[] = [
  { code: "BW", name: "Baden-Württemberg" },
  { code: "BY", name: "Bayern" },
  { code: "BE", name: "Berlin" },
  { code: "BB", name: "Brandenburg" },
  { code: "HB", name: "Bremen" },
  { code: "HH", name: "Hamburg" },
  { code: "HE", name: "Hessen" },
  { code: "MV", name: "Mecklenburg-Vorpommern" },
  { code: "NS", name: "Niedersachsen" },
  { code: "NRW", name: "Nordrhein-Westfalen" },
  { code: "RP", name: "Rheinland-Pfalz" },
  { code: "SL", name: "Saarland" },
  { code: "SN", name: "Sachsen" },
  { code: "ST", name: "Sachsen-Anhalt" },
  { code: "SH", name: "Schleswig-Holstein" },
  { code: "TH", name: "Thüringen" },
];

const BUNDESLAND_BY_CODE = new Map(BUNDESLAENDER.map((land) => [land.code, land.name]));

/** Löst einen Bundesland-Code zum Anzeigenamen auf; null/leer/unbekannt → "Bundesweit" (nie ein Crash). */
export function regionName(code: string | null | undefined): string {
  if (!code) return "Bundesweit";
  return BUNDESLAND_BY_CODE.get(code) ?? "Bundesweit";
}
