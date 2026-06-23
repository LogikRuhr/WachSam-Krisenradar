# Produkt — WachSam

> WachSam ist ein persönlicher Haushalts-Krisencheck für Deutschland.
>
> Leitfrage: Was betrifft meinen Haushalt, was kostet es ungefähr pro Monat, und was kann ich konkret tun?

Aktuelle Produktwahrheit: `docs/product-current.md`. Dieses File operationalisiert die ältere Source-of-Truth-Doku für die aktuelle `v02/`-Arbeitsbasis. Historische v0.1/v0.2-/Cutover-Passagen bleiben Kontext, steuern aber keine neue Arbeit, wenn sie der Haushaltscheck-Richtung widersprechen.

## Kurzbeschreibung

WachSam übersetzt Krisen, Preisentwicklungen, Infrastrukturprobleme und gesellschaftliche Spannungen in eine konkrete Haushaltsfrage: Welche Belastung ist für Menschen in Deutschland wahrscheinlich relevant, welche Kostenrichtung ist plausibel und welcher nächste Prüfschritt hilft im Alltag?

Die Plattform ordnet Signale nicht als Nachrichtenstrom ein, sondern als Wirkungspfad für Haushalte:

- Was betrifft meinen Haushalt wahrscheinlich?
- Was kann teurer oder knapper werden?
- Welche Systeme erklären diese Wirkung?
- Wie belastbar ist die Einschätzung?
- Welche ruhige Maßnahme oder Prüfung ist sinnvoll?

## Vision

WachSam soll normalen Menschen helfen, komplexe Entwicklungen als konkrete Alltagsfolgen zu verstehen. Der Einstieg ist nicht die Krise selbst, sondern die Frage nach Haushalt, Kosten, Versorgung, Zeitfenster und Handlungsoption.

WachSam soll:

- Orientierung geben, ohne Panik zu erzeugen
- Kosten- und Versorgungsrisiken greifbar machen
- Wirkungsketten sichtbar machen
- Unsicherheit und Quellenstand offen zeigen
- rationale Entscheidungen im Haushalt unterstützen

## Mission

Globale Krisen und systemische Risiken in konkrete, verständliche und alltagsrelevante Auswirkungen für Deutschland übersetzen.

## Kernidentität

WachSam ist:

- ein Haushalts-Krisencheck für Deutschland
- ein Kosten- und Versorgungsradar für Bürger, Familien und kleine Unternehmen
- eine ruhige Übersetzungsschicht von Signal → Deutschland-Relevanz → Haushaltswirkung
- ein Quellen- und Unsicherheitsfenster für alltagsrelevante Risiken
- ein Werkzeug für konkrete Prüf- und Vorbereitungsentscheidungen

Guardrail: WachSam bleibt ruhig, quellenbasiert und haushaltsbezogen. Es wird nicht zum generischen Krisen-Dashboard, Newsfeed, militärischen OSINT-Tool, Prepper-Forum oder politischen Kampfprojekt.

## Kernprinzip

WachSam zeigt nicht primär Ereignisse — sondern deren Auswirkungen auf Deutschland und deutsche Haushalte.

Grundlogik:

```
Globales Signal
  → Deutschland-Relevanz
  → betroffene Systeme
  → Haushaltsauswirkung
  → Mehrkosten / Versorgungsrisiko / Bürgermaßnahmen
  → Confidence & Unsicherheit
```

## Zielgruppen

Bürger, Haushalte, Familien, Arbeitnehmer und Pendler, kleine Unternehmen und Selbstständige. Menschen, die verstehen möchten, warum Dinge teurer werden, warum Systeme instabil wirken, welche Risiken realistisch sind und welche Auswirkungen Krisen auf den eigenen Alltag haben könnten.

### Bürger & Haushalte

Menschen, die verstehen möchten:

- welche Entwicklungen ihren Alltag beeinflussen könnten
- warum Preise steigen
- wo Risiken entstehen
- wie sich Krisen gegenseitig verstärken

### Familien

Menschen mit Verantwortung für Versorgung, Finanzen, Sicherheit, Stabilität und Planung.

### Arbeitnehmer & Pendler

Menschen, die Auswirkungen auf Energie, Mobilität, Arbeitsmarkt, Inflation, Industrie und Versorgung einschätzen wollen.

### Kleine Unternehmen & Selbstständige

Menschen, die Kostenrisiken, Lieferkettenprobleme, Branchenstress, Energiepreise und wirtschaftliche Belastungen früh erkennen möchten.

## Kernproblem

Moderne Krisen wirken nicht isoliert. Deutschland ist gleichzeitig betroffen von:

- Energieproblemen
- Inflation
- Rohstoffabhängigkeiten
- Lieferkettenstress
- geopolitischen Konflikten
- Infrastrukturproblemen
- demografischem Druck
- gesellschaftlicher Polarisierung
- wirtschaftlicher Schwäche

Diese Entwicklungen verstärken sich gegenseitig. Normale Nachrichten zeigen einzelne Ereignisse. WachSam analysiert Zusammenhänge, Kaskaden und Auswirkungen.

## Was WachSam macht

### 1. Ereignisse analysieren

WachSam beobachtet geopolitische Entwicklungen, Energieversorgung, Lieferketten, Rohstoffe, Finanzmärkte, Klimaextreme, Infrastrukturprobleme und gesellschaftliche Spannungen.

### 2. Deutschland-Relevanz bewerten

Nicht jede Krise ist für Deutschland gleich relevant. WachSam bewertet direkte und indirekte Auswirkungen, Zeitverzögerungen, betroffene Systeme und mögliche Verstärkungseffekte.

### 3. Kaskaden erkennen

WachSam analysiert, wie sich Krisen gegenseitig verstärken.

```
Energiepreise
→ Transportkosten
→ Lebensmittelpreise
→ Kaufkraftverlust
→ gesellschaftlicher Druck
```

```
China-Exportrestriktionen
→ Rohstoffmangel
→ Industrieprobleme
→ Arbeitsplatzrisiken
```

### 4. Systemstress sichtbar machen

WachSam zeigt, welche Bereiche Deutschlands unter Druck stehen, wie hoch die Belastung ist und welche Systeme besonders verwundbar sind. Methodisch verbindlich sind die zehn Bereiche aus `docs/# WachSam — Logik, Funktion & Metho.md`: Energie, Lebensmittel, Mobilität, Gesundheit, Infrastruktur, Industrie, Logistik, Finanzen, Arbeit, Gesellschaft. Die acht Beispiele in `docs/# WachSam.md` sind ein Auszug daraus.

### 5. Alltagseinordnung liefern

WachSam beantwortet, was das für Haushalte bedeutet, was teurer werden könnte, wo Engpässe entstehen könnten, welche Risiken steigen, was beobachtet werden sollte und welche Vorbereitung sinnvoll ist.

## Wie WachSam funktioniert

### 1. Datensammlung

WachSam nutzt offizielle Behörden, internationale Institutionen, Wirtschaftsdaten, Nachrichtenquellen, Infrastrukturinformationen, OSINT-Quellen und Marktindikatoren. Die konkrete Quellen-Klassen-Liste und ihre v0.1-Belegung steht in `docs/methodology.md`.

### 2. Strukturierung

Ereignisse werden klassifiziert nach Kategorie, Region, Relevanz, Zeitfenster, Systembezug und Quellenqualität.

### 3. Kaskadenanalyse

Die Plattform erkennt Ursache-Wirkung-Beziehungen, Verstärkungseffekte, Parallelbelastungen, Abhängigkeiten und Verzögerungseffekte.

### 4. Deutschland-Impact-Modell

WachSam bewertet deutsche Verwundbarkeit, Abhängigkeiten, Belastung kritischer Systeme und mögliche Auswirkungen auf Bürger.

### 5. Risiko- & Confidence-Bewertung

Jede Einschätzung erhält Risikostufe, Eintrittswahrscheinlichkeit, Zeithorizont, Quellenlage und Confidence Score. Detaillierte Skalen in `docs/methodology.md`.

## Kernfunktionen

Die SoT führt fünf benannte Kernfunktionen. v0.1 implementiert sie über sechs Sections plus Source-Footer.

### Deutschland-Lagebild

Aktueller Systemstress in den zehn Systembereichen.

### Kaskadenansicht

Zeigt, welche Systeme zusammenhängen, welche Entwicklungen sich verstärken und wo Risiken entstehen.

### Haushaltsauswirkungen

Konkrete Alltagseinordnung: Kosten, Versorgung, Mobilität, Risiken, mögliche Auswirkungen.

### Frühwarnsystem

Erkennt steigende Risiken, neue Belastungen, kritische Schwellenwerte und Verstärkungseffekte.

**v0.1-Status (bis 2026-05-22 gültig):** Frühwarnsystem ist als Produkt-Funktion in der SoT definiert. v0.1 deckt es **nur teilweise** ab — derzeit indirekt über das `trend`-Feld der Lagebild-Items (steigend / stabil / eskalierend). Es gibt **noch keine** eigenständige Schwellenwert-Engine und **keine** automatische Verstärkungs-Erkennung. Beides ist deferred und wird einer späteren Welle nach Stabilisierung des Causal-Linking-Layers (siehe `docs/methodology.md` und ADR-028) zugeordnet.

**v0.3-Status (ab 2026-05-22):** v0.3 macht die Threshold-Engine zur Welle-2-Pflicht — Live-Ingestion liefert Schwellenwert-Vergleiche gegen die acht Frühwarnindikatoren, Editorial-Approval schaltet Übergänge frei. Siehe ADR-038 (Ingestion-Architektur) und Abschnitt „v0.3 — Backend, Editorial-CMS, Live-Ingestion (2026-05-22)" am Ende dieser Datei.

### Quellen & Transparenz

WachSam zeigt Quellenlage, Unsicherheiten, Verifizierungsstatus und Confidence. Keine Behauptung ohne Kennzeichnung.

### v0.1-Implementations-Mapping

| SoT-Kernfunktion | v0.1-Section(s) | v0.1-Status |
|---|---|---|
| Deutschland-Lagebild | `LagebildSection` | live — 5 Items in `v01/data/lagebild.json`, `retrieved_at`-Provenance, Ajv-Schema-Gate |
| Kaskadenansicht | `CascadesSection` | live — kuratierte Ketten in `v01/src/data/cascades.ts` |
| Haushaltsauswirkungen | `CostRadarSection` + `SupplyRiskSection` + `ActionsSection` | live — 15 Items in `costImpacts.ts`, `supplyRisks.ts`, `actions.ts`; v0.1-Splittung von SoT-„Haushaltsauswirkungen" in Mehrkosten, Versorgungsrisiken und Bürgermaßnahmen |
| Frühwarnsystem | indirekt via `trend`-Feld auf Lagebild | teilweise — kein Standalone-Threshold-Engine |
| Quellen & Transparenz | `SourcesFooter` + Source-Pills + `ConfidenceBadge` + `SeverityBadge` + Provenance-Footer Lagebild | live — sechs Reading-Aids und Indikatoren |

Kostenradar und Versorgungsradar sind v0.1-Implementations-Splittungen der SoT-Funktion „Haushaltsauswirkungen". Sie bleiben in v0.1 separate Sections, weil sie methodisch unterschiedliche Aussagetypen tragen — keine konkurrierende Produkt-Definition.

### v0.2-Erweiterungen (Wave 8.0)

v0.2 operationalisiert die Intelligence-Schicht ohne Stack-Wechsel — kein Backend, keine Datenbank, keine Live-Ingestion. Die Erweiterungen schließen die Lücke zwischen Research-Layer (`reports/`, `intelligence/`) und Produkt-Layer (Sections, Datensätze).

| Erweiterung | v0.1 | v0.2 |
|---|---|---|
| Kaskaden | 4 sichtbar in `cascades.ts` | 12 vollständig in `v01/data/cascades.json` |
| Lagebild-Abdeckung | 6 Items, 6 Bereiche | 10 Items, 10 Bereiche (alle Systembereiche vertreten) |
| Severity | 4-stufig | 5-stufig (`eskalierend` neu für eskalierende Strukturkrisen) |
| Governance | nicht im Produkt | `GovernanceSection` mit 11 Fällen aus `v01/data/governance.json` |
| Frühwarnindikatoren | nur als `trend`-Feld | `WarningIndicatorsSection` mit 8 Schwellenwerten aus `v01/data/warning-indicators.json` |
| Pflichtfeld `germany_relevance` | fehlt | strukturiertes Objekt mit `direct`, `systems_affected`, `time_to_impact`, `description` |
| Pflichtfeld `methodology_tag` | nicht durchgesetzt | `steep` / `rca` / `bia` / `fmea` / `scenario` als Pflichtfeld auf Layer-2-Items |
| Layer-Trennung | implizit | explizit dokumentiert in `intelligence/layer-architecture.md` |

Die acht v0.2-Sections folgen weiterhin der TOC-Disziplin (`docs/ui-standard.md`): nummerierte Bereiche 01–08, eine Section pro Kernfunktion, keine Section-Vermischung.

Bindende ADRs für die v0.2-Erweiterungen: `docs/adr/031-governance-module.md` (Governance-Section) und `docs/adr/032-warning-indicators.md` (WarningIndicator-Typ und statische Schwellenwert-Übersicht).

## Sechs Hauptbereiche (v0.1-Implementation)

Die folgenden sechs Bereiche sind die konkrete v0.1-Implementation der oben aufgeführten fünf SoT-Kernfunktionen — keine konkurrierende Produkt-Definition. Sie operationalisieren die SoT-Funktionen in die statische Webapp `v01/`.

### 1. Lagebild Deutschland

Aktueller Systemstress, betroffene Bereiche, wichtigste Belastungen, gesellschaftlicher und wirtschaftlicher Druck. Zehn Systembereiche: Energie, Lebensmittel, Mobilität, Gesundheit, Infrastruktur, Industrie, Logistik, Finanzen, Arbeit, Gesellschaft.

### 2. Kostenradar

Was teurer werden könnte. Betroffene Haushaltsbereiche, mögliche Belastungen, Zeitfenster, Confidence. Beispiele: Strom, Gas und Heizung, Lebensmittel, Tanken, Versicherungen, Elektronik, Reparaturen, Logistik.

### 3. Versorgungsradar

Was instabil, langsamer oder knapp werden könnte. Beispiele: Medikamente, Ersatzteile, Elektronik, Energieversorgung, medizinische Versorgung, Infrastruktur, Lieferketten.

### 4. Kaskaden

Ursache-Wirkung-Ketten. Verstärkungseffekte, Parallelbelastungen, Deutschland-Auswirkungen. Kaskaden können parallel wirken, sich gegenseitig verstärken, zeitverzögert auftreten und mehrere Systeme gleichzeitig betreffen.

### 5. Bürgermaßnahmen

Sinnvolle Vorbereitung, praktische Maßnahmen, ruhige Handlungsempfehlungen. Keine Panikmache, keine extremen Prepper-Empfehlungen. Beispielklassen: Energiekosten und Verträge prüfen, finanzielle Reserve verbessern, Vorräte für ein bis zwei Wochen, Medikamentenversorgung beobachten, wichtige Dokumente sichern.

### 6. Quellen und Confidence

Quellenhinweis, Confidence, Unsicherheiten, Verifikationsstatus. WachSam arbeitet faktenbasiert, probabilistisch und transparent. WachSam behauptet weder sichere Vorhersagen noch garantierte Entwicklungen.

## Zwei v0.2-Hauptbereiche (Wave 8.0)

Die folgenden beiden Bereiche sind die konkrete v0.2-Implementation der Intelligence-Schicht-Operationalisierung. Sie ergänzen die sechs v0.1-Bereiche; die TOC-Reihenfolge ist 01 Lagebild · 02 Kostenradar · 03 Versorgung · 04 Kaskaden · 05 Bürgermaßnahmen · 06 Quellen · 07 Governance · 08 Frühwarnindikatoren.

### 7. Governance & Vertrauenslage

Strukturierter Vergleich zwischen politischer Ankündigung und Umsetzungsrealität — professionell, nicht polemisch. Pro Fall: Versprechen, Realität, Haushaltswirkung, Confidence, Quelle, optional verknüpfte Kaskade. Daten in `v01/data/governance.json`, Typ in `v01/src/types/wachsam.ts`, bindende Architekturentscheidung in `docs/adr/031-governance-module.md`.

### 8. Frühwarnindikatoren

Statische Übersicht der acht Schwellenwerte, bei denen WachSam einen Bereich höher klassifizieren würde — Gasspeicher-Füllstand, FAO Food Price Index, Arbeitslose Deutschland, VPI, Brent Rohöl, BSI Cyberbedrohungslage, Vertrauen in politische Steuerung, FAO Düngemittel-Preis. v0.2 zeigt sie als Schwellenwert-Dokumentation, **nicht** als Live-Dashboard — keine automatische Threshold-Engine. Daten in `v01/data/warning-indicators.json`, Typ in `v01/src/types/wachsam.ts`, bindende Architekturentscheidung in `docs/adr/032-warning-indicators.md`.

## Welche Probleme WachSam löst

### Informationsüberlastung

Menschen werden täglich mit Nachrichten, Schlagzeilen, Krisenmeldungen, Meinungen und Social-Media-Inhalten überflutet. WachSam priorisiert Relevanz statt Lautstärke.

### Fehlende Zusammenhänge

Normale News erklären selten, warum etwas passiert, welche Folgen entstehen, welche Systeme betroffen sind und wie Krisen zusammenhängen. WachSam analysiert Ursachen, Verbindungen und Auswirkungen.

### Fehlende Alltagseinordnung

Viele Bürger wissen nicht, welche Krisen tatsächlich relevant sind, was Auswirkungen auf ihren Alltag haben könnte und welche Risiken realistisch sind. WachSam übersetzt komplexe Entwicklungen in praktische Bedeutung.

## Der Mehrwert

WachSam übersetzt komplexe Krisendynamiken in eine kurze Entscheidungshilfe für Haushalte:

```text
„Was betrifft meinen Haushalt, was kostet es ungefähr pro Monat, und was kann ich konkret tun?"
```

Der Mehrwert entsteht durch die Verbindung von Quelle, Stand, Wirkungskette, Kostenrichtung, Versorgungsrisiko und ruhigem Prüfschritt. Die App soll zuerst zeigen, was relevant ist — und ebenso klar markieren, was wahrscheinlich nicht betrifft oder nur unsicher einzuordnen ist.

## Unterschiede zu klassischen News

| News | WachSam |
|---|---|
| Einzelereignisse | Zusammenhänge |
| Schlagzeilen | Auswirkungen |
| Aufmerksamkeit | Einordnung |
| kurzfristig | systemisch |
| global abstrakt | Deutschland-fokussiert |
| Informationsflut | Priorisierung |

## Unterschiede zu klassischen Prepper-Plattformen

| Prepper-Inhalte | WachSam |
|---|---|
| Angstfokus | Analysefokus |
| Extreme Szenarien | Wahrscheinlichkeiten |
| Spekulation | Quellen & Confidence |
| Ideologie | Systemanalyse |
| Panik | Orientierung |

## Produktphilosophie

WachSam arbeitet als ruhige Übersetzungsschicht: kritisch, faktenbasiert, haushaltsnah und transparent über Unsicherheit. Jede starke Aussage braucht Quelle, Stand und Confidence; jede Handlungsempfehlung bleibt ein Prüfschritt, keine individuelle Beratung.

## Produktstil

WachSam soll wirken:

- ruhig und brauchbar
- sachlich und verständlich
- quellenbasiert und überprüfbar
- konkret genug für Alltagsentscheidungen
- zurückhaltend bei Unsicherheit

Guardrails: kein Doomscrolling, kein Militär-OSINT-Look, kein Clickbait, keine Panik, keine politischen Kampfbegriffe, keine Fake-Live-Sprache.

## Produktkern in einem Satz

WachSam ist ein Deutschland-zentriertes Crisis-Intelligence-System, das globale Krisen und systemische Risiken in verständliche, alltagsrelevante Auswirkungen für deutsche Haushalte übersetzt.

Operationale Ausformulierung: WachSam analysiert globale Krisen, Kaskaden und Systemrisiken und bewertet deren mögliche Auswirkungen auf Kosten, Versorgung und Stabilität deutscher Haushalte.

## v0.1-Scope

v0.1 ist eine statische Webapp mit einem kontrollierten Seed-Datensatz. Sie arbeitet lokal, kontrolliert, ohne autonome Systeme, ohne KI-Agenten und ohne Live-Ingestion. Folgendes kommt frühestens in späteren Versionen:

- Backend, Datenbank, APIs
- Live-Daten-Ingestion
- Authentifizierung, Nutzerprofile
- KI-Agenten oder autonome Systeme

Architekturprinzip: erst stabile Webapp und verständliche Haushaltslogik — komplexere Systeme später.

### v0.3-Scope-Erweiterung (2026-05-22)

Mit dem Backend-Pivot vom 2026-05-22 (siehe ADR-034) wird der v0.1-Scope für v0.3 gezielt geöffnet. Die ursprünglich „frühestens in späteren Versionen" gelisteten Punkte werden in zwei klar getrennten Wellen umgesetzt:

- **Welle 1 (v0.3.0):** Editorial-CMS, Public-API, Auth, Haushalts-Profile.
- **Welle 2 (v0.3.x):** Notifications und Live-Ingestion mit Adapter-Layer.

Stack: Next.js 15 + Postgres 16 + Drizzle + Auth.js v5 + Resend, betrieben in Docker auf dem IONOS-VPS. Das neue Frontend lebt unter `v02/` neben `v01/`, der Wechsel erfolgt als Hard-Cutover (siehe ADR-037). Die vollständige Sektion „v0.3 — Backend, Editorial-CMS, Live-Ingestion (2026-05-22)" steht am Ende dieser Datei; bindende Architekturentscheidungen: ADR-034 (Pivot), ADR-035 (Postgres), ADR-036 (Stack TS + Python), ADR-037 (Cutover), ADR-038 (Ingestion-Architektur).

Architekturprinzip bleibt erhalten: Haushaltslogik, UI-Disziplin und Quellentransparenz aus v0.1/v0.2 sind die Grundlage; v0.3 ergänzt Backend und Live-Schicht, ersetzt sie nicht.

## Langfristige Vision

WachSam soll werden:

- ein Deutschland-Lagebild für Bürger
- ein verständliches Krisen- und Belastungsradar
- ein Haushalts-Impact-Monitor
- ein Systemstress-Analysewerkzeug
- eine faktenbasierte Bürger-Intelligence-Plattform

## v0.3 — Backend, Editorial-CMS, Live-Ingestion (2026-05-22)

Mit dem Backend-Pivot vom 2026-05-22 öffnet WachSam den v0.1/v0.2-Scope für eine dynamische, redaktionell kuratierte Plattform. v0.3 ergänzt v0.1/v0.2 — sie ersetzt die Produkt-Definition, die Methodik, die Sections und die Daten-Modelle **nicht**. Alle bestehenden Produkt-Funktionen (Lagebild, Kostenradar, Versorgungsradar, Kaskaden, Bürgermaßnahmen, Quellen & Transparenz, Governance, Frühwarnindikatoren) bleiben in Inhalt, Wording und UI-Disziplin unverändert.

### Backend-Funktionen (Pflicht)

v0.3 führt vier neue Pflicht-Funktionen ein, die als Backend-Schicht hinter den bestehenden Produkt-Funktionen liegen:

1. **Editorial-CMS.** Redaktionelle Pflege aller Layer-2-Daten (Lagebild, Kaskaden, Kosten, Versorgung, Maßnahmen, Governance, Frühwarnindikatoren). CMS ersetzt die statischen JSON-Files unter `v01/data/` durch eine Postgres-gestützte Editorial-Datenbank. Jeder Editorial-Stand durchläuft Schema-Validierung, Methodology-Gates (ADR-028) und Editorial-Approval, bevor er auf die Public-API gelangt.
2. **Auth.** Nutzer-Authentifizierung über Auth.js v5 (Magic-Link via Resend, Passkey-fähig). Keine Social-Logins in v0.3. Auth ist Voraussetzung für Profile und Notifications.
3. **Haushalts-Profile.** Nutzer können ein anonymisiertes Haushalts-Profil pflegen (Heizart, Region, Haushaltsgröße, optionale Interessensbereiche) — ausschließlich anonymisierte Scores, keine PII in Datenbanken (siehe globale Regel). Profile steuern die Personalisierung von Lagebild-, Kostenradar- und Versorgungsradar-Inhalten.
4. **Notifications.** Opt-in-Benachrichtigungen bei Severity-Wechseln, Schwellenwert-Überschreitungen und neu freigegebenen Editorial-Ständen. Transport via Resend (E-Mail); Push folgt frühestens nach Welle 2.

### Welle-1-vs-Welle-2-Mapping

v0.3 wird in zwei strikt getrennten Wellen ausgeliefert:

| Welle | Funktionen | Ziel |
|---|---|---|
| **Welle 1 (v0.3.0)** | Editorial-CMS, Public-API, Auth, Haushalts-Profile | Statische v0.1/v0.2-Daten in das CMS migrieren, API als Single Source für `v02/`-Frontend etablieren, Auth + Profile als personalisierungsfähige Schicht freischalten |
| **Welle 2 (v0.3.x)** | Notifications, Live-Ingestion | Adapter-Layer für die Quellen-Klassen aus `docs/methodology.md` aktivieren, Editorial-Gate für ingestierte Daten erzwingen, Threshold-Engine gegen die acht Frühwarnindikatoren scharfschalten, Notifications auf Severity- und Schwellenwert-Übergänge auslösen |

Welle 1 ist Voraussetzung für Welle 2 — ohne stabiles Editorial-Gate werden keine Live-Daten in die Public-API zugelassen.

### Was unverändert bleibt

v0.3 lässt die folgenden Bausteine aus v0.1/v0.2 inhaltlich unverändert:

- **Produkt-Funktionen.** Alle fünf SoT-Kernfunktionen (Deutschland-Lagebild, Kaskadenansicht, Haushaltsauswirkungen, Frühwarnsystem, Quellen & Transparenz) sowie die beiden v0.2-Erweiterungen (Governance & Vertrauenslage, Frühwarnindikatoren).
- **Daten-Modelle.** Die zehn Systembereiche, die fünfstufige Severity-Skala, das dreistufige Confidence-System, die vier Zeithorizonte, die Pflichtfelder `germany_relevance` und `methodology_tag` bleiben deckungsgleich mit v0.2. Schema-Migration erfolgt 1:1 von JSON nach Postgres.
- **UI-Disziplin.** Brand, Typografie, Strich-Marker, Section-Header-Pattern, Detail-Routes-Pattern, Source-Pills, Confidence-/Severity-Badges, Provenance-Footer — alles aus `docs/brand.md` und `docs/ui-standard.md` bleibt verbindlich. `v02/` übernimmt die v0.2-Sections und ergänzt sie um personalisierte Sichten und Notification-Center.
- **Quellen- und Transparenz-Regeln.** Jedes Item zeigt weiterhin mindestens eine Quelle mit URL und Stand. Erfundene Quellen bleiben verboten. Editorial-Approval ergänzt — ersetzt nicht — die Quellenpflicht.
- **Methodik.** Die Methodik-Doku in `docs/methodology.md` bleibt verbindlich. v0.3 fügt eine Live-Ingestion- und Editorial-Layer-Sektion am Ende von `methodology.md` hinzu (siehe dort).

### Bindende ADRs

- **ADR-034 — Backend-Pivot.** Begründet den Wechsel von statisch auf Backend-gestützt.
- **ADR-035 — Postgres 16.** Persistenz-Entscheidung, Editorial-Datenbank.
- **ADR-036 — Stack TS + Python.** Next.js 15 als Frontend/API-Layer (TypeScript), Python-Adapter im Ingestion-Layer.
- **ADR-037 — Hard-Cutover v01/ → v02/.** Migrationsmodus, keine Parallelbetrieb-Phase.
- **ADR-038 — Ingestion-Architektur.** Adapter-Layer, Editorial-Gate, Threshold-Engine, Notification-Trigger.
- **ADR-039 — Intelligence Core.** LLM-gestützte Signalanalyse mit Vertex AI Gemini, Multi-Rollen-Analyse, Pflicht-Output-Schema, Editorial-Gate. Overridet "Keine Autonomie" und "Kein LLM-Runtime" aus `rules/architecture-principles.md` für die Intelligence-Pipeline unter `v02/intelligence/`.

## Intelligence Core (ADR-039, 2026-05-26)

Mit ADR-039 erhält WachSam eine Intelligence-Pipeline, die über manuelles Editorial hinausgeht. Die Pipeline nutzt Google Vertex AI (Gemini 2.5 Flash) als Remote-LLM für strukturierte Extraktion und Multi-Rollen-Analyse. Kein lokaler LLM. Kein Auto-Publish.

### Pipeline

Strukturierte Quellen (Destatis, BNetzA, FAO) → Python-Adapter → Rohdaten → Gemini Multi-Role-Analyse → Pflicht-Output-Schema (Pydantic) → Draft in Editorial Queue → Redaktionelle Prüfung → Published.

### Rollen-System

Fünf Kern-Rollen für disziplinierte Analyse: Systemic Risk Analyst, Strategic Foresight Analyst, Germany-Relevance & Haushalts-Impact Translator, Governance Gap Analyst, Quantitative Risk Manager. Vollständige Bibliothek in `intelligence/prompt-library.md` und `intelligence/roles-and-skills.md`.

### Specs

Intelligence-Specs liegen unter `intelligence/` (Repo-Root): Rollen, Prompts, Templates, Output-Schema, Architektur. Python-Code liegt unter `v02/intelligence/`.

### Was unverändert bleibt

Alle bestehenden Produkt-Funktionen, Daten-Modelle, Skalen, UI-Disziplin und Quellen-Regeln bleiben unverändert. Die Intelligence-Pipeline ist ein Analyst-Tool, das dem Editorial-CMS zuarbeitet — sie ersetzt es nicht.
