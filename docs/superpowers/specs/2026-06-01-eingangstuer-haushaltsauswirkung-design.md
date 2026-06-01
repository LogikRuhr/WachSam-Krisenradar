# Design — Eingangstür: Haushaltsauswirkung statt Dashboard

> Stand: 2026-06-01 · Branch `feat/eingangstuer-haushaltsauswirkung`
> Status: Entwurf genehmigt (Richtung + `heizart`), Spec zur Review.

## Problem

Die Live-App (`wachsam.ruhrlogik.de`) wirkt wie ein **statisches Dashboard** — exakt das, was die
Source-of-Truth ausschließt. `docs/# WachSam.md` listet „ein reines Dashboard" unter **„Was WachSam
NICHT ist"**, und die v0.3-Pivot-Begründung sagt es wörtlich:

> „Die statische Linie liest sich als strukturierte Wissensbasis, nicht als Nutzerprodukt. Bürger
> sehen kuratierte Daten, aber keine persönliche Einordnung auf das eigene Haushaltsprofil."

Das **Kernprinzip** (`docs/product.md` Z. 71–82) verlangt das Gegenteil:

```
Globales Signal → Deutschland-Relevanz → betroffene Systeme
  → Haushaltsauswirkung → Mehrkosten / Versorgungsrisiko / Maßnahme → Confidence
```

**Befund (am Code verifiziert):** Die Eingangstür zeigt heute nur das oberste Lagebild-Item plus einen
generischen Modus-Satz. Kosten (`costImpacts`), Versorgung (`supplyRisks`) und Maßnahmen
(`citizenActions`) liegen in **getrennten Tabellen/Sektionen** und sind **nicht pro Signal verkettet**.
Die Grundlogik-Kette existiert als Daten in Schubladen, nirgends als eine zusammenhängende Aussage.
Das ist das Dashboard-Gefühl auf Datenebene.

## Ziel

Die Eingangstür (Start + Lagebild) löst das Kernprinzip ein: **jedes Top-Signal fährt die Kette bis zum
Ende** — was los ist → was es für *deinen* Haushalt heißt → was du tun kannst — personalisiert, mit
sichtbarem Stand.

### Erfolgskriterien

1. Ein Besucher liest in ≤ 3 Sekunden ein **Verdikt** („Muss ich mir Sorgen machen?").
2. Jedes Top-Signal zeigt **Auswirkung auf den Haushalt + eine Maßnahme**, nicht nur eine Zahl.
3. Personalisierung ist **echt** spürbar: ein Gasheizer sieht das Gas-Signal zugespitzt, ein Stromheizer nicht.
4. Nichts wirkt eingefroren: **Trend + Stand-Datum** auf jedem Block; Steigendes zuerst.
5. Keine erfundenen Zahlen — Auswirkung qualitativ aus echter `beschreibung`, Quellen/Confidence bleiben.

## Scope

**In:** Eingangstür (`app/page.tsx`), Lagebild (`app/lagebild/page.tsx`), eine wiederverwendbare
Verkettungs-Einheit, Verdikt-Banner, `heizart`-Profilfeld (Schema + Profilformular + Personalisierung).

**Out (später, nicht-blockierend):** numerische €-Schätzung, Notifications/Alerts, Radar-Umbau der
übrigen Seiten (Kaskaden, Governance, Indikatoren bleiben vorerst), Live-Ingestion-Erweiterung.

## Datenmodell-Änderung

Eine neue optionale Spalte auf `households` + Enum:

```ts
export const heizartEnum = pgEnum("heizart", ["gas", "oel", "fernwaerme", "waermepumpe", "strom", "unbekannt"]);
// households:
heizart: heizartEnum("heizart").notNull().default("unbekannt"),
```

- Drizzle-Migration via `db:generate`.
- `profileSchema` (in `lib/profile.ts`) um `heizart` erweitern; Profilformular (`app/profil/profile-form.tsx`) bekommt ein Auswahlfeld.
- DSGVO: `heizart` ist kein PII, anonymisierter Score-Charakter — konform mit globaler Regel.

Kein weiteres Feld. `haushaltsgröße` bleibt bewusst draußen (YAGNI für den ersten Wurf).

## Architektur

### Verkettung über `bereich`

Gemeinsamer Schlüssel ist `bereich` (die 10 Systembereiche). Neue Server-Funktion in
`lib/public-data.ts`:

```
getFrontDoorSignals(profile): SignalChain[]
  1. lagebildItems (published) → sortiert nach severityValue DESC, dann Trend (steigend/eskalierend zuerst)
  2. Top N (N=3) auswählen
  3. je Signal:
       impact  = costImpacts/supplyRisks mit gleichem bereich (höchste Confidence zuerst, 1 Stück)
       action  = citizenActions mit bezugZuBereich ∋ bereich (geringster Aufwand zuerst, 1 Stück)
  4. Personalisierungs-Layer anwenden (siehe unten)
```

Join rein in Query/Memory — **keine neue Tabelle, keine neuen Link-Spalten**. Wenn ein Signal keinen
Impact oder keine Action im `bereich` findet: Block zeigt Signal + Auswirkung ohne Maßnahme (graceful
degrade), nie ein leeres/kaputtes Element.

### Verdikt-Logik

`computeVerdict(lagebildItems)` → ein Satz aus der Severity-Verteilung:
- höchste Severity `kritisch`/`eskalierend` vorhanden → „Aktuell angespannt: … — [kein akuter Notfall | akut]".
- alle ≤ `beobachten` → „Aktuell ruhig: keine erhöhten Belastungen.".
- Treiber-Bereiche (Top-2 nach Severity) werden namentlich genannt. Sachlich, nicht alarmistisch (`docs/brand.md`).

### Personalisierung

| Feld | Wirkung |
|---|---|
| `modus` | Phrasierung des „für dich"-Satzes (bestehende Modus-Leads weiterverwenden/zuspitzen) |
| `plz` | leichter Regionsbezug, wo Daten es zulassen (sonst weglassen — nichts erfinden) |
| `heizart` | Energie-Signale zuspitzen/dämpfen: `gas`→Gasspeicher/Gaspreis direkt; `strom`/`waermepumpe`→Strompreis; `oel`→Heizöl/Brent; sonst neutral |

Ohne Login / ohne Profil: neutrale, nicht-personalisierte Variante (Verdikt + Kette ohne „für dich"-Zuspitzung).
Personalisierung verändert **Betonung und Auswahlreihenfolge**, nie die Fakten.

## Komponenten

- `components/Verdict.tsx` — Verdikt-Banner (ein Satz, Severity-Farbe dezent).
- `components/SignalChain.tsx` — eine Einheit: Signal (Titel + Trend + Stand) → Auswirkung (für dich) → Maßnahme (Aufwand) → Quellen/Confidence (bestehende Badges/Pills).
- `lib/public-data.ts` — `getFrontDoorSignals`, `computeVerdict`.
- `lib/personalization.ts` (neu) — reine Funktionen: `applyHeizart`, `applyModus`; testbar ohne DB.
- `app/page.tsx`, `app/lagebild/page.tsx` — konsumieren die neue Einheit.

Jede Einheit hat einen klaren Zweck, kommuniziert über typisierte Props, ist ohne DB testbar
(Personalisierung + Verdikt als pure Funktionen).

## Disziplin / Constraints

- Quellen-Pflicht + Confidence/Severity-Badges bleiben (`docs/ui-standard.md`).
- Keine erfundenen €-Zahlen, keine erfundene Region, keine erfundenen Quellen.
- Bürger-Sprache, kein Dev-/Analysten-Jargon vorne (Konfidenz/Methodik in die Detailtiefe).
- Brand unverändert (Industrial Dark, Bebas/IBM Plex, Strich-Marker).
- Nicht alarmistisch.

## Tests / Akzeptanz

- Pure-Function-Tests: `computeVerdict` (alle Severity-Lagen), `applyHeizart` (Gasheizer sieht Gas zugespitzt, Stromheizer nicht).
- Verkettungs-Test: jedes Top-Signal resolved zu ≥ Auswirkung; Action optional; kein leeres Element.
- Akzeptanztest (Story): „Eingangstür zeigt Verdikt + ≥1 vollständige Kette mit Maßnahme; kein `undefined`; Stand sichtbar."
- Bestehende Gates: `wachsam-bernd-tester`, `wachsam-gold-standards` (P1/P2/P4), `wachsam-story-reviewer`.

## Risiken

- `bereich`-Vokabular muss über `lagebild` / `costImpacts` / `citizenActions.bezugZuBereich` deckungsgleich sein. **Vorab-Check**: Werte-Abgleich im Seed; falls Drift, Normalisierungs-Map.
- Zu wenig Seed-Content je Bereich → manche Signale ohne Maßnahme. Akzeptiert (graceful degrade), als Content-Lücke dokumentieren.

## Bewusst nicht enthalten

Numerische Mehrkosten, Notifications, Radar-Umbau aller Seiten, Live-Ingestion-Ausbau. Jeweils eigener
Spec, wenn dieser erste Wurf trägt.
