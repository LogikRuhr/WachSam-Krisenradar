# Methodik — WachSam

> Wie WachSam globale Signale in verständliche Haushaltsauswirkungen übersetzt.
>
> Aktive Methodik-Erweiterung: v0.3-Sektion am Ende (Live-Ingestion, Editorial-Gate).

Die verbindliche Methodik-Definition liegt seit Wave 7.6-1 in den beiden Source-of-Truth-Files `docs/# WachSam.md` und `docs/# WachSam — Logik, Funktion & Metho.md`. Dieses File operationalisiert die SoT-Methodik für die kanonische Repo-Doku und das v0.1-Implementations-Mapping. Confidence-, Severity- und Zeitlogik werden hier als Tabellen geführt; die SoT-Prosa ist die Quelle, die Tabelle ist die kompakte Repräsentation, die deckungsgleich mit `v01/src/types/wachsam.ts` ist. Bei Konflikt zwischen Wording in `methodology.md` und SoT entscheidet die SoT.

## Grundfunktion der Plattform

WachSam sammelt, strukturiert und bewertet:

- globale Krisen
- wirtschaftliche Entwicklungen
- Infrastrukturprobleme
- Lieferkettenprobleme
- Rohstoffrisiken
- gesellschaftliche Spannungen
- Energie- und Versorgungsthemen

Ziel: verständliche Auswirkungen auf Deutschland und den Alltag deutscher Haushalte sichtbar machen.

## Grundlogik

```
Globales Signal
  → Deutschland-Relevanz
  → betroffene Systeme
  → Haushaltsauswirkung
  → Mehrkosten / Versorgungsrisiko / Bürgermaßnahmen
  → Confidence & Unsicherheit
```

WachSam bewertet nicht primär Ereignisse, sondern deren mögliche Auswirkungen auf deutsche Haushalte.

## 1. Signal-Erkennung

Ein Signal kann sein:

- geopolitisches Ereignis
- wirtschaftliche Entwicklung
- Rohstoffproblem
- Lieferkettenstörung
- Infrastrukturproblem
- Energieproblem
- regulatorische Änderung
- Klimaextrem
- gesellschaftliche Spannung

Konkrete Beispiele:

- steigende Gaspreise
- Rohstoffexportbeschränkungen
- LNG-Probleme
- Stromnetzprobleme
- Hafenstörungen
- Dürren
- Produktionsrückgänge

## 2. Deutschland-Relevanz

Pro Signal wird bewertet:

- Ist Deutschland betroffen?
- Wie direkt?
- Welche Systeme sind betroffen?
- Welche Abhängigkeiten existieren?
- Wie schnell könnten Auswirkungen sichtbar werden?

## 3. Systembewertung — zehn Bereiche

Energie · Lebensmittel · Mobilität · Gesundheit · Infrastruktur · Industrie · Logistik · Finanzen · Arbeit · Gesellschaft

Jedes Item ordnet sich genau einem Primärbereich zu. Folgewirkungen können weitere Bereiche markieren.

## 4. Kaskadenlogik

Ursache-Wirkung-Ketten — nicht isolierte Ereignisse. Kaskaden können:

- parallel wirken
- sich gegenseitig verstärken
- zeitverzögert auftreten
- mehrere Systeme gleichzeitig betreffen

Standardbeispiel:

```
Energiepreise steigen
  → Transportkosten steigen
  → Lebensmittelpreise steigen
  → Kaufkraft sinkt
  → Haushaltsbelastung steigt
```

Zweites Beispiel:

```
Rohstoffmangel
  → Industrieprobleme
  → Produktionsverzögerungen
  → Lieferprobleme
  → höhere Endpreise
```

## 5. Haushalts-Impact

System-Stress wird übersetzt in:

- Mehrkosten
- Versorgungsrisiken
- Stabilitätsrisiken
- Alltagsauswirkungen

Beispiele: höhere Stromkosten, steigende Lebensmittelpreise, längere Lieferzeiten, Medikamentenprobleme, Mobilitätskosten, Versicherungsanstiege.

## 6. Confidence & Unsicherheit

WachSam arbeitet probabilistisch. Jede Einschätzung trägt Confidence, Unsicherheit, Zeitfenster und Quellenstatus.

### Confidence-System

| Stufe | Bedeutung |
|---|---|
| **Hoch** | Bestätigte Daten, klare Auswirkungen, hohe Evidenzlage |
| **Mittel** | Mehrere Hinweise, erkennbare Muster, teilweise bestätigt |
| **Niedrig** | Geringe Datenlage, frühe Hinweise, hohe Unsicherheit |

### Severity-System (5-stufig ab v0.2)

| Stufe | Bedeutung |
|---|---|
| **Stabil** | Normale Lage |
| **Beobachten** | Frühe Belastungen oder Auffälligkeiten |
| **Erhöht** | Spürbare Risiken oder Belastungen |
| **Kritisch** | Starke Belastung oder erhebliche Risiken |
| **Eskalierend** | Aktive Eskalation; strukturelle oder beschleunigende Belastung (NEU v0.2 / Wave 8.0) |

Bis v0.1 vierstufig. Ab v0.2 fünfstufig; `eskalierend` ist für aktive Strukturkrisen (z.B. Kaskade L — Deindustrialisierung) reserviert und darf nicht synonym zu `kritisch` verwendet werden.

### Zeitlogik

| Stufe | Bedeutung |
|---|---|
| **Kurzfristig** | Tage bis wenige Wochen |
| **Wochen** | Wahrscheinliche Auswirkungen in mehreren Wochen |
| **Monate** | Mittelfristige Entwicklungen |
| **Langfristig** | Strukturelle Veränderungen |

## methodology_tag (Pflichtfeld ab v0.2)

Ab v0.2 trägt jedes Layer-2-Item (`v01/data/*.json`) ein `methodology_tag`-Feld, das die methodische Einordnung der Aussage offenlegt:

| Tag | Methodik |
|---|---|
| `steep` | Soziale-, Technologische-, Ökonomische-, Ökologische-, Politische-Analyse |
| `rca` | Root-Cause-Analyse |
| `bia` | Business-Impact-Analyse |
| `fmea` | Failure-Mode-and-Effects-Analyse |
| `scenario` | Szenario-Analyse |

Das Feld hat keinen UI-Effekt in v0.2, dient aber als methodische Pflicht-Auditspur — jeder Datenpunkt muss einer der fünf Methodiken zuordenbar sein.

## germany_relevance (Pflichtfeld ab v0.2)

Jedes Layer-2-Item trägt ein strukturiertes `germany_relevance`-Objekt:

```json
{
  "direct": true,
  "systems_affected": ["energie", "lebensmittel"],
  "time_to_impact": "wochen",
  "description": "DE-spezifische Einordnung, faktenbasiert"
}
```

- `direct`: ob Deutschland direkt betroffen ist (`true`) oder die Wirkung über Drittländer / globale Märkte indirekt eintritt (`false`).
- `systems_affected`: Liste der betroffenen Systembereiche als lowercase-Slug aus dem Zehn-Bereiche-Schema (`energie`, `lebensmittel`, `mobilitaet`, `gesundheit`, `infrastruktur`, `industrie`, `logistik`, `finanzen`, `arbeit`, `gesellschaft`).
- `time_to_impact`: erwartete Verzögerung bis zur sichtbaren Wirkung — gleicher Werte-Raum wie `Zeithorizont`.
- `description`: kurze DE-spezifische Einordnung, faktenbasiert, mit Quellenpflicht im Item.

## Layer-Architektur (ab v0.2 explizit)

- **Layer 1 — Research / Reports:** `reports/*.md`, `intelligence/*.md`. Quellen, Evidenz, Hintergrundanalysen. Keine direkte UI-Konsumtion.
- **Layer 2 — Structured Intelligence:** `v01/data/*.json`. Strukturierte Daten: Lagebild, Kaskaden, Kosten, Versorgung, Maßnahmen, Governance, Frühwarnindikatoren. Pflichtfelder `germany_relevance` und `methodology_tag`.
- **Layer 3 — UI / Produkt:** `v01/src/`. Sichtbare App, Sections, UX-Komponenten. Daten ausschließlich aus Layer 2.

Vollständige Layer-Definition: `intelligence/layer-architecture.md`.

## Bürgermaßnahmen

Ruhige, praktische, realistische Empfehlungen.

Beispielklassen:

- Energiekosten und Verträge prüfen
- finanzielle Reserve schrittweise verbessern
- Vorräte für ein bis zwei Wochen
- Medikamentenversorgung beobachten
- wichtige Dokumente sichern

Nicht: Panikmache, Extrem-Prepper-Empfehlungen, Weltuntergangslogik.

## Datenmethodik

WachSam nutzt:

- strukturierte Daten
- bekannte Abhängigkeiten
- Haushaltslogik
- Kaskadenmodelle
- Wahrscheinlichkeiten und Confidence-Bewertungen

WachSam nutzt NICHT:

- freie Fantasie
- unbelegte Behauptungen
- reine LLM-Texterzeugung als Inhaltsquelle

## Datenquellen

Mögliche Quellenklassen:

- Behörden (Bundestag, Bundesregierung, Bundesnetzagentur, BMWK, BMF, Destatis, BBK, BAKS)
- Wirtschaftsinstitute (IW Köln, ifo, IMK)
- Internationale Institutionen (FAO, IEA, IRC, UNICEF, Welthungerhilfe)
- Qualitätsmedien (Tagesschau, ZDF, Spiegel, Zeit, Handelsblatt, Capital, FAZ, BR24, MDR)
- Branchen- und Fachmedien
- OSINT-Quellen
- Marktindikatoren

Quellen dienen als Grundlage für Auswirkungen, nicht als reiner Newsfeed. Jedes Item zeigt mindestens eine Quelle mit URL und Stand. Erfundene Quellen sind verboten.

## v0.1-Datenmodell

Lokale TypeScript-Daten in `v01/src/data/`:

| Datei | Inhalt |
|---|---|
| `seed-meta.ts` | Stand und Disclaimer für den Seed-Datensatz |
| `lagebild.ts` | fünf Situationen (Lagebild Deutschland) |
| `costImpacts.ts` | fünf mögliche Mehrkosten |
| `supplyRisks.ts` | fünf Versorgungsrisiken |
| `cascades.ts` | kuratierte Kausalitätsketten |
| `actions.ts` | fünf Bürgermaßnahmen |

Daten sind als kontrollierter Seed-Datensatz markiert. v0.1 hat keine Live-Ingestion.

## v0.2-Datenmodell (additiv auf v0.1)

v0.2 verschiebt einen Teil der TypeScript-Inline-Daten zu JSON-Layer-2-Single-Sources unter `v01/data/`:

| Datei | Inhalt |
|---|---|
| `lagebild.json` | 10 Lagebild-Items (alle Systembereiche abgedeckt) |
| `cascades.json` | 12 Kaskaden A–L mit `germany_relevance`- und `methodology_tag`-Pflichtfeldern |
| `governance.json` | 11 Governance-/Vertrauenslage-Fälle (neu) |
| `warning-indicators.json` | 8 Frühwarnindikatoren mit Warn-/Kritisch-Schwellen (neu) |
| `costImpacts.json` | Mehrkosten (JSON-Migration aus `costImpacts.ts`) |

JSON-Schemas liegen unter `v01/data/schemas/`. Ajv-Validierung dient als Datenintegritäts-Gate. `supplyRisks.ts`, `actions.ts` und `seed-meta.ts` bleiben in v0.2 zunächst TypeScript; deren JSON-Migration ist in eine spätere Welle delegiert.

## Technische Logik v0.1

v0.1 arbeitet lokal, kontrolliert, ohne autonome Systeme, ohne KI-Agenten und ohne Live-Ingestion.

Verwendet werden:

- lokale TypeScript-Daten
- React-Komponenten
- strukturierte Haushalts-Impact-Daten

Operationaler Rahmen, Stack-Pin und Negativ-Liste stehen in `docs/product.md` (Sektion „v0.1-Scope").

## Architekturprinzip

WachSam baut zuerst:

1. verständliche Haushaltslogik
2. stabile UI
3. klare Datenstruktur

Erst später folgen Datenbank, APIs, Automatisierung, Live-Daten, komplexere Engines.

## Entwicklungsprinzipien

- kleine Schritte
- kontrollierte Daten
- kleine Datei-Scopes
- keine riesigen Refactors
- keine widersprüchlichen Richtungen
- erst stabile Webapp
- dann komplexere Systeme

## Hauptziel

WachSam soll Bürgern helfen:

- komplexe Entwicklungen besser zu verstehen
- Risiken früher zu erkennen
- Auswirkungen auf ihren Alltag einzuordnen
- rationale Entscheidungen zu treffen
- ohne Panik informiert zu bleiben

## Produktkern in einem Satz

WachSam analysiert globale Krisen, Kaskaden und Systemrisiken und bewertet deren mögliche Auswirkungen auf Kosten, Versorgung und Stabilität deutscher Haushalte.

## v0.3-Methodik — Live-Ingestion und Editorial-Layer (2026-05-22)

Mit dem Backend-Pivot vom 2026-05-22 (siehe `docs/product.md` Sektion „v0.3 — Backend, Editorial-CMS, Live-Ingestion") wird die WachSam-Methodik um eine Live-Ingestion- und Editorial-Schicht ergänzt. Die in den vorhergehenden Sektionen beschriebene Grundlogik (Signal-Erkennung, Deutschland-Relevanz, Systembewertung, Kaskadenlogik, Haushalts-Impact, Confidence & Unsicherheit) bleibt unverändert verbindlich. v0.3 ergänzt — sie ersetzt nicht.

### Quellenklassen bleiben dieselben

Die in Sektion „Datenquellen" geführten Quellenklassen — Behörden, Wirtschaftsinstitute, internationale Institutionen, Qualitätsmedien, Branchen- und Fachmedien, OSINT-Quellen, Marktindikatoren — bleiben in v0.3 unverändert. Neu ist nur der Zugriffspfad: statt manueller redaktioneller Sichtung pflegt ein Adapter-Layer je Quellenklasse einen reproduzierbaren Pull-Mechanismus. Jeder Adapter ist auf eine Quellenklasse fokussiert und liefert strukturierte Rohdaten an das Editorial-CMS.

### Frische-Anforderung — `last_ingested_at` und `source_fingerprint`

Jeder erfolgreiche Live-Pull setzt auf dem ingestierten Datensatz zwei Pflicht-Metadatenfelder:

- `last_ingested_at` — ISO-Zeitstempel des letzten erfolgreichen Pulls. Dient als technische Frische-Marke des Adapters, nicht als redaktionelles Prüfdatum.
- `source_fingerprint` — Hash über die Roh-Antwort der Quelle (URL + Body-Hash + relevante Header). Macht Quellen-Änderungen zwischen zwei Pulls deterministisch erkennbar.

Beide Felder leben in der Ingestion-Datenbank und sind getrennt von den UI-sichtbaren Trust-Layer-Feldern. Die bestehende Trennung zwischen `sources[].stand` (Stand der Quelle selbst) und `retrieved_at` / „Letzte redaktionelle Prüfung" (Stand der WachSam-Redaktion) bleibt erhalten. `last_ingested_at` ist eine **dritte** Zeitmarke und wird in der Public-UI nicht als primäres Prüfdatum dargestellt.

### Editorial-Gate

Jeder ingestierte Datenstand durchläuft vor der Public-API-Freigabe ein dreistufiges Gate:

1. **Schema-Gate.** Strukturelle Validierung gegen die in v0.2 etablierten JSON-Schemas (`v01/data/schemas/`), in v0.3 nach Drizzle-Schemas portiert. Pflichtfelder `germany_relevance`, `methodology_tag`, Severity, Confidence, Zeithorizont, Quelle, Stand sind nicht verhandelbar.
2. **Methodology-Gate (ADR-028).** Methodische Plausibilität gegen die in dieser Datei dokumentierten Skalen, Causal-Linking-Regeln und Bürger-Maßnahmen-Logik. Verstöße brechen den Datenstand mit einem expliziten Methodology-Tag-Fehler.
3. **Editorial-Approval.** Redaktionelle Sichtprüfung durch das Editorial-CMS. Die Redaktion bestätigt Quellenlage, Wording, Severity-Einordnung, Confidence-Wert und Deutschland-Relevanz. Erst mit Approval wandert der Datenstand auf die Public-API.

Ohne alle drei Gate-Schritte bleibt ein ingestierter Datenstand in der Editorial-Schicht und ist für Bürger nicht sichtbar. Es gibt in v0.3 keine direkte Auto-Publish-Pipeline von Adapter nach Public-UI.

### Confidence-Logik bleibt unverändert

Das dreistufige Confidence-System (`niedrig` / `mittel` / `hoch`) aus Sektion „Confidence-System" bleibt verbindlich. Confidence wird in v0.3 **nicht automatisch aus dem Adapter abgeleitet** — die Redaktion setzt den Confidence-Wert beim Editorial-Approval auf Basis der gesamten Evidenzlage (Quellenanzahl, Quellenqualität, methodische Robustheit, Konsistenz zu vorhandenen Layer-2-Items). Ein automatischer Confidence-Score-Generator ist explizit nicht Teil von v0.3.

### Severity-Skala unverändert

Die fünfstufige Severity-Skala (`stabil` / `beobachten` / `erhöht` / `kritisch` / `eskalierend`) bleibt deckungsgleich mit v0.2. Auch in v0.3 darf `eskalierend` nur für aktive Strukturkrisen verwendet werden und ist nicht synonym zu `kritisch`. Severity-Übergänge dürfen Notifications auslösen, sobald sie das Editorial-Gate passiert haben.

### Methodology-Tag-System bleibt

Das fünfstufige `methodology_tag`-System (`steep` / `rca` / `bia` / `fmea` / `scenario`) aus Sektion „methodology_tag (Pflichtfeld ab v0.2)" bleibt Pflichtfeld auf jedem Layer-2-Item — unverändert in v0.3. Adapter müssen einen vorläufigen `methodology_tag` vorschlagen; final gesetzt wird er durch das Editorial-Approval. Das Feld bleibt auch in v0.3 ohne UI-Effekt, dient aber als methodische Audit-Spur.

### Bürger-Maßnahmen-Logik bleibt

Die in Sektion „Bürgermaßnahmen" definierte Logik (ruhig, praktisch, realistisch, keine Panikmache, keine Extrem-Prepper-Empfehlungen) bleibt verbindlich. v0.3 ändert nicht den Tonfall oder die Klassen der Bürgermaßnahmen; Personalisierung durch Haushalts-Profile filtert vorhandene Maßnahmen, sie generiert keine neuen.

### Bindende ADRs

- **ADR-033 — Layer-Boundaries.** Trennung zwischen Layer 1 (Research), Layer 2 (Structured Intelligence), Layer 3 (UI/Produkt) bleibt in v0.3 verbindlich; das Editorial-CMS lebt zwischen Layer 2 und Layer 3.
- **ADR-038 — Ingestion-Architektur.** Implementations-Spec für Adapter-Layer, Editorial-Gate, Threshold-Engine, Notification-Trigger und die `last_ingested_at`- / `source_fingerprint`-Metadatenfelder.
- **ADR-039 — Intelligence Core.** LLM-gestützte Signalanalyse mit Vertex AI Gemini.

## KI-gestützte Signalanalyse (ADR-039, 2026-05-26)

Mit ADR-039 wird die WachSam-Methodik um eine LLM-gestützte Analyseschicht ergänzt. Die in den vorhergehenden Sektionen beschriebene Grundlogik bleibt unverändert verbindlich. Der LLM ist ein Analyst-Tool — er ist weder Autor noch Entscheider.

### LLM als Analyst-Tool

Vertex AI Gemini (2.5 Flash Standard, 2.5 Pro für komplexe Fälle) wird für zwei Aufgaben eingesetzt:

1. **Strukturierte Extraktion** aus unstrukturierten Quellen (RSS, Behörden-Pressemitteilungen, Think-Tank-Reports): Signal, germany_relevance, methodology_tag, betroffene Systeme, Kaskaden-Vorschläge.
2. **Multi-Rollen-Analyse** bestehender Signale: Fünf Kern-Rollen (Systemic Risk Analyst, Strategic Foresight Analyst, Germany-Relevance Translator, Governance Gap Analyst, Quantitative Risk Manager) analysieren ein Signal aus verschiedenen Perspektiven.

### Pflicht-Output-Schema

Jede LLM-Analyse muss das in `intelligence/output-schema.md` definierte Schema einhalten (Pydantic-validiert). Pflichtfelder: `germany_relevance`, `methodology_tag`, `severity`, `confidence`, `kaskaden`, `haushalts_auswirkungen`, `buergermassnahmen`, `quellen`.

### LLM-Output ist kein Fakt

LLM-generierte Analysen sind Vorschläge. Sie ersetzen weder redaktionelle Prüfung noch Quellenverifikation. Der LLM darf:

- Kaskaden vorschlagen
- Severity und Confidence vorschlagen
- Systembereiche identifizieren
- Haushaltsauswirkungen formulieren

Der LLM darf **nicht**:

- Quellen erfinden
- Severity/Confidence final setzen (das macht die Redaktion)
- Items automatisch publizieren
- Confidence aus der eigenen Modell-Unsicherheit ableiten

### Rollen-Disziplin

Die Multi-Rollen-Analyse erzwingt methodische Perspektivenvielfalt. Jede Rolle hat einen dedizierten System-Prompt (definiert in `intelligence/prompt-library.md`), der auf die WachSam-Methodik ausgerichtet ist. Rollen sind keine kreativen Personas — sie sind disziplinierte Analysewerkzeuge.

### Editorial-Gate bleibt

Das dreistufige Editorial-Gate (Schema-Gate, Methodology-Gate ADR-028, Editorial-Approval) bleibt für LLM-generierte Items unverändert verbindlich. Es gibt kein separates Fast-Track für LLM-Output.

### Specs

Vollständige Intelligence-Specs: `intelligence/roles-and-skills.md`, `intelligence/prompt-library.md`, `intelligence/analysis-templates.md`, `intelligence/output-schema.md`, `intelligence/ingestion-architecture.md`.
