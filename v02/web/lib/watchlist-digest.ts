import type { ThemeState } from "./themes";

export type DigestWatchItem = {
  id: string;
  title: string;
  bereich: string;
  severity: string;
  trend: string;
  impactTitle: string | null;
};

export type DigestWeeklyItem = {
  title: string;
  stateNow: ThemeState;
  stateWeekAgo: ThemeState | null;
  changed: boolean;
  topMover: { label: string; deltaPercent: number } | null;
};

export type WatchlistDigestPreview = {
  ready: boolean;
  title: string;
  intro: string;
  watchItems: DigestWatchItem[];
  weeklyItems: DigestWeeklyItem[];
};

function relevantWeeklyItems(items: DigestWeeklyItem[]): DigestWeeklyItem[] {
  return items
    .filter((item) => item.changed || item.topMover != null)
    .sort((a, b) => {
      const aDelta = Math.abs(a.topMover?.deltaPercent ?? 0);
      const bDelta = Math.abs(b.topMover?.deltaPercent ?? 0);
      return bDelta - aDelta;
    })
    .slice(0, 3);
}

export function buildWatchlistDigestPreview(input: {
  watchItems: DigestWatchItem[];
  weeklyItems: DigestWeeklyItem[];
}): WatchlistDigestPreview {
  const watchItems = input.watchItems.slice(0, 3);
  const weeklyItems = relevantWeeklyItems(input.weeklyItems);

  if (watchItems.length === 0) {
    return {
      ready: false,
      title: "Digest-Vorschau",
      intro: "Sobald du Lagekarten beobachtest, bündelt WachSam hier deine wichtigsten Änderungen der Woche.",
      watchItems,
      weeklyItems,
    };
  }

  return {
    ready: true,
    title: "Dein nächster Wochen-Digest",
    intro: `${watchItems.length} beobachtete Lagekarte${watchItems.length === 1 ? "" : "n"} plus die größten Wochenbewegungen.`,
    watchItems,
    weeklyItems,
  };
}
