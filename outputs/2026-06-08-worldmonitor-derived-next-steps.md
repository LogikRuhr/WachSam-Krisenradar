# WachSam — Worldmonitorapp konkret ableiten (2026-06-08)

Referenzbasis: `outputs/worldmonitor-konzeptanalyse-2026-06-05.md`.

## Harte Grenze

Worldmonitor ist AGPL-3.0-only plus Trademark. Für WachSam gilt deshalb:

- kein Code
- keine Assets
- keine Texte
- keine Scoring-Formeln
- keine Layer-/Quellenlisten 1:1
- keine UI-Kopie
- keine Marke/Benennung

Erlaubt und sinnvoll ist ausschließlich die abstrakte, eigenständig formulierte Produktlogik: Quellenqualität, Datenstand, Confidence, Methodik und Wirkungsketten verständlich machen.

## Konkrete WachSam-Ableitung

### P0 — Vertrauen auf jeder Karte

#### 1. Methodik pro Karte

Jede relevante Karte bekommt eine ruhige Disclosure:

- `Wie entsteht diese Einschätzung?`
- Eingangssignal
- Quellenlage
- Confidence
- Datenstand
- redaktionelle Prüfung
- Hinweis: keine Vorhersage, sondern Lageeinordnung

Umsetzung: bestehendes `DisclosureSection`-Pattern nutzen, eigener Text, keine Worldmonitor-Formulierungen.

#### 2. QualityStrip konsolidieren

`QualityStrip` bleibt der kompakte Blick:

- Quellenzahl
- Sicherheit
- Datenstand

Erweiterung: Methodik-Disclosure darunter oder daneben, nicht als Tooltip-only. Mobile zuerst.

#### 3. Datenstand konsistent

Stand-Datum muss sichtbar sein auf:

- Lagekarte
- Kostenkarte
- Versorgungs-/Maßnahmenkarte
- Indikator-Detail
- Quellenregister

Keine Fake-Live-Optik, keine blinkenden Punkte.

### P1 — Wirkungsketten statt Weltalarm

Worldmonitor zeigt Infrastruktur-/Kaskadenlogik. WachSam-Version:

`Signal → Deutschland-Relevanz → Systemstress → Haushaltsauswirkung → Maßnahme`

Konkretes Ziel:

- Detailseiten erklären die Kette Schritt für Schritt.
- Jede Stufe zeigt Quellen/Confidence, soweit vorhanden.
- Haushaltsauswirkung ist Endpunkt, nicht geopolitische Eskalation.

### P1 — Meine Themen / Watchlist

Worldmonitor-Muster: Follow/Watchlist. WachSam-Version:

- lokal/anonym starten
- Themen: Energie, Medikamente, Arbeit, Wohnen, Versorgung, Wetter/Wasser
- kein Alert-Versand ohne Consent
- keine PII

### P2 — Lage-Cluster und Digest

Später:

- Lage-Cluster: mehrere Signale → ein ruhiger Klartextsatz
- Wochenbriefing: was war haushaltsrelevant, was hat sich geändert, was prüfen?
- Zeitraum-Schalter nur mit echter Datenhistorie

## Nicht übernehmen

- DEFCON/Warroom/Terminal-Ästhetik
- rote Blink-/Live-Optik
- Drag-Resize-Dashboard
- globales Krisenpanorama als Hauptprodukt
- Scoring-Zahlen ohne belastbare eigene Methodik

## Start-Welle 17

### Ziel

P0 umsetzen: Methodik und Vertrauen pro Karte.

### Files

- ADD: `v02/web/components/CardMethodology.tsx`
- CHANGE: `v02/web/components/SignalChain.tsx`
- CHANGE: `v02/web/app/kosten/page.tsx`
- CHANGE: `v02/web/app/globals.css`
- CHANGE: `.remember/next-session-brief.md`

### Akzeptanz

- Lagekarten zeigen neben Quellen/Confidence/Datenstand eine eigene Methodik-Disclosure.
- Kostenkarten zeigen dieselbe Methodik-Disclosure.
- Keine neuen Datenfelder, keine DB-Änderung, keine externen Calls.
- Mobile 390×844 ohne horizontalen Overflow.

### Verify

```bash
cd v02/web && pnpm run typecheck && pnpm run lint && pnpm run build
bash scripts/verify.sh
git diff --check
```

Browser-Smoke lokal:

- `/`
- `/lagebild`
- `/kosten`
- mobile `scrollWidth <= clientWidth`
- Marker: `Wie entsteht diese Einschätzung?`

## Folgewellen

### Welle 18 — Wirkungsketten-Explorer vertiefen

- Detailpfad je Signal/Kaskade stärker sichtbar machen.
- Eigenes Modell: Signal, DE-Relevanz, Systemstress, Haushaltsauswirkung, Maßnahme.
- Keine Worldmonitor-Formel.

### Welle 19 — Meine Themen lokal

- Lokale Watchlist ohne Account.
- Themen priorisieren, nicht tracken.
- Später Auth/Consent sauber klären.
