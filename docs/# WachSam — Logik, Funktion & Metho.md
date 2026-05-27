# WachSam — Logik, Funktion & Methodik

> Source-of-Truth. Stand: 21. Mai 2026. Wave 8.0 / v0.2.

# Grundprinzip

WachSam ist kein klassisches News-System.

WachSam arbeitet nach folgender Grundlogik:

Globales Signal
→ Deutschland-Relevanz
→ betroffene Systeme
→ Haushaltsauswirkungen
→ Mehrkosten / Risiken / Maßnahmen
→ Confidence & Unsicherheit

Die Plattform bewertet nicht primär Ereignisse,
sondern deren mögliche Auswirkungen auf deutsche Haushalte.

---

# Grundfunktion der Plattform

WachSam sammelt, strukturiert und bewertet:

- globale Krisen
- wirtschaftliche Entwicklungen
- Infrastrukturprobleme
- Lieferkettenprobleme
- Rohstoffrisiken
- gesellschaftliche Spannungen
- Energie- und Versorgungsthemen

Ziel:
verständliche Auswirkungen auf Deutschland und den Alltag deutscher Haushalte sichtbar machen.

---

# Kernlogik

# 1. Signal-Erkennung

Ein Signal kann sein:

- geopolitisches Ereignis
- wirtschaftliche Entwicklung
- Rohstoffproblem
- Lieferkettenstörung
- Infrastrukturproblem
- Energieproblem
- regulatorische Änderung
- Klimaextrem
- gesellschaftliche Spannungen

Beispiele:
- steigende Gaspreise
- Rohstoffexportbeschränkungen
- LNG-Probleme
- Stromnetzprobleme
- Hafenstörungen
- Dürren
- Produktionsrückgänge

---

# 2. Deutschland-Relevanz

WachSam bewertet:

- Ist Deutschland betroffen?
- Wie direkt?
- Welche Systeme sind betroffen?
- Welche Abhängigkeiten existieren?
- Wie schnell könnten Auswirkungen sichtbar werden?

---

# 3. Systembewertung

Die Plattform bewertet Belastungen in:

- Energie
- Lebensmittel
- Mobilität
- Gesundheit
- Infrastruktur
- Industrie
- Logistik
- Finanzen
- Arbeit
- Gesellschaft

---

# 4. Kaskadenlogik

WachSam analysiert Ursache-Wirkung-Ketten.

Beispiel:

Energiepreise steigen
→ Transportkosten steigen
→ Lebensmittelpreise steigen
→ Kaufkraft sinkt
→ Haushaltsbelastung steigt

Oder:

Rohstoffmangel
→ Industrieprobleme
→ Produktionsverzögerungen
→ Lieferprobleme
→ höhere Kosten

Kaskaden können:
- parallel wirken
- sich gegenseitig verstärken
- zeitverzögert auftreten
- mehrere Systeme gleichzeitig betreffen

---

# 5. Haushalts-Impact

Die Plattform übersetzt Systemstress in:

- Mehrkosten
- Versorgungsrisiken
- Stabilitätsrisiken
- Alltagsauswirkungen

Beispiele:
- höhere Stromkosten
- steigende Lebensmittelpreise
- längere Lieferzeiten
- Medikamentenprobleme
- Mobilitätskosten
- Versicherungsanstiege

---

# 6. Confidence & Unsicherheit

WachSam arbeitet probabilistisch.

Die Plattform behauptet nicht:
- sichere Vorhersagen
- garantierte Entwicklungen

Jede Einschätzung enthält:
- Confidence
- Unsicherheit
- Zeitfenster
- Quellenstatus

---

# Confidence-System

## Niedrig
- geringe Datenlage
- frühe Hinweise
- hohe Unsicherheit

## Mittel
- mehrere Hinweise
- erkennbare Muster
- teilweise bestätigt

## Hoch
- bestätigte Daten
- klare Auswirkungen
- hohe Evidenzlage

---

# Severity-System (5-stufig ab v0.2)

## Stabil
Normale Lage.

## Beobachten
Frühe Belastungen oder Auffälligkeiten.

## Erhöht
Spürbare Risiken oder Belastungen.

## Kritisch
Starke Belastung oder erhebliche Risiken.

## Eskalierend (neu v0.2)
Aktive Eskalation; strukturelle oder beschleunigende Belastung.
Reserviert für eskalierende Strukturkrisen (z.B. Deindustrialisierung).
Nicht synonym zu „Kritisch" verwenden.

---

# Zeitlogik

## Kurzfristig
Tage bis wenige Wochen.

## Wochen
Wahrscheinliche Auswirkungen in mehreren Wochen.

## Monate
Mittelfristige Entwicklungen.

## Langfristig
Strukturelle Veränderungen.

---

# Bürgermaßnahmen

WachSam gibt:
- ruhige
- praktische
- realistische

Empfehlungen.

Keine:
- Panikmache
- Extrem-Prepper-Empfehlungen
- Weltuntergangslogik

Beispiele:
- Energiekosten prüfen
- Verträge vergleichen
- finanzielle Reserve verbessern
- Medikamentenversorgung beobachten
- wichtige Dokumente sichern

---

# Datenmethodik

WachSam nutzt:
- strukturierte Daten
- bekannte Abhängigkeiten
- Haushaltslogik
- Kaskadenmodelle
- Wahrscheinlichkeiten
- Confidence-Bewertungen

Nicht:
- freie Fantasie
- unbelegte Behauptungen
- reine LLM-Texterzeugung

## Pflichtfelder ab v0.2

Jedes Layer-2-Item (Datei in `v01/data/`) trägt ab v0.2 zwei methodische Pflichtfelder:

- **germany_relevance** — strukturiertes Objekt mit `direct`, `systems_affected[]`, `time_to_impact`, `description`. Macht die Deutschland-Einordnung pro Datenpunkt explizit.
- **methodology_tag** — einer von `steep`, `rca`, `bia`, `fmea`, `scenario`. Macht die zugrundeliegende Analysemethodik pro Datenpunkt explizit.

Detaillierte Werte-Räume in `docs/methodology.md`.

---

# Datenquellen

Mögliche Quellen:
- Behörden
- Wirtschaftsdaten
- Infrastrukturindikatoren
- Energiemarktdaten
- Preisentwicklungen
- Nachrichtenquellen
- öffentliche Statistiken

Wichtig:
Quellen dienen als Grundlage für Auswirkungen,
nicht als reiner Newsfeed.

---

# Technische Logik v0.1 / v0.2

v0.1 und v0.2 arbeiten:

- lokal
- kontrolliert
- ohne autonome Systeme
- ohne KI-Agenten
- ohne Live-Ingestion

Verwendet:
- lokale TypeScript- und JSON-Daten
- React-Komponenten
- strukturierte Haushalts-Impact-Daten

## Layer-Architektur (explizit ab v0.2)

- **Layer 1 — Research / Reports:** `reports/*.md`, `intelligence/*.md`. Quellen, Evidenz, Hintergrundanalysen.
- **Layer 2 — Structured Intelligence:** `v01/data/*.json`. Strukturierte Daten mit Pflichtfeldern `germany_relevance` und `methodology_tag`.
- **Layer 3 — UI / Produkt:** `v01/src/`. Sichtbare App, Sections, UX-Komponenten. Daten ausschließlich aus Layer 2.

Vollständige Layer-Definition: `intelligence/layer-architecture.md`. Live-Ingestion-Grenzen: `docs/adr/033-future-live-ingestion-boundaries.md`.

---

# Architekturprinzip

WachSam baut zuerst:

1. verständliche Haushaltslogik
2. stabile UI
3. klare Datenstruktur

Erst später:
- Datenbank
- APIs
- Automatisierung
- KI-Systeme
- Live-Daten
- komplexe Engines

---

# Entwicklungsprinzipien

- kleine Schritte
- kontrollierte Daten
- kleine Datei-Scopes
- keine riesigen Refactors
- keine widersprüchlichen Richtungen
- erst stabile Webapp
- dann komplexere Systeme

---

# Hauptziel

WachSam soll Bürgern helfen:

- komplexe Entwicklungen besser zu verstehen
- Risiken früher zu erkennen
- Auswirkungen auf ihren Alltag einzuordnen
- rationale Entscheidungen zu treffen
- ohne Panik informiert zu bleiben

---

# Produktkern in einem Satz

WachSam analysiert globale Krisen, Kaskaden und Systemrisiken und bewertet deren mögliche Auswirkungen auf Kosten, Versorgung und Stabilität deutscher Haushalte.

---

## v0.3-Logik — Backend, Live-Ingestion, Editorial (2026-05-22)

> Additive Erweiterung. Die Grundlogik, Severity- und Confidence-Skalen, Zeitlogik, Bürgermaßnahmen-Disziplin und Datenmethodik aus den vorhergehenden Sektionen bleiben für v0.1 und v0.2 gültig und werden ab v0.3 um die nachfolgenden Schritte ergänzt.

### Erweiterte Grundlogik

Die bisherige Grundlogik wird in v0.3 um einen redaktionellen Schritt ergänzt. Sie lautet ab v0.3:

Globales Signal
→ Ingestion (offizielle Quelle, Adapter, Stand erfasst)
→ Editorial-Layer (redaktionelle Prüfung, Severity- und Confidence-Einordnung, Kaskaden-Verknüpfung)
→ Deutschland-Relevanz (geprüft, nicht automatisch)
→ betroffene Systeme
→ Haushaltsauswirkungen
→ Mehrkosten / Risiken / Maßnahmen
→ Confidence & Unsicherheit
→ Publish

Kein Ingestion-Output erreicht die Bürger-Oberfläche direkt. Zwischen Crawler und Publish liegt immer der Editorial-Layer.

### Frische-Anforderung

Ab v0.3 trägt jedes Layer-2-Item drei klar getrennte Zeitstempel:

- **last_ingested_at** — Stand der letzten automatischen Erfassung aus der Quelle.
- **editorial_reviewed_at** — Stand der letzten redaktionellen Prüfung. Dieses Datum ist der für Bürger sichtbare Stand.
- **published_at** — Zeitpunkt der Sichtbarmachung in der App.

Die drei Felder sind nicht synonym. `editorial_reviewed_at` ist die für die App relevante Frische-Aussage; `last_ingested_at` belegt die Aktualität der zugrunde liegenden Quelle; `published_at` ist die Veröffentlichungsspur. Ein Item ohne aktuelle redaktionelle Prüfung wird in der App als „länger nicht geprüft" gekennzeichnet, statt stillschweigend zu altern.

### Editorial-Layer

Der Editorial-Layer ist die redaktionelle Schicht zwischen Crawler-Output und der Bürger-Oberfläche. Er übernimmt:

- Prüfung der Quelle (offiziell, einordbar, datierbar)
- Einordnung in die zehn Systembereiche
- Setzung von Severity und Confidence nach den bestehenden Skalen
- Setzung des Pflichtfelds `germany_relevance`
- Setzung des Pflichtfelds `methodology_tag`
- Verknüpfung zu bestehenden Kaskaden, Indikatoren und Maßnahmen
- Entscheidung über Publish, Zurückhalten oder Neuformulierung

Der Editorial-Layer ist die Stelle, an der WachSam aus einem Crawler-Treffer eine geprüfte, faktenbasierte Aussage macht. Ohne diesen Layer würde die App auf nicht-redaktionell geprüften Crawler-Texten basieren — das ist explizit ausgeschlossen.

### News-Source-Klassen

Die Quellenklassen aus v0.1 bleiben unverändert: Behörden (Bundestag, Bundesregierung, Bundesnetzagentur, BMWK, BMF, Destatis, BBK, BAKS), Wirtschaftsinstitute (IW Köln, ifo, IMK), internationale Institutionen (FAO, IEA, IRC, UNICEF, Welthungerhilfe), Qualitätsmedien (Tagesschau, ZDF, Spiegel, Zeit, Handelsblatt, Capital, FAZ, BR24, MDR), Branchen- und Fachmedien, OSINT-Quellen, Marktindikatoren.

Neu ab v0.3: jede dieser Klassen bekommt einen Adapter im Live-Ingestion-Layer. Die Adapter liefern strukturierte Treffer mit Stand und Quellen-URL in den Editorial-Layer. Welche Klassen in Welle 2 zuerst Adapter erhalten, wird durch die zugehörige Spec definiert; offizielle Behörden- und Statistikquellen haben Vorrang vor Medienquellen, weil ihr Stand maschinell zuverlässiger lesbar ist.

### Was unverändert bleibt

- Confidence-System (`niedrig`, `mittel`, `hoch`) bleibt als Evidenzstärke pro Einschätzung erhalten. Confidence bleibt eine probabilistische Aussage über die Evidenzlage, keine Vorhersagegarantie.
- Severity-System bleibt fünfstufig (`stabil`, `beobachten`, `erhöht`, `kritisch`, `eskalierend`); `eskalierend` bleibt strukturellen Krisen vorbehalten.
- Zeitlogik (`kurzfristig`, `wochen`, `monate`, `langfristig`) bleibt unverändert.
- Bürgermaßnahmen bleiben ruhig, praktisch, realistisch — keine Panikmache, keine Extrem-Prepper-Empfehlungen, keine Weltuntergangslogik.
- Methodische Pflichtfelder `germany_relevance` und `methodology_tag` bleiben Pflicht und werden in das Datenbank-Schema übertragen.
- Datenmethodik bleibt: strukturierte Daten, bekannte Abhängigkeiten, Haushaltslogik, Kaskadenmodelle, Wahrscheinlichkeiten, Confidence-Bewertungen. Keine freie Fantasie, keine unbelegten Behauptungen, keine reine LLM-Texterzeugung als Inhaltsquelle.
- Quellen bleiben Grundlage für Auswirkungen, nicht reiner Newsfeed.

### Layer-Architektur in v0.3

- **Layer 1 — Research / Reports:** weiterhin `reports/*.md`, `intelligence/*.md`. Hintergrundanalysen, Quellen, Evidenz.
- **Layer 2 — Structured Intelligence:** ab v0.3 in der persistenten Datenbank statt in `v01/data/*.json`. Pflichtfelder `germany_relevance` und `methodology_tag` bleiben; ergänzt um `last_ingested_at`, `editorial_reviewed_at`, `published_at` und den Editorial-Status.
- **Layer 3 — UI / Produkt:** ab v0.3 in `v02/` als Next.js-15-App. Daten ausschließlich aus Layer 2 über die API.

### Bindende Architekturentscheidungen

- `docs/adr/033-future-live-ingestion-boundaries.md` — Grenzen und Bedingungen für Live-Ingestion. Bleibt verbindlich und wird in v0.3 operationalisiert.
- `docs/adr/038-…` — Implementation der v0.3-Backend-Schicht, Docker-Topologie, Hard-Cutover von `v01/` auf `v02/`, Editorial-Workflow.

Die operationalisierende Methodik-Doku (`docs/methodology.md`) wird in einer eigenen Welle angepasst und bezieht sich auf diese Sektion als Source-of-Truth.