// Wochenübersicht: leitet für /woche die Themenkanal-Stufe von heute gegen die
// Stufe vor 7 Tagen ab. Reine Ableitung zur Renderzeit aus den publizierten
// Indikatoren und ihrer Zeitreihe (indicator_observations) — keine eigene
// Persistenz für Stufen, keine Mockdaten.
//
// Methodische Einschränkung (wird auf der Seite ausgewiesen): Schwellenwerte
// selbst sind nicht historisiert. Die Stufe "vor 7 Tagen" wird daher aus dem
// jüngsten Beobachtungswert vor dem Stichtag berechnet, aber mit den HEUTIGEN
// Schwellen bewertet — ein Wert, der heute als "erhöht" gilt, kann vor einer
// zwischenzeitlichen Schwellenanpassung real unauffällig gewesen sein.

import { computeZone, indicatorVitals, type ScaleDirection } from "./indicator-zones";
import { getIndicatorObservations, getIndicators, type IndicatorRow, type WithSources } from "./public-data";
import { computeThemeState, THEME_CHANNELS, type ThemeChannel, type ThemeState, type ThemeZone } from "./themes";

type IndicatorMap = Map<string, WithSources<IndicatorRow>>;

export type WeeklyChannel = {
  key: string;
  title: string;
  stateNow: ThemeState;
  stateWeekAgo: ThemeState | null;
  changed: boolean;
  topMover: { label: string; deltaPercent: number } | null;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// 60 jüngste Beobachtungen genügen, um einen Stichtag 7 Tage zurück zu treffen —
// auch bei geringerer Kadenz (wöchentlich/monatlich) bleibt der Stichtag im Fenster.
const OBSERVATION_LIMIT = 60;

/**
 * Jüngster Wert mit `observedAt <= at` aus einer Beobachtungsliste (Reihenfolge
 * der Eingabe ist egal). Reine Funktion, keine DB — Basis für die
 * Stichtags-Rückschau von getWeeklyOverview(). Liefert `null`, wenn kein Punkt
 * vor dem Stichtag liegt (ehrlich: keine Historie statt eines erfundenen Werts).
 */
export function valueAt(obs: { observedAt: Date; value: string }[], at: Date): string | null {
  let result: string | null = null;
  let resultTime = -Infinity;
  const atTime = at.getTime();
  for (const point of obs) {
    const time = point.observedAt.getTime();
    if (time <= atTime && time > resultTime) {
      result = point.value;
      resultTime = time;
    }
  }
  return result;
}

function toNum(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

type ChannelSnapshot = {
  label: string;
  zoneNow: ThemeZone;
  zoneWeekAgo: ThemeZone;
  hasHistory: boolean;
  currentValue: number | null;
  historicalValue: number | null;
};

/**
 * Momentaufnahme eines Kanal-Indikators für heute und für den Stichtag vor 7
 * Tagen. Fehlt die Row (kein Seed/keine Freigabe), sind beide Zonen "pending" —
 * konsistent mit dem Zonen-Muster aus radar-data.ts (nie stillschweigend
 * "uncritical"). Die historische Zone nutzt bewusst die heutigen Schwellen des
 * Indikators (siehe Modul-Kommentar).
 */
async function buildSnapshot(id: string, byId: IndicatorMap, weekAgo: Date): Promise<ChannelSnapshot> {
  const row = byId.get(id);
  if (!row) {
    return { label: id, zoneNow: "pending", zoneWeekAgo: "pending", hasHistory: false, currentValue: null, historicalValue: null };
  }

  const vitals = indicatorVitals(row);
  const zoneNow: ThemeZone = vitals.zone?.zone ?? "pending";

  const observations = await getIndicatorObservations(id, OBSERVATION_LIMIT);
  const obs = observations.rows.map((r) => ({ observedAt: r.observedAt, value: String(r.value) }));
  const historicalValue = toNum(valueAt(obs, weekAgo));

  const zoneWeekAgo: ThemeZone =
    historicalValue == null
      ? "pending"
      : (computeZone(
          historicalValue,
          toNum(row.thresholdWarn),
          toNum(row.thresholdCritical),
          row.scaleDirection as ScaleDirection,
          {
            uncritical: row.zoneTextUncritical,
            elevated: row.zoneTextElevated,
            critical: row.zoneTextCritical,
          },
        )?.zone ?? "pending");

  return {
    label: row.label,
    zoneNow,
    zoneWeekAgo,
    hasHistory: historicalValue != null,
    currentValue: vitals.currentValue,
    historicalValue,
  };
}

/**
 * Größte |Δ%|-Bewegung der Kanal-Indikatoren über 7 Tage — nur dort, wo beide
 * Werte vorliegen und die Basis (Wert vor 7 Tagen) ≠ 0 ist (sonst Division durch
 * 0). Kein Indikator qualifiziert → `null` statt einer erfundenen Bewegung.
 */
function findTopMover(snapshots: ChannelSnapshot[]): { label: string; deltaPercent: number } | null {
  let best: { label: string; deltaPercent: number } | null = null;
  for (const snap of snapshots) {
    if (snap.currentValue == null || snap.historicalValue == null || snap.historicalValue === 0) continue;
    const deltaPercent = Math.round(((snap.currentValue - snap.historicalValue) / Math.abs(snap.historicalValue)) * 1000) / 10;
    if (best == null || Math.abs(deltaPercent) > Math.abs(best.deltaPercent)) {
      best = { label: snap.label, deltaPercent };
    }
  }
  return best;
}

async function buildWeeklyChannel(channel: ThemeChannel, byId: IndicatorMap, weekAgo: Date): Promise<WeeklyChannel> {
  const snapshots = await Promise.all(channel.indicatorIds.map((id) => buildSnapshot(id, byId, weekAgo)));

  const stateNow = computeThemeState(
    channel.indicatorIds.map((id, i) => ({ id, zone: snapshots[i].zoneNow, label: snapshots[i].label })),
  ).state;

  const hasHistory = snapshots.some((snap) => snap.hasHistory);
  const stateWeekAgo = hasHistory
    ? computeThemeState(channel.indicatorIds.map((id, i) => ({ id, zone: snapshots[i].zoneWeekAgo, label: snapshots[i].label })))
        .state
    : null;

  return {
    key: channel.key,
    title: channel.title,
    stateNow,
    stateWeekAgo,
    changed: stateWeekAgo != null && stateWeekAgo !== stateNow,
    topMover: findTopMover(snapshots),
  };
}

/**
 * Wochenübersicht für /woche: Stufe heute vs. Stufe vor 7 Tagen je Themenkanal
 * (THEME_CHANNELS, Task 1). `stateWeekAgo` ist `null`, wenn für KEINEN
 * Indikator des Kanals ein Beobachtungswert vor dem Stichtag vorliegt
 * ("keine ausreichende Historie" statt einer erfundenen Stufe) — liegt für
 * mindestens einen Indikator Historie vor, wird die Stufe berechnet (fehlende
 * Einzelindikatoren zählen dabei als "pending", wie im aktuellen Stand auch).
 * `now` ist optional für Tests; ohne Argument wird die aktuelle Zeit genutzt.
 */
export async function getWeeklyOverview(now: Date = new Date()): Promise<{
  channels: WeeklyChannel[];
  generatedFor: string;
  connected: boolean;
}> {
  const indicators = await getIndicators();
  const byId: IndicatorMap = new Map(indicators.rows.map((row) => [row.id, row]));
  const weekAgo = new Date(now.getTime() - WEEK_MS);

  const channels = await Promise.all(THEME_CHANNELS.map((channel) => buildWeeklyChannel(channel, byId, weekAgo)));

  return { channels, generatedFor: now.toISOString(), connected: indicators.connected };
}

const STATE_RANK: Record<ThemeState, number> = { normal: 0, beobachten: 1, erhoeht: 2, hoch: 3 };

/** Hochstufung: Stufe ist gestiegen UND eine Vorwoche-Stufe war überhaupt bekannt. */
export function isWeeklyUpgrade(channel: WeeklyChannel): boolean {
  return channel.changed && channel.stateWeekAgo != null && STATE_RANK[channel.stateNow] > STATE_RANK[channel.stateWeekAgo];
}

/** Anzahl der Themenkanäle, die gegenüber vor 7 Tagen hochgestuft wurden — genutzt von /woche und dem Home-Teaser. */
export function countWeeklyUpgrades(channels: WeeklyChannel[]): number {
  return channels.filter(isWeeklyUpgrade).length;
}

/** "+3,2 %" bzw. "−1,5 %" — Minuszeichen (U+2212) statt Bindestrich, Komma statt Punkt. */
export function formatDeltaPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(1).replace(".", ",")} %`;
}
