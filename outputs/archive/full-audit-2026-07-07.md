# WachSam Voll-Audit — 2026-07-07

7 parallele Spezialisten-Audits (Live-Smoke aller 15 Prod-Routen, UX/UI, Produkt/Struktur, Editorial, Daten/Quellen, Logik/Code, Wettbewerbs-Ideen). Alles read-only erhoben, dedupliziert und priorisiert. Referenzen: Datei:Zeile im Repo, Stand main `8d6c58c` (PR #29 deployed).

---

## Executive Summary — die 5 wichtigsten Erkenntnisse

1. **1 Live-Blocker:** `/icon.svg` liefert 404 — das Dockerfile kopiert `web/public/` nie ins Runtime-Image (Next-standalone-Falle). PWA-Installierbarkeit ist live gebrochen, obwohl Manifest korrekt deployed ist.
2. **Wiederkehrende Fehlerklasse „gebaut, aber nie verbunden":** NINA-Indikator ingested aber nirgends sichtbar; Pegelonline-Adapter holt bei jedem Lauf echte Daten und verwirft sie (Seed-Zeilen fehlen — gleiche Klasse wie der DWD-Fund letzte Woche); `WerkzeugeDrawer` und `ModusSwitcher` sind fertig implementiert, aber **nirgends importiert** → `/versorgung`, `/governance`, `/indikatoren` faktisch unerreichbar, Modus springt bei jedem Reload zurück.
3. **Der Produktkern ist strukturell unbeantwortet:** „Was kostet es mich pro Monat?" — `cost_impacts` hat kein €-Feld, der Haushalts-Check liefert bewusst keine €-Beträge, und das neue €-Modell auf /radar kennt das Haushaltsprofil nicht (generisches Pendler-/EFH-Profil). Zwei getrennte Halbsysteme.
4. **Der Radar wirkt lebendiger als er ist:** 4 von 6 Themenkanälen hängen an monatlichen/quartalsweisen/eingefrorenen Werten; 5 Indikatoren ohne Schwellen bleiben ewig „pending"; /woche zeigt bei monatlicher Datenkadenz fast nie echte Wochenveränderung.
5. **Live-Datenqualitätsproblem:** Auf /indikatoren stapeln sich bis zu **45× identische Quellenzeilen** pro Indikator (`item_sources` ohne Dedupe/Upsert) — widerspricht direkt dem Kernversprechen „kuratierte, ehrliche Quellenlage".

Positiv: 0 Console-Errors auf allen 15 Routen, echtes SPA-Routing, ehrliche Leerzustände durchgängig, PR #29 korrekt live (Manifest-Name, start_url, Nav-Reihenfolge), /status und /radar tagesaktuell.

---

## A. Blocker & Fehler (live)

| # | Schwere | Befund | Referenz |
|---|---|---|---|
| A1 | **Blocker** | `/icon.svg` → 404: Dockerfile-Runner-Stage kopiert nur `.next/standalone` + `.next/static`, nie `web/public/` → PWA-Icon fehlt, Installierbarkeit gebrochen. Fix: `COPY --from=builder /app/web/public ./web/public` + Rebuild | `v02/Dockerfile:25-31` |
| A2 | **Wichtig** | Quellen-Duplikate live: 587 „QUELLE:"-Zeilen auf /indikatoren, Top-Duplikate 45× (FRED-Gaspreis, EZB-DFR), 44× (Staatsschulden, Insolvenzen). Ursache: Ingestion schreibt pro Lauf neue `item_sources`-Zeile statt Upsert; `attachSources()` liest ohne Dedupe. Fix zweistufig: kurzfristig Map-Dedupe in `attachSources()`, ursächlich Upsert in der Ingestion | `v02/web/lib/public-data.ts:50-63`, `intelligence/src/db.py` |
| A3 | **Wichtig** | €-Modell überschätzt bei Datenlücken: `monthlyDeltaEur` normalisiert nicht auf Fensterlänge — bei >30-Tage-Abstand (Gaspreis-EFH wird nie aktualisiert!) wird das Delta als Monatswirkung ausgegeben, Faktor `windowDays/30` zu hoch. Fix: `delta * (30/windowDays)` oder Fenster >45 Tage → null | `v02/web/lib/cost-model.ts:30-63` |
| A4 | **Wichtig** | Toter Anker auf Startseite: `href="#aktuelle-lage"` zeigt ins Leere, wenn DB verbunden aber keine Impact-Ketten (`id` nur im Erfolgs-Branch gesetzt) | `v02/web/app/page.tsx:115,177,195-198` |
| A5 | Mittel | `computeInjectionPeriod` kann `Infinity` liefern (daysRemaining=0, Lücke offen) — Downstream-Guard unverifiziert | `v02/web/lib/indicator-zones.ts:181` |

## B. „Gebaut, aber nie verbunden" (eigene Kategorie — systemisches Muster)

| # | Schwere | Befund | Referenz |
|---|---|---|---|
| B1 | **Wichtig** | `WerkzeugeDrawer.tsx` vollständig implementiert, **von keiner Datei importiert** → /versorgung, /governance, /indikatoren ohne Navigationseinstieg (nur /profil-Deeplink für Eingeloggte mit Heizart) | `v02/web/components/WerkzeugeDrawer.tsx`, ui-standard.md:388-397 |
| B2 | **Wichtig** | `ModusSwitcher.tsx` nirgends gerendert; HouseholdCheck nutzt eigenen nicht-persistenten useState → Modus springt bei Reload auf „familie" zurück | `v02/web/components/ModusSwitcher.tsx`, `HouseholdCheck.tsx:44` |
| B3 | **Wichtig** | `wi-nina-zivilschutz-de`: Adapter aktiv, geseedet, Plausibility-Regel vorhanden — aber in keinem THEME_CHANNELS-Eintrag und nicht im WARNLAGE_CHANNEL → für Nutzer unsichtbar (von 3 Audits unabhängig bestätigt) | `v02/web/lib/themes.ts:111-116` |
| B4 | **Wichtig** | Pegelonline = Geister-Adapter: läuft aktiv, aber die 4 Indikator-IDs (`wi-pegelonline-koeln/-kaub/-duisburg-ruhrort/-magdeburg-strombruecke`) existieren in keiner Seed-Zeile → UPDATE rowcount 0, echte WSV-Daten werden bei jedem Lauf verworfen | `intelligence/src/adapters/pegelonline.py`, `db.py:392-395` |
| B5 | Mittel | Profil-PLZ wird erhoben, zählt in Profilvollständigkeit, wird aber **nirgends** genutzt (Grep bestätigt) — PII-Erhebung ohne Funktionsnutzen, parallel existiert das anonyme ws-region-Cookie als zweiter Regionsmechanismus | `v02/web/lib/profile.ts`, `personalization.ts:209-220` |

## C. Drifts (Produkt ↔ Doku ↔ Code)

| # | Schwere | Befund | Referenz |
|---|---|---|---|
| C1 | **Wichtig** | Hybrid-Navigation aus ui-standard.md (4 Primärpfade + Werkzeuge-Drawer + globaler Modus-Switcher) wurde nie gebaut — stattdessen flaches 7-Tab-Menü | `docs/ui-standard.md:373-411` vs. `TopNav.tsx:4-12` |
| C2 | **Wichtig** | Vier konkurrierende Lage-Sichten ohne Brücken: `/lage` (nicht in Nav!), `/lagebild` (Nav-Label „Lage"!), `/radar`, `/woche` — keine Querverlinkung, zwei Datenmodelle (kuratiert vs. abgeleitet) unerklärt nebeneinander; `computeVerdict`-Code dupliziert | `page.tsx:23-29` = `lage/page.tsx:23-29` |
| C3 | Mittel | ADR-040 sagt „source_health deferriert", real ist sie implementiert (Migration 0010, source_health.py) — Doku-Drift | `docs/adr/040-source-health-model.md` |
| C4 | Mittel | `docs/product.md` kennt /radar, /woche und die 4-stufige Wirkungsachse nicht (SoT-Sync-Lücke); Registry-Header `updated_at: 2026-06-09` stale | `docs/product.md`, `source_registry.yaml:1` |
| C5 | Mittel | Footer sagt weiter „WachSam Krisenradar" — widerspricht dem frischen Haushalts-Check-Wording aus PR #29 | `v02/web/components/Footer.tsx:9` |
| C6 | Mittel | Startseiten-Kontextzeile „Lage- und Auswirkungenradar" — bekannter Spec-Follow-up, offen | `page.tsx:107`, Spec 2026-07-07 |
| C7 | Mittel | Editorial-Layer hinkt Live-Layer 47+ Tage hinterher (Homepage-Hero „Stand 21. Mai", /lagebild „13./21. Mai" vs. /radar tagesaktuell) — ehrlich datiert, aber prominenteste Kachel wirkt eingefroren | Live-Audit |

## D. Logik-Schwächen (Radar-Kern)

| # | Schwere | Befund | Referenz |
|---|---|---|---|
| D1 | **Wichtig** | 5 von 20 Indikatoren ohne Schwellen → Zone ewig „pending": `wi-gaspreis-haushalt-efh`, `wi-strompreis-haushalt` (macht heizen-energie zum verdeckten 2er-Kanal), `wi-kraftstoffpreis-super-e5`, und `wi-bsi-cyberbedrohung`/`wi-vertrauen-politik` haben nie einen Live-Wert → Kanal Staat & Sicherheit faktisch tot (2 von 3 Treibern können nie zählen, dritter ist jährlich) | `warning-indicators.json`, `themes.ts:25-108` |
| D2 | **Wichtig** | Warnlage-Schwellen doppelt gepflegt: `computeWarnlageState` hardcodiert (≥3/≥4), DB-Schwellen (3/4) werden ignoriert — stimmen heute zufällig überein, divergieren aber silently bei redaktioneller Änderung; /radar und /indikatoren/wi-dwd-warnings-de können dann Verschiedenes zeigen | `themes.ts:138-143` vs. `radar-data.ts:248-251` |
| D3 | **Wichtig** | /woche strukturell wenig aussagekräftig: bei monatlicher Kadenz ist `stateWeekAgo === stateNow` der Normalfall (kein echter Stabilitäts-Beweis); Kanäle arbeit-wirtschaft und staat-vertrauen zeigen praktisch nie `changed` | `weekly.ts:38-110` |
| D4 | Mittel | Korroborations-Asymmetrie: EIN kritischer Indikator allein genügt für „Erhöht" (Korroboration nur für „Hoch") — bewusst entscheiden und dokumentieren | `themes.ts:120-135` |
| D5 | Mittel | `wi-inflation-vpi-de` zählt doppelt (lebensmittel + geld-zinsen): ein VPI-Ausreißer kippt zwei Karten und wirkt wie zwei unabhängige Befunde | `themes.ts:64,76` |
| D6 | Mittel | Plausibility-Regeln fehlen für 5 Indikatoren, davon 3 live gescort (BSI, Vertrauen, Düngemittel) — C1/C2-Gates blind | `plausibility_rules.py:19-57` |
| D7 | Mittel | DWD-Code „NRW" unverifiziert (nur MV/NS/SH live bestätigt) — falls real „NW", zeigt das größte Bundesland dauerhaft fälschlich „keine Warnungen"; bei nächster Großwetterlage prüfen | `dwd.py:15-32` |
| D8 | Nice | Reason-Text „X von 4 Indikatoren" zählt Indikatoren mit, die nie zählen können (E5) — leicht irreführend | `themes.ts:133` |
| D9 | Nice | Veralteter Kommentar „DWD hat keine Seed-Zeile" (stimmt seit Task 9 nicht mehr) | `radar-data.ts:204-206` |

## E. UI/UX/Erlebnis

| # | Schwere | Befund | Referenz |
|---|---|---|---|
| E1 | **Wichtig** | Mobile: Sticky-TopNav belegt 26 % des Viewports (220px/844px, 7 Tabs auf 3 Zeilen gewrapped, bleibt beim Scrollen stehen) — größter Einzelgrund, warum es „Website statt App" wirkt. Fix: Hamburger/Chip-Scroll-Leiste | `globals.css:452-454`, `TopNav.tsx` |
| E2 | **Wichtig** | Drei parallele Ampel-Skalen ohne Legende: Severity (5-stufig), ThemeState (4-stufig), Zone (3-stufig) — auf /indikatoren sogar zwei gleichzeitig auf derselben Karte; „Hoch" und „Kritisch" teilen dieselbe Farbe `--critical` | `SeverityBadge.tsx`, `ThemeStateBadge.tsx`, `indikatoren/page.tsx:36-48` |
| E3 | **Wichtig** | ThemeCard ohne Beleg: keine SourcePill, kein Stand (sinceDate:null für alle 6 Kanäle), €-Zeile steht unbelegt da; „Warum sehe ich das?" ist Sackgasse ohne Link zum Indikator | `ThemeCard.tsx:27-82`, `radar-data.ts:141` |
| E4 | **Wichtig** | 9 von 15 Routen ohne eigenen `<title>` (u. a. /radar, /kosten, /quellen) — Tabs ununterscheidbar, SEO schwach | jeweilige `page.tsx` ohne metadata-Export |
| E5 | Mittel | Startseite: Trust-Botschaft 4–5× wiederholt, PfadHub (die 4 Haushalts-Pfade!) am Seitenende statt oben, zwei optisch identische Verdicts ohne Kennzeichnung vorläufig/redaktionell | `page.tsx:105-228` |
| E6 | Mittel | €-Zeile nur für 2 von 6 Kanälen, ohne Hinweis warum die anderen keine haben | `radar-data.ts:65-68` |
| E7 | Mittel | /radar bei ruhiger Lage: Grid komplett ausgeblendet — der Umfang des Radars wird unsichtbar; besser: Karten unbetont zeigen | `radar/page.tsx:42-54` |
| E8 | Mittel | RegionSwitcher-Label „Bundesland" suggeriert Filterung aller Kanäle, filtert aber nur die Warnlage | `RegionSwitcher.tsx:28` |
| E9 | Mittel | /woche ohne Links zu den /radar-Karten (kein Vertiefungspfad) | `woche/page.tsx:50-74` |
| E10 | Nice | „DATENAKTUALITÄT" bricht mobil hässlich um; `.drawer-close` ohne Touch-Mindestmaß (relevant sobald Drawer aktiviert wird); „Rentebeziehende" ungewöhnliches Deutsch; HomeStorySteps redundant zu PfadHub | diverse |

## F. Editorial/Sprache

| # | Schwere | Befund | Referenz |
|---|---|---|---|
| F1 | **Wichtig** | Pseudoexaktheit: Die als „ANNAHME, konservativ" markierten Schwellen (NINA 25/100, DWD 3/4) erreichen die Bürger-UI nicht — `thresholdMethod` liegt in der DB, wird aber nie gerendert; wirkt so kalibriert wie ADAC-Schwellen. Fix: Hinweiszeile „Vorläufiger Schwellenwert — noch nicht kalibriert" im Schwellen-Panel | `indikatoren/[id]/page.tsx:27,91-93`, `schema/index.ts:237` |
| F2 | **Wichtig** | Doppelvokabular: „Beobachten"/„Erhöht" wortgleich in beiden Skalen, Top-Stufe „Hoch" vs. „Kritisch/Eskalierend" in derselben Farbe — Disclaimer auf /radar oder Umbenennung der Top-Stufe | `themes.ts:9-14` vs. `SeverityBadge.tsx:1-7` |
| F3 | Mittel | leadText.hoch von heizen-energie sagt „kritisch", obwohl Badge „Hoch" heißt (einziger Kanal mit diesem Bruch) | `themes.ts:57` |
| F4 | Mittel | Neue Indikatoren ohne `zone_text_*`-Erklärsätze (ThresholdBar zeigt nur nackte Zahlen); „(near-real-time)" englisch statt „(fortlaufend aktualisiert)"; NINA/MoWaS/BBK unerklärt | `warning-indicators.json:481-521` |
| F5 | Nice | €-Zahl steht vor der Annahme — besser „≈ +8 €/Monat (Ø-Pendlerprofil)" direkt in der Wertzeile | `ThemeCard.tsx:70-73` |

## G. Ideen aus dem Wettbewerbs-Scan

⚠️ worldmonitor (koala73/worldmonitor, worldmonitor.app) ist **AGPL-3.0 + Marke** — ausschließlich abstrakte Konzepte übernehmbar, nie Code/Assets/Texte/Design.

Top-Ideen, priorisiert nach Fit zum Haushalts-Kern (S/M/L = Aufwand):

1. **Custom Watchlist** (worldmonitor, abstrakt, S): Nutzer markiert 3–5 Vitalwerte/Kanäle, Startseite priorisiert danach — erster echter Account-Mehrwert
2. **Schwellen-Preisalarm** (Clever-Tanken/ADAC, S): Push/Mail wenn persönlicher Wert (z. B. Diesel regional) selbstgesetzte Schwelle reißt
3. **Testalarm im Onboarding** (KATWARN, S): „So sieht eine echte Warnung aus" — Vertrauensaufbau vor dem Ernstfall
4. **„Meine Inflationsrate" ohne Login** (Truflation/ONS, M): persönliche Rate vs. Destatis-Durchschnitt, Konto nur zum Speichern — perfekter Einstiegs-Hook, deckt sich mit dem geplanten Haushalts-€-Tool
5. **Korrelations-Gate für Alerts** (worldmonitor, abstrakt, M): Push nur bei ≥2 unabhängig kippenden Signalen — die Korroborations-Logik existiert bereits in themes.ts!
6. **Digest mit Frequenz-/Kanalwahl** (worldmonitor Pro, abstrakt, S–M): täglich/wöchentlich per Mail — /woche ist die fertige Inhaltsbasis
7. **Mehrfach-Orte** (NINA, M): Wohnort/Arbeitsort/Elternhaus, Filterung on-device, explizit kommuniziert „keine PII an Server" als Vertrauensanker
8. **Eine Engine, mehrere Linsen** (worldmonitor, abstrakt, M): Haushaltstyp-Ansichten (Mieter/Eigenheim/Rentner/Pendler) gewichten dieselben Daten um — ModusSwitcher-Grundlage existiert (ist nur nicht eingebunden, siehe B2)
9. **Vertrauen explizit kommunizieren** (Finanzguru-Muster, S): DSGVO/EU-Hosting/keine-PII nicht nur tun, sondern sichtbar sagen
10. **Was-wäre-wenn-Rechner** (worldmonitor Pro, abstrakt, L): „Gaspreis +20 % → dein Budget" auf Basis vorhandener Kaskaden — Premium-Kandidat

## H. Daten-Roadmap (Top-Quellen, Aufwand aufsteigend)

1. **Pegelonline-Seed nachziehen** — 4 JSON-Zeilen, macht bereits laufende Daten sichtbar (behebt B4)
2. **Destatis-Lebensmittel-Teilindex** — die 12-Kategorien-Tabelle wird schon abgerufen, nur die Nahrungsmittel-Zeile wird verworfen (`destatis.py:228-238`) — billigste Kanal-Belebung überhaupt
3. **BDEW-Werte turnusmäßig pflegen** (eingefroren auf April 2026) + Frische-Fenster dokumentieren
4. **FAO-CSV-URL robuster** (sfvrsn-Bruchrisiko)
5. **BfArM-Lieferengpässe** — hohe Haushaltsrelevanz, aber erst Doku/Endpunkt verifizieren (HTTP 400 im Probe)
6. **SMARD-Doku neu prüfen** (blocked-until-docs, alter Pfad 404) — Spotpreis als Frühindikator Haushaltsstrom
7. **BA-Statistik regional** (URL bestätigt, Format unklar)
8. **ENTSO-E** (API-Key-Hürde, indirekter Bezug — niedrigste Prio)

Blocker laut Regel „API-Doku ist Gesetz": Mieten/Nebenkosten und ÖPNV/Deutschlandticket haben keine bekannte kostenlose Bundes-API — Recherche vor Priorisierung.

---

## Priorisierte Empfehlung (Wellen-Vorschlag)

**Welle 1 — Sofort-Fixes (klein, hoher Hebel, keine Produktentscheidung):**
A1 Dockerfile/icon.svg · A2 Quellen-Dedupe (kurzfristig attachSources, ursächlich Ingestion-Upsert) · A3 cost-model-Fensternormierung · B3 NINA sichtbar machen (in Warnlage-Kanal einhängen) · B4 Pegelonline-Seed · H2 Lebensmittel-Teilindex · F1 Annahme-Hinweis · D2 Warnlage-Schwellen aus DB · A4 toter Anker · C5/C6 Wording-Reste · E4 Seitentitel

**Welle 2 — UX-Substanz (mittel):**
E1 Mobile-Nav kompakt · B1/B2 Drawer + ModusSwitcher einbinden (Komponenten existieren!) · E2/F2 eine Skalen-Legende + Vokabular-Entscheidung · E3 ThemeCard mit Stand/Quelle/Indikator-Link · C2 Lage-Sichten verbinden (mind. Querverlinkung + Nav-Label-Fix) · E5 Startseiten-Redundanz straffen, PfadHub hoch · D1 Schwellen kalibrieren oder Kanäle ehrlich verkleinern

**Welle 3 — Produktentscheidungen (Jean nötig, dann bauen):**
1. **€-Kernfrage:** persönliche €-Spanne aus Haushaltsprofil (verbindet cost-model + HouseholdCheck; der alte „keine Euro-Beträge"-Boundary-Text widerspricht dem neueren Radar-Plan — Entscheidung nötig) 
2. **Account-Mehrwert:** Watchlist + Digest + Schwellen-Alarm (Ideen G1/G2/G6) als Member-Kern — heute lohnt der Login nicht
3. **Lage-Sichten konsolidieren:** 4 Sichten → klare Rollen oder Zusammenlegung
4. PLZ: nutzen (RegionSwitcher-Vorbelegung) oder streichen (Datensparsamkeit)

---

*Alle Einzel-Reports der 7 Auditoren liegen in den Task-Outputs dieser Session; dieser Report ist die deduplizierte Synthese. Nichts wurde verändert — reine Bestandsaufnahme.*
