# WachSam Datenqualität & Faktenbasis — Roadmap

Stand: 2026-06-09  
Scope: Datenqualität, Faktenbasis, Evidence-first Ingestion, LLM-Verlässlichkeit, Adapter-Reihenfolge.  
Goal-Status: aktiv verfolgen bis Welle 20; Politik-/NotebookLM-Layer bleibt späterer separater Claim-Discovery-Goal.

## 1. Ausgangslage

WachSam hat jetzt eine teilstabile Indikatorbasis:

- Dry-Run-/Read-only-Schutz vorhanden: `python -m src.main --dry-run --allow-fetch`.
- Aktive Indikatoradapter liefern read-only verwertbare Werte: Destatis, GIE/BNetzA, EIA, FRED, FAO, Tankerkönig.
- Aktive Indikatoradapter setzen `source_stand_date`, `source_stand_label`, `source_period_type`.
- `source_registry.yaml` ist maschinenlesbar und als statische Qualitäts-/Planungsbasis vorhanden.
- Public-UI filtert Content-Items auf `editorial_status = published`.
- RSS/LLM ist noch nur ein Draft-/Signalpfad, keine belastbare Faktenpipeline.

Hauptlücken:

- `source_health` ist geplant, aber nicht persistent.
- Stale-on-error ist noch nicht aktiv: Fehler dürfen langfristig keinen guten Wert überschreiben.
- RSS nutzt aktuell Feed-Metadaten/Summary statt vollständiger Evidence-Extraktion aus Artikeln.
- Vertex/Gemini `429` wird noch nur übersprungen, nicht mit Backoff/Run-Status behandelt.
- LLM-Output braucht härtere Schema-, Enum- und Evidence-Pflichten.
- Politik-/Claim-Kontext kommt später, wenn NotebookLM/Auth/Video-Import sauber verfügbar sind.

## 2. Leitprinzipien

### Fakten vs. Interpretation

Pfad A — Messwert:

- Offizielle/statistische/Markt-Daten aus Adaptern.
- Landet in `indicators` und `indicator_observations`.
- Darf automatisiert aktualisiert werden, sobald Plausibilitäts-/Health-Regeln greifen.
- Erzeugt nie automatisch Haushaltsauswirkungen, Maßnahmen oder politische Einordnung.

Pfad B — Bedeutung:

- Meldungen, Artikel, LLM-Extrakte, politische Claims, redaktionelle Einordnung.
- Landet nur als Draft und geht durchs Editorial-Gate.
- Public erst nach `approved/published`.
- LLM darf nur klassifizieren/einordnen, nicht unbelegte Fakten erzeugen.

### Evidence-first-Regel

Jedes nichtnumerische Signal braucht:

- `source_id`
- `source_url`
- `source_name`
- `published_at`, falls vorhanden
- `fetched_at`
- `source_stand_date` oder begründetes `unknown`
- `excerpt` / belegter Originalauszug
- `content_hash`
- `extraction_method`
- `model` + `prompt_version`, wenn LLM beteiligt war
- `confidence_suggestion` mit kurzer Begründung

## 3. Wellenplan

### Welle 18A — RSS/LLM stoppen als unklarer Freitextpfad

Ziel: RSS bleibt Discovery, nicht Faktenquelle.

CHANGE:

- `v02/intelligence/src/crawler/rss_crawler.py`
  - Timeout/Retry ergänzen.
  - Fehler strukturiert loggen.
  - Feed-Quellen aus `source_registry.yaml` ableiten oder mindestens IDs mappen.
  - Keine stillen 0-Item-Erfolge ohne Statushinweis.

- `v02/intelligence/src/extractors/llm_extractor.py`
  - `429 ResourceExhausted` explizit behandeln.
  - Retry mit Backoff, z. B. 2s/4s/8s.
  - Nach endgültigem Fehlschlag: `llm_unavailable`, kein stiller Normalfall.
  - Modell und Prompt-Version in Metadaten vorbereiten.

- `v02/intelligence/src/extractors/prompts.py`
  - Prompt auf Evidence-Pflicht umbauen: keine Behauptung ohne Textbeleg.
  - Unbekanntes muss `unknown` sein, nicht geraten.

ADD:

- `v02/intelligence/tests/test_rss_crawler.py`
- neue Tests in `v02/intelligence/tests/test_llm_extractor.py`

Acceptance:

- RSS-Timeout crasht nicht.
- Vertex `429` erzeugt Retry und danach klaren Failure-Status.
- LLM-Draft kann nicht als `published` entstehen.
- Tests laufen ohne echte RSS-/Vertex-Calls.

Verify:

```bash
cd v02/intelligence
uv run --with-requirements requirements.txt python -m pytest tests/test_rss_crawler.py tests/test_llm_extractor.py -q
uv run --with-requirements requirements.txt python -m pytest -q
```

### Welle 18B — Evidence-Objekt für Artikel/RSS-Drafts

Ziel: Artikel-/RSS-Signale erst als belegter Fakt, dann als Interpretation.

ADD:

- `v02/intelligence/src/evidence.py`
  - `EvidenceRecord` Pydantic-Modell.
  - Felder: Quelle, URL, Datum, Excerpt, Hash, Fetch-Status, Extraction-Methode.

- `v02/intelligence/src/fetchers/article_fetcher.py`
  - Robuster HTTP-Fetch mit Timeout.
  - HTML-Text-Extraktion minimal und testbar.
  - Keine Paywall-/Login-Umgehung.

- `v02/intelligence/tests/test_evidence.py`
- `v02/intelligence/tests/test_article_fetcher.py`

CHANGE:

- `rss_crawler.py`
  - RSS nur als Discovery.
  - Übergibt URL an Article-Fetcher.
  - Wenn Artikel nicht abrufbar: Draft mit `evidence_status = fetch_failed`, nicht LLM raten lassen.

Acceptance:

- Jeder LLM-Draft hat mindestens einen belegten Excerpt oder wird verworfen/markiert.
- Content-Hash verhindert Duplikate.
- Kein Artikeltext wird erfunden, wenn Fetch leer/fehlgeschlagen ist.

### Welle 18C — LLM-Schema und Enum-Härte

Ziel: LLM-Output wird maschinell validiert.

CHANGE:

- `v02/intelligence/src/models.py`
  - Severity, Confidence, Methodology und Systems als harte Literals/Enums.

- `llm_extractor.py`
  - JSON → Pydantic-Validation.
  - ValidationError → kein Draft, strukturierter Fehler.

- `prompts.py`
  - Enum-Werte exakt aus dem Kanon nennen.
  - Prompt-Version einführen, z. B. `WACHSAM_EXTRACT_PROMPT_VERSION = "rss-evidence-v1"`.

Acceptance:

- Ungültige Severity/Systemwerte werden abgelehnt.
- LLM kann keine unbekannten Systembereiche einschleusen.
- Jeder akzeptierte Draft enthält Evidence-Referenz.

### Welle 18D — Source Health persistent machen

Ziel: Quellenzustand wird laufzeitfähig, nicht nur dokumentiert.

Nur nach expliziter Freigabe, weil DB/Migration.

ADD/CHANGE:

- `v02/db/schema/index.ts`
  - neue Tabelle `source_health` oder äquivalente additive Struktur gemäß ADR-040.

- `v02/intelligence/src/db.py`
  - `upsert_source_health(...)` dry-run-safe.

- `v02/intelligence/src/adapters/base.py`
  - Health-Contract: `fresh`, `stale`, `error`, `disabled`, `unknown`, `anomaly`.

- `v02/intelligence/tests/test_source_health.py`

Acceptance:

- Jeder aktive Adapterlauf erzeugt Health-Status.
- Dry-run schreibt keine Health-Einträge.
- Fehlerlauf überschreibt keinen letzten guten Wert.
- Consecutive failures werden zählbar.

Verify:

```bash
cd v02/intelligence
uv run --with-requirements requirements.txt python -m pytest tests/test_source_health.py -q
uv run --with-requirements requirements.txt python -m src.main --dry-run --allow-fetch
```

### Welle 18E — Stale-on-error für Indikatorwerte

Ziel: Kein kaputter/neuer leerer Wert überschreibt den letzten guten Wert.

CHANGE:

- `v02/intelligence/src/db.py`
  - Bei Source-Error: alten `indicators.current_value` behalten.
  - Observation nur schreiben, wenn Wert akzeptiert wurde.

- `v02/intelligence/src/gate.py`
  - Shadow-Log bleibt; Entscheidung kann später aktiv werden.

Acceptance:

- Simulierter Adapterfehler hält alten Wert.
- UI kann später „Quelle aktuell nicht belastbar“ anzeigen.
- Kein Fallback-Item wird als normaler Erfolg gezählt.

### Welle 19 — erster neuer harter Adapter

Empfehlung: **Pegelonline vor DWD**, weil REST-API klarer und testbarer.

ADD:

- `v02/intelligence/src/adapters/pegelonline.py`
- `v02/intelligence/tests/test_pegelonline.py`

CHANGE:

- `v02/intelligence/source_registry.yaml`
- `v02/intelligence/src/main.py`

Scope klein halten:

- 1–3 ausgewählte Stationen, nicht alle Pegel.
- Echte API-Fixture.
- Wasserstand, Trend, Quelle, Stand, Freshness.
- Keine Karte, keine Vollregionalisierung in dieser Welle.

Acceptance:

- Parser-Test mit Fixture.
- Live Dry-run liefert mindestens einen aktuellen Wert.
- `source_stand_*` kommt aus Pegelonline, nicht aus `now`.

### Welle 20 — DWD Produktadapter

Erst nach Produktauswahl.

Empfohlener Start:

- DWD Warnmeldungen oder robuste Open-Data-Produktgruppe.
- Nicht GRIB/komplexe Vollwetterdaten als erster Schritt.

Acceptance:

- Konkreter DWD-Pfad dokumentiert.
- Fixture-Test.
- Freshness-Test.
- Kein Produkt-Mock als Produktdaten.

### Welle 21 — UI-Transparenz für Quellenstatus

Erst nach Source Health.

CHANGE:

- Public Cards: Datenstand + Quellenstatus sichtbar.
- Admin/Editorial: Quelle fresh/stale/error/anomaly sichtbar.
- Keine technischen Fehlertexte in Bürgeroberfläche.

Acceptance:

- Fresh zeigt ruhig „Stand: …“.
- Stale zeigt „Daten älter als erwartet“.
- Error zeigt „Quelle aktuell nicht belastbar“ und letzten guten Stand.

## 4. Adapter-Priorisierung

Jetzt stabil halten:

1. Destatis VPI
2. GIE/BNetzA Gas Storage
3. EIA Brent
4. FRED EU Gas
5. FAO Food Price Index
6. Tankerkönig E10/Diesel

Nächste harte Adapter:

1. Pegelonline — P0/P1, REST, Wasser/Logistik/Hochwasser.
2. DWD — P0/P1, Wetterextreme, nach Produktauswahl.
3. BfArM — P1, Lieferengpässe, erst Datenzugang klären.
4. RKI — P1/P2, Gesundheitslage, erst API/Downloadpfad klären.
5. BA Statistik — P2, Arbeitsmarkt/Industrie, batch-fähig.
6. Bundesbank — P2, Finanz/Wohnkosten-Kontext.
7. SMARD/ENTSO-E — blockiert bis Doku/Auth/Nutzungsbedingungen klar.

Editorial-only / Kontext:

- BDEW nur als gekennzeichnete Verbands-/Kontextquelle.
- Politik mit Kopf / NotebookLM später als Claim-Discovery, nicht als Faktenadapter.

## 5. Politik-Layer später

Der spätere Politik-Layer sollte nicht direkt publizieren.

Zielbild:

- YouTube/NotebookLM liefert Claims und politische Einordnungen.
- Claims werden als `claim_draft` oder Evidence-Draft abgelegt.
- Jede Behauptung wird gegen harte Quellen geprüft.
- Output: „prüfbarer Claim“, nicht „Fakt“.

Nicht jetzt bauen, weil:

- NotebookLM-MCP aktuell nicht authentifiziert.
- Fehlende Videos/Transkripte müssen erst reproduzierbar ergänzt werden.
- Erst muss die Fakten-/Evidence-Pipeline stabil sein.

## 6. Gesamtabnahme für Datenqualitätsfundament

Das Fundament gilt als stabil genug für breite Erweiterung, wenn:

- RSS/Article-Drafts haben Evidence-Records.
- Vertex `429` erzeugt klaren Retry/Failure-Status.
- LLM-Output ist schema-validiert.
- `source_health` ist persistent und dry-run-safe.
- Stale-on-error hält letzten guten Wert.
- Neue Adapter starten erst mit echter Quelle, Fixture, Live-Dry-run und Registry-Update.
- `bash scripts/verify.sh` und relevante pytest-Suite sind grün.

## 7. Empfohlene nächste Entscheidung

Nächster kleinster sinnvoller Schritt:

**Welle 18A: RSS/LLM Reliability + Timeout + 429 Handling + Tests.**

Danach:

1. Evidence-Objekt/Article-Fetcher.
2. LLM-Schemahärte.
3. Source Health DB-Freigabe.
4. Pegelonline als erster neuer harter Adapter.
