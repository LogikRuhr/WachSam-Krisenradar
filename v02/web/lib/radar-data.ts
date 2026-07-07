// Radar-Datenschicht: leitet die Themenkanal-Karten für /radar aus den aktuellen,
// publizierten Indikator-Werten ab. Reine Ableitung zur Renderzeit — keine eigene
// Persistenz für Stufen, keine Mockdaten. DB nicht erreichbar → `connected: false`;
// fehlender Live-Wert → ehrlicher Leerzustand ("pending" / "Datenstand ausstehend").

import { estimateHeatingDelta, estimateMobilityDelta, type CostEstimate } from "./cost-model";
import { indicatorVitals } from "./indicator-zones";
import {
  getIndicatorObservations,
  getIndicators,
  getRegionalWarnings,
  type IndicatorRow,
  type RegionalWarningRow,
  type SourceRow,
  type WithSources,
} from "./public-data";
import { regionName } from "./regions";
import {
  computeThemeState,
  computeWarnlageState,
  THEME_CHANNELS,
  WARNLAGE_CHANNEL,
  type ThemeChannel,
  type ThemeIndicatorInput,
  type ThemeState,
  type ThemeZone,
} from "./themes";

export type RadarTheme = {
  key: string;
  title: string;
  question: string;
  state: ThemeState;
  lead: string;
  reason: string;
  drivers: {
    id: string;
    label: string;
    zone: ThemeZone;
    currentValue: string | null;
    unit: string | null;
    currentValueDate: Date | null;
    sourceName: string | null;
    sources: SourceRow[];
  }[];
  sinceDate: string | null;
  sources: SourceRow[];
  costEstimate?: CostEstimate | null;
};

type RadarIndicatorRow = WithSources<IndicatorRow>;
type IndicatorMap = Map<string, RadarIndicatorRow>;

/** Stufe absteigend für die Themen-Sortierung (hoch zuerst, normal zuletzt). */
const STATE_RANK: Record<ThemeState, number> = {
  hoch: 3,
  erhoeht: 2,
  beobachten: 1,
  normal: 0,
};

const WARNLAGE_MISSING_REASON = "Keine Indikatordaten verfügbar.";
const WARNLAGE_MISSING_LEAD = "Amtliche Warnlage noch ohne Datenanbindung — Datenstand ausstehend.";

const WARNLAGE_LEAD: Record<ThemeState, string> = {
  normal: "Keine amtlichen Warnungen mit erhöhter Stufe.",
  beobachten: "Vereinzelte amtliche Warnungen mit niedriger Stufe.",
  erhoeht: "Amtliche Warnungen mit erhöhter Stufe aktiv.",
  hoch: "Amtliche Warnungen mit hoher oder extremer Stufe aktiv.",
};

type IndicatorEntry = {
  input: ThemeIndicatorInput;
  currentValue: string | null;
  unit: string | null;
  currentValueDate: Date | null;
  sourceName: string | null;
  sources: SourceRow[];
};
type WarnlageIndicatorDriver = {
  id: string;
  label: string;
  zone: ThemeZone;
  currentValue: string | null;
  unit: string | null;
  currentValueDate: Date | null;
  sourceName: string | null;
  sources: SourceRow[];
};

// Leitindikatoren der €-Modellrechnung (Task 7) — nur für diese beiden Kanäle
// wird `costEstimate` berechnet; andere Kanäle erhalten das Feld nicht.
const COST_MODEL_LEAD_INDICATOR: Record<string, string> = {
  mobilitaet: "wi-kraftstoffpreis-diesel",
  "heizen-energie": "wi-gaspreis-haushalt-efh",
};
const COST_MODEL_OBSERVATION_LIMIT = 60;

/**
 * Lädt die Zeitreihe des Leitindikators eines Kostenkanals und berechnet die
 * €-Modellrechnung (cost-model.ts). Kein Leitindikator für den Kanal konfiguriert,
 * Indikator nicht (mehr) publiziert, DB nicht erreichbar oder keine verwertbaren
 * Punkte → `null` (ehrlicher Leerzustand, kein Crash, keine €-Zeile in ThemeCard).
 *
 * `byId` enthält nur publizierte Indikatoren (getIndicators() filtert
 * editorial_status = 'published', s. public-data.ts). Der Guard hier stellt
 * sicher, dass die €-Zeile mitzieht, wenn ein Indikator redaktionell auf Draft
 * zurückgesetzt wird — sonst würde `getIndicatorObservations` (kein eigener
 * Publish-Filter, s. public-data.ts:346-349) weiter aus der Rohzeitreihe eines
 * nicht-publizierten Indikators rechnen.
 */
async function buildCostEstimate(channelKey: string, byId: IndicatorMap): Promise<CostEstimate | null> {
  const indicatorId = COST_MODEL_LEAD_INDICATOR[channelKey];
  if (!indicatorId || !byId.has(indicatorId)) return null;

  const observations = await getIndicatorObservations(indicatorId, COST_MODEL_OBSERVATION_LIMIT);
  if (!observations.connected || observations.rows.length === 0) return null;
  const obs = observations.rows.map((row) => ({ observedAt: row.observedAt, value: String(row.value) }));

  if (channelKey === "mobilitaet") return estimateMobilityDelta(obs);
  const unit = byId.get(indicatorId)?.unit ?? null;
  return estimateHeatingDelta(obs, unit);
}

/**
 * Leitet aus einer Indikator-Row (falls vorhanden) den ThemeIndicatorInput für
 * computeThemeState sowie die Anzeigefelder (currentValue/unit als Rohwerte aus
 * der DB, numeric-Spalten bleiben string) ab. Fehlt die Row (kein Seed/keine
 * Freigabe) oder liegt kein aktueller Wert vor, ist die Zone "pending" — nie
 * stillschweigend "uncritical".
 */
function buildIndicatorEntry(id: string, byId: IndicatorMap): IndicatorEntry {
  const row = byId.get(id);
  if (!row) {
    return {
      input: { id, zone: "pending", label: id },
      currentValue: null,
      unit: null,
      currentValueDate: null,
      sourceName: null,
      sources: [],
    };
  }
  const vitals = indicatorVitals(row);
  const zone: ThemeZone = vitals.zone?.zone ?? "pending";
  return {
    input: { id, zone, label: row.label },
    currentValue: row.currentValue,
    unit: row.unit,
    currentValueDate: vitals.currentValueDate,
    sourceName: row.quelle,
    sources: row.sources,
  };
}

function latestDate(entries: IndicatorEntry[]): string | null {
  const dates = entries
    .map((entry) => entry.currentValueDate)
    .filter((date): date is Date => date instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0]?.toISOString() ?? null;
}

function sourceKey(source: SourceRow): string {
  const stand = source.sourceStand.trim();
  return stand ? `${source.sourceName}:${stand}` : `${source.sourceName}:${source.sourceUrl}`;
}

function collectThemeSources(entries: IndicatorEntry[]): SourceRow[] {
  const seen = new Set<string>();
  const sources: SourceRow[] = [];
  for (const entry of entries) {
    for (const source of entry.sources) {
      const key = sourceKey(source);
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push(source);
      if (sources.length >= 4) return sources;
    }
  }
  return sources;
}

async function buildTheme(channel: ThemeChannel, byId: IndicatorMap): Promise<RadarTheme> {
  const entries = channel.indicatorIds.map((id) => buildIndicatorEntry(id, byId));
  const entryById = new Map(entries.map((entry) => [entry.input.id, entry]));
  const { state, drivers, reason } = computeThemeState(entries.map((entry) => entry.input));
  const costEstimate = channel.key in COST_MODEL_LEAD_INDICATOR ? await buildCostEstimate(channel.key, byId) : undefined;

  return {
    key: channel.key,
    title: channel.title,
    question: channel.question,
    state,
    lead: channel.leadText[state],
    reason,
    drivers: drivers.map((driver) => {
      const entry = entryById.get(driver.id);
      return {
        id: driver.id,
        label: driver.label,
        zone: driver.zone,
        currentValue: entry?.currentValue ?? null,
        unit: entry?.unit ?? null,
        currentValueDate: entry?.currentValueDate ?? null,
        sourceName: entry?.sourceName ?? null,
        sources: entry?.sources ?? [],
      };
    }),
    sinceDate: latestDate(entries),
    sources: collectThemeSources(entries),
    costEstimate,
  };
}

function warnlageTitle(regionCode?: string | null): string {
  return regionCode ? `${WARNLAGE_CHANNEL.title} in ${regionName(regionCode)}` : WARNLAGE_CHANNEL.title;
}

/** Summe der Warnzähler und höchste Warnstufe über alle Quellen desselben Bundeslands. */
function aggregateRegionalWarnings(rows: RegionalWarningRow[]): { count: number; maxLevel: number; latest: Date | null } {
  return rows.reduce(
    (acc, row) => ({
      count: acc.count + row.warningCount,
      maxLevel: Math.max(acc.maxLevel, row.maxLevel),
      latest: !acc.latest || row.updatedAt > acc.latest ? row.updatedAt : acc.latest,
    }),
    { count: 0, maxLevel: 0, latest: null as Date | null },
  );
}

/**
 * Regionale Warnlage-Karte aus `regional_warnings` (Task 4/5). Kein Eintrag für
 * den gewählten Code (auch unbekannte/noch nicht live-verifizierte Codes, siehe
 * regions.ts) ist kein Fehler, sondern ein ehrlicher Leerzustand: "keine aktiven
 * Warnungen ... im Datensatz" statt fälschlich beruhigender Stufe "normal" ohne
 * Erklärung.
 */
function buildRegionalWarnlageTheme(regionCode: string, rows: RegionalWarningRow[]): RadarTheme {
  const name = regionName(regionCode);
  const title = warnlageTitle(regionCode);

  if (rows.length === 0) {
    return {
      key: WARNLAGE_CHANNEL.key,
      title,
      question: WARNLAGE_CHANNEL.question,
      state: "normal",
      lead: `Keine aktiven amtlichen Warnungen für ${name} im Datensatz.`,
      reason: `Keine aktiven Warnungen für ${name} im Datensatz.`,
      drivers: [],
      sinceDate: null,
      sources: [],
    };
  }

  const { count, maxLevel, latest } = aggregateRegionalWarnings(rows);
  const state = computeWarnlageState(maxLevel);

  return {
    key: WARNLAGE_CHANNEL.key,
    title,
    question: WARNLAGE_CHANNEL.question,
    state,
    lead: WARNLAGE_LEAD[state],
    reason: `${count} aktive Warnung(en) in ${name}, höchste Stufe ${maxLevel} von 5.`,
    drivers: [],
    sinceDate: latest ? latest.toISOString() : null,
    sources: [],
  };
}

function themeStateFromZone(zone: ThemeZone): ThemeState {
  if (zone === "critical") return "hoch";
  if (zone === "elevated") return "erhoeht";
  return "normal";
}

function strongestState(states: ThemeState[]): ThemeState {
  return states.reduce((strongest, state) => (STATE_RANK[state] > STATE_RANK[strongest] ? state : strongest), "normal");
}

function warnlageDriver(row: RadarIndicatorRow): {
  driver: WarnlageIndicatorDriver;
  state: ThemeState;
  date: Date | null;
} {
  const vitals = indicatorVitals(row);
  const zone: ThemeZone = vitals.zone?.zone ?? "pending";
  return {
    driver: {
      id: row.id,
      label: row.label,
      zone,
      currentValue: row.currentValue,
      unit: row.unit,
      currentValueDate: vitals.currentValueDate,
      sourceName: row.quelle,
      sources: row.sources,
    },
    state: themeStateFromZone(zone),
    date: vitals.currentValueDate,
  };
}

/**
 * Warnlage-Sonderkanal (DWD + NINA): umgeht die Korroborations-Logik, siehe
 * themes.ts. Fehlen alle amtlichen Live-Werte, liefert diese Funktion einen
 * ehrlichen "Datenstand ausstehend"-Zustand statt der fälschlich beruhigenden
 * `computeWarnlageState(0)`.
 *
 * Ist ein Bundesland-Filter gesetzt (`regionCode`), wird stattdessen der
 * `regional_warnings`-Eintrag des Bundeslands genutzt (buildRegionalWarnlageTheme).
 * Schlägt die Regionalabfrage fehl (z.B. Migration 0013 auf Prod noch nicht
 * angewendet), fällt diese Funktion NICHT stillschweigend auf den Bundeswert
 * zurück, sondern zeigt ehrlich "Datenstand ausstehend" mit Regionalzusatz im Titel.
 */
async function buildWarnlageTheme(byId: IndicatorMap, regionCode?: string | null): Promise<RadarTheme> {
  if (regionCode) {
    const regional = await getRegionalWarnings(regionCode);
    if (regional.connected) {
      return buildRegionalWarnlageTheme(regionCode, regional.rows);
    }
    return {
      key: WARNLAGE_CHANNEL.key,
      title: warnlageTitle(regionCode),
      question: WARNLAGE_CHANNEL.question,
      state: "normal",
      lead: WARNLAGE_MISSING_LEAD,
      reason: WARNLAGE_MISSING_REASON,
      drivers: [],
      sinceDate: null,
      sources: [],
    };
  }

  const [dwdIndicatorId, ninaIndicatorId] = WARNLAGE_CHANNEL.indicatorIds;
  const dwdRow = byId.get(dwdIndicatorId);
  const ninaRow = byId.get(ninaIndicatorId);

  if ((!dwdRow || dwdRow.currentValue == null) && (!ninaRow || ninaRow.currentValue == null)) {
    return {
      key: WARNLAGE_CHANNEL.key,
      title: WARNLAGE_CHANNEL.title,
      question: WARNLAGE_CHANNEL.question,
      state: "normal",
      lead: WARNLAGE_MISSING_LEAD,
      reason: WARNLAGE_MISSING_REASON,
      drivers: [],
      sinceDate: null,
      sources: [],
    };
  }

  const drivers: WarnlageIndicatorDriver[] = [];
  const states: ThemeState[] = [];
  const reasonParts: string[] = [];
  const dates: Date[] = [];

  if (dwdRow && dwdRow.currentValue != null) {
    const rawLevel = Number(dwdRow.currentValue);
    const maxLevel = Number.isFinite(rawLevel) ? rawLevel : 0;
    const dwd = warnlageDriver(dwdRow);
    drivers.push(dwd.driver);
    states.push(computeWarnlageState(maxLevel));
    reasonParts.push(`DWD höchste aktive Warnstufe: ${maxLevel} von 5`);
    if (dwd.date) dates.push(dwd.date);
  }

  if (ninaRow && ninaRow.currentValue != null) {
    const count = Number(ninaRow.currentValue);
    const nina = warnlageDriver(ninaRow);
    drivers.push(nina.driver);
    states.push(nina.state);
    reasonParts.push(`NINA/MoWaS aktive Zivilschutzmeldungen: ${Number.isFinite(count) ? count : ninaRow.currentValue}`);
    if (nina.date) dates.push(nina.date);
  }

  const state = strongestState(states);
  const latest = dates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    key: WARNLAGE_CHANNEL.key,
    title: WARNLAGE_CHANNEL.title,
    question: WARNLAGE_CHANNEL.question,
    state,
    lead: WARNLAGE_LEAD[state],
    reason: `${reasonParts.join("; ")}.`,
    drivers,
    sinceDate: latest ? latest.toISOString() : null,
    sources: collectThemeSources(
      drivers.map((driver) => ({
        input: { id: driver.id, zone: driver.zone, label: driver.label },
        currentValue: driver.currentValue,
        unit: driver.unit,
        currentValueDate: driver.currentValueDate,
        sourceName: driver.sourceName,
        sources: driver.sources,
      })),
    ),
  };
}

/**
 * Liefert die Themenkanal-Karten für /radar: Stufen werden zur Renderzeit
 * deterministisch aus publizierten Indikatoren abgeleitet (keine eigene
 * Persistenz für Stufen). Sortierung: Stufe absteigend, bei Gleichstand
 * Kanal-Reihenfolge aus THEME_CHANNELS. Warnlage ist ein Sonderkanal und wird
 * separat zurückgegeben (siehe buildWarnlageTheme). Optionaler `regionCode`
 * (aus dem Cookie `ws-region`, siehe regions.ts) regionalisiert NUR die
 * Warnlage-Karte — die übrigen Themenkanäle bleiben bundesweite Indikatoren.
 */
export async function getRadarThemes(
  regionCode?: string | null,
): Promise<{ themes: RadarTheme[]; warnlage: RadarTheme; connected: boolean }> {
  const indicators = await getIndicators();
  const byId: IndicatorMap = new Map(indicators.rows.map((row) => [row.id, row]));

  const built = await Promise.all(
    THEME_CHANNELS.map(async (channel, index) => ({ theme: await buildTheme(channel, byId), index })),
  );
  const themes = built
    .sort((a, b) => STATE_RANK[b.theme.state] - STATE_RANK[a.theme.state] || a.index - b.index)
    .map((entry) => entry.theme);

  const warnlage = await buildWarnlageTheme(byId, regionCode);

  return { themes, warnlage, connected: indicators.connected };
}
