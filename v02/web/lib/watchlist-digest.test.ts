import assert from "node:assert/strict";
import { buildWatchlistDigestPreview, type DigestWatchItem, type DigestWeeklyItem } from "./watchlist-digest";

const watched: DigestWatchItem[] = [
  { id: "energy", title: "Energie", bereich: "energie", severity: "erhoeht", trend: "steigend", impactTitle: "Kosten" },
  { id: "food", title: "Lebensmittel", bereich: "lebensmittel", severity: "beobachten", trend: "gleich", impactTitle: null },
  { id: "health", title: "Gesundheit", bereich: "gesundheit", severity: "erhoeht", trend: "steigend", impactTitle: "Versorgung" },
  { id: "industry", title: "Industrie", bereich: "industrie", severity: "kritisch", trend: "steigend", impactTitle: null },
];

const weekly: DigestWeeklyItem[] = [
  { title: "Mobilität", stateNow: "hoch", stateWeekAgo: "erhoeht", changed: true, topMover: { label: "Diesel", deltaPercent: 8.2 } },
  { title: "Energie", stateNow: "erhoeht", stateWeekAgo: "erhoeht", changed: false, topMover: { label: "Gas", deltaPercent: -3.1 } },
  { title: "Gesundheit", stateNow: "beobachten", stateWeekAgo: "beobachten", changed: false, topMover: null },
  { title: "Lebensmittel", stateNow: "erhoeht", stateWeekAgo: "beobachten", changed: true, topMover: null },
];

{
  const preview = buildWatchlistDigestPreview({ watchItems: watched, weeklyItems: weekly });
  assert.equal(preview.ready, true, "Watchlist mit Items liefert fertige Digest-Vorschau");
  assert.equal(preview.watchItems.length, 3, "Digest begrenzt beobachtete Karten");
  assert.equal(preview.weeklyItems.length, 3, "Digest begrenzt Wochenbewegungen");
  assert.equal(preview.weeklyItems[0].title, "Mobilität", "groesste Bewegung steht vorne");
  assert.match(preview.intro, /3 beobachtete Lagekarten/, "Intro nennt Umfang");
}

{
  const preview = buildWatchlistDigestPreview({ watchItems: [], weeklyItems: weekly });
  assert.equal(preview.ready, false, "ohne Watchlist bleibt Digest Preview leer");
  assert.equal(preview.watchItems.length, 0, "keine Platzhalterkarten");
  assert.match(preview.intro, /Sobald du Lagekarten beobachtest/, "Leerzustand erklaert naechsten Schritt");
}

console.log("watchlist-digest.test.ts: PASS");
