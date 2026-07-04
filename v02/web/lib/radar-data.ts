// Radar-Datenschicht: leitet die Themenkanal-Karten für /radar aus den aktuellen,
// publizierten Indikator-Werten ab. Reine Ableitung zur Renderzeit — keine eigene
// Persistenz für Stufen, keine Mockdaten. DB nicht erreichbar → `connected: false`;
// fehlender Live-Wert → ehrlicher Leerzustand ("pending" / "Datenstand ausstehend").

import { indicatorVitals } from "./indicator-zones";
import { getIndicators, type IndicatorRow, type WithSources } from "./public-data";
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
  drivers: { id: string; label: string; zone: ThemeZone; currentValue: string | null; unit: string | null }[];
  sinceDate: string | null;
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

type IndicatorEntry = { input: ThemeIndicatorInput; currentValue: string | null; unit: string | null };

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
    return { input: { id, zone: "pending", label: id }, currentValue: null, unit: null };
  }
  const vitals = indicatorVitals(row);
  const zone: ThemeZone = vitals.zone?.zone ?? "pending";
  return {
    input: { id, zone, label: row.label },
    currentValue: row.currentValue,
    unit: row.unit,
  };
}

function buildTheme(channel: ThemeChannel, byId: IndicatorMap): RadarTheme {
  const entries = channel.indicatorIds.map((id) => buildIndicatorEntry(id, byId));
  const entryById = new Map(entries.map((entry) => [entry.input.id, entry]));
  const { state, drivers, reason } = computeThemeState(entries.map((entry) => entry.input));

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
      };
    }),
    sinceDate: null,
  };
}

/**
 * Warnlage-Sonderkanal (DWD, `wi-dwd-warnings-de`): umgeht die Korroborations-
 * Logik (computeWarnlageState statt computeThemeState), siehe themes.ts. Der
 * Indikator hat aktuell keine Seed-Zeile (folgt in einem späteren Task) — fehlt
 * die Row oder der Live-Wert, liefert diese Funktion einen ehrlichen
 * "Datenstand ausstehend"-Zustand statt der fälschlich beruhigenden
 * `computeWarnlageState(0)`.
 */
function buildWarnlageTheme(byId: IndicatorMap): RadarTheme {
  const row = byId.get(WARNLAGE_CHANNEL.indicatorId);

  if (!row || row.currentValue == null) {
    return {
      key: WARNLAGE_CHANNEL.key,
      title: WARNLAGE_CHANNEL.title,
      question: WARNLAGE_CHANNEL.question,
      state: "normal",
      lead: WARNLAGE_MISSING_LEAD,
      reason: WARNLAGE_MISSING_REASON,
      drivers: [],
      sinceDate: null,
    };
  }

  const vitals = indicatorVitals(row);
  const rawLevel = Number(row.currentValue);
  const maxLevel = Number.isFinite(rawLevel) ? rawLevel : 0;
  const state = computeWarnlageState(maxLevel);
  const zone: ThemeZone = vitals.zone?.zone ?? "pending";

  return {
    key: WARNLAGE_CHANNEL.key,
    title: WARNLAGE_CHANNEL.title,
    question: WARNLAGE_CHANNEL.question,
    state,
    lead: WARNLAGE_LEAD[state],
    reason: `Höchste aktive Warnstufe: ${maxLevel} von 5.`,
    drivers: [{ id: row.id, label: row.label, zone, currentValue: row.currentValue, unit: row.unit }],
    sinceDate: vitals.currentValueDate ? vitals.currentValueDate.toISOString() : null,
  };
}

/**
 * Liefert die Themenkanal-Karten für /radar: Stufen werden zur Renderzeit
 * deterministisch aus publizierten Indikatoren abgeleitet (keine eigene
 * Persistenz für Stufen). Sortierung: Stufe absteigend, bei Gleichstand
 * Kanal-Reihenfolge aus THEME_CHANNELS. Warnlage ist ein Sonderkanal und wird
 * separat zurückgegeben (siehe buildWarnlageTheme).
 */
export async function getRadarThemes(): Promise<{ themes: RadarTheme[]; warnlage: RadarTheme; connected: boolean }> {
  const indicators = await getIndicators();
  const byId: IndicatorMap = new Map(indicators.rows.map((row) => [row.id, row]));

  const themes = THEME_CHANNELS.map((channel, index) => ({ theme: buildTheme(channel, byId), index }))
    .sort((a, b) => STATE_RANK[b.theme.state] - STATE_RANK[a.theme.state] || a.index - b.index)
    .map((entry) => entry.theme);

  const warnlage = buildWarnlageTheme(byId);

  return { themes, warnlage, connected: indicators.connected };
}
