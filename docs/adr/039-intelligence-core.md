# ADR-039 — Intelligence Core: LLM-gestützte Signalanalyse mit Editorial-Gate

**Status:** accepted  
**Datum:** 2026-05-26  
**Autor:** Jean Schütz  
**Overrides:** `rules/architecture-principles.md` §5 ("Keine Autonomie"), §Verbotene Erweiterungen (LLM-Runtime), ADR-038 §Explicit-deferred (LLM-Analyse)

## Kontext

WachSam wurde als "Deutschland-zentriertes Krisen- und Haushalts-Auswirkungsradar" konzipiert, aber bisher als manuelles Editorial-CMS mit statischen Seed-Daten gebaut. Die Produkt-Vision — globale Signale erkennen, Kaskaden analysieren, Haushaltsauswirkungen übersetzen — erfordert eine Intelligence-Pipeline, die über manuelle Redaktion hinausgeht.

ADR-038 definiert die Ingestion-Architektur und deferriert LLM-Analyse explizit. `rules/architecture-principles.md` §5 verbietet Autonomie und §Verbotene Erweiterungen verbietet LLM-Runtime. Beide Einschränkungen waren korrekt für v0.1/v0.2 (statischer Stack), blockieren aber die Kernfunktion des Produkts in v0.3+.

## Entscheidung

WachSam erhält eine Intelligence-Pipeline mit LLM-gestützter Signalanalyse. Die Pipeline nutzt Google Vertex AI (Gemini 2.5 Flash) als Remote-LLM für strukturierte Extraktion und Multi-Rollen-Analyse. Kein lokaler LLM. Kein Auto-Publish.

### Pipeline-Architektur

```
Strukturierte Quellen (Destatis, BNetzA, FAO, Eurostat)
  → Structured Adapters (Python, deterministische Extraktion)
  → Rohdaten

Unstrukturierte Quellen (RSS, Behörden-PM, Think-Tanks)
  → Crawler/Scraper
  → LLM Extractor (Vertex AI Gemini)
  → Strukturierte Rohdaten

Rohdaten
  → Gemini Multi-Role-Analyse (5+ Rollen aus prompt-library)
  → Pflicht-Output-Schema (Pydantic-validiert)
  → Draft in Editorial Queue
  → Redaktionelle Prüfung (Editorial-Gate)
  → Published (Public API)
```

### Overrides

1. **`rules/architecture-principles.md` §5 "Keine Autonomie":** Override für die Intelligence-Pipeline. Die Pipeline führt Adapter und LLM-Extraktion automatisch aus, aber publiziert niemals automatisch. Jedes Item durchläuft das dreistufige Editorial-Gate (Schema-Gate, Methodology-Gate ADR-028, Editorial-Approval) bevor es sichtbar wird. Die Pipeline ist Analyst-Tool, nicht Operator.

2. **`rules/architecture-principles.md` §Verbotene Erweiterungen "LLM-Runtime":** Override für Vertex AI als Remote-LLM-Service. Kein lokaler LLM, kein Vector-Store, kein Embedding-Service auf dem VPS. Vertex AI läuft als API-Call in GCP, nicht als lokaler Prozess.

3. **ADR-038 §Explicit-deferred "LLM-Analyse":** Aktiviert. Die in ADR-038 deferrierte LLM-Analyse wird durch diese ADR autorisiert und spezifiziert.

### Rollen-System

Die Intelligence-Pipeline nutzt ein Multi-Rollen-System für disziplinierte Analyse. Kern-Rollen:

- **Systemic Risk Analyst** — Kaskadeneffekte, Tipping Points, Rückkopplungsschleifen
- **Strategic Foresight Analyst** — STEEP/PESTEL, Szenarien, Zeitfenster
- **Germany-Relevance & Haushalts-Impact Translator** — DE-Betroffenheit, Alltagsauswirkungen
- **Governance Gap Analyst** — Versprechen vs. Realität
- **Quantitative Risk Manager** — Wahrscheinlichkeiten, Confidence, Sensitivitäten

Vollständige Rollen-Bibliothek: `intelligence/prompt-library.md`. Rollen-Forschung: `intelligence/roles-and-skills.md`.

### Pflicht-Output-Schema

Jede LLM-Analyse muss das Pflicht-Output-Schema einhalten (Pydantic-validiert):

- `germany_relevance` (Objekt mit `direct`, `systems_affected`, `time_to_impact`, `description`)
- `methodology_tag` (`steep` / `rca` / `bia` / `fmea` / `scenario`)
- `severity` (5-stufig)
- `confidence` (3-stufig)
- `kaskaden`, `haushalts_auswirkungen`, `buergermassnahmen`
- `quellen` mit URLs und Stand

Vollständige Schema-Definition: `intelligence/output-schema.md`.

### Hard-Gates (unverändert aus ADR-028/038)

1. **Schema-Gate** — Strukturelle Validierung gegen Pflichtfelder.
2. **Methodology-Gate (ADR-028)** — Methodische Plausibilität.
3. **Forbidden-Language-Gate** — Kein alarmistisches Vokabular, keine Panik-Sprache.
4. **Editorial-Approval** — Redaktionelle Sichtprüfung. Erst mit Approval wird ein Item public.

Ohne alle vier Gates bleibt ein Item in der Editorial-Queue und ist für Bürger nicht sichtbar.

### Technischer Stack

- **Sprache:** Python 3.12
- **LLM:** Google Vertex AI — Gemini 2.5 Flash (Standard), Gemini 2.5 Pro (komplexe Fälle)
- **Validierung:** Pydantic v2
- **Datenbank:** Postgres 16 (gleiche Instanz wie v02/)
- **Scheduling:** Cloud Scheduler (GCP) oder APScheduler (lokal)
- **Container:** Docker auf IONOS-VPS
- **Code-Pfad:** `v02/intelligence/`

### GCP-Kosten

Geschätzte Kosten ~28 EUR/Monat bei moderater Nutzung (täglich strukturierte Adapter, wöchentliche Deep-Crawls, LLM nur für unstrukturierte Quellen). Gedeckt durch 1000 EUR GCP-Credits.

### Implementierungs-Pfad

- **Welle 2.1:** BaseAdapter + 3 Kern-Adapter (Destatis, BNetzA, FAO) + LLM Extractor Basis + Editorial Queue Schema
- **Welle 2.2:** Vollständige Adapter-Suite + Crawler + Scheduler
- **Welle 2.3:** Multi-Role-Analyse + Monitoring

## Konsequenzen

### Positiv

- WachSam wird von statischem CMS zum aktiven Intelligence-System
- Strukturierte Quellen (Destatis, BNetzA, FAO) liefern verifizierbare Daten
- Multi-Rollen-Analyse erzwingt methodische Disziplin
- Editorial-Gate verhindert Auto-Publish und LLM-Halluzinationen
- Kosten sind durch GCP-Credits gedeckt

### Negativ

- Neue Abhängigkeit von Google Cloud / Vertex AI
- LLM-Output erfordert redaktionelle Prüfung (Aufwand)
- Pipeline-Code ist ein neuer Wartungsbereich

### Risiken

- Vertex AI Pricing-Änderungen nach Credit-Verbrauch
- Quellenstruktur-Änderungen brechen Adapter
- LLM-Qualitätsschwankungen erfordern Prompt-Tuning

## Alternativen (verworfen)

1. **Rein manuelles Editorial** — Skaliert nicht, verfehlt die Produkt-Vision.
2. **Lokaler LLM (Ollama, llama.cpp)** — Zu ressourcenintensiv für IONOS-VPS, Qualität unter Gemini.
3. **OpenAI statt Vertex** — Kein GCP-Credit-Vorteil, DSGVO-Bedenken bei US-Hosting.

## Referenzen

- ADR-028 — Methodology Gates
- ADR-034 — Backend-Pivot
- ADR-038 — Ingestion-Architektur
- `intelligence/roles-and-skills.md` — Rollen-Bibliothek
- `intelligence/prompt-library.md` — System-Prompts
- `intelligence/analysis-templates.md` — Analyse-Templates
- `intelligence/output-schema.md` — Pflicht-Output-Struktur
- `intelligence/ingestion-architecture.md` — Architektur-Konzept
