# WachSam — Source- & Python-Inventur (Welle 1)

**Stand:** 2026-06-06 (EIA/FRED-Härtung in §11; Test-/CI-Live-Isolierung + offene Daten-Tasks in §12; Basis-Inventur 2026-06-03) · **Methode:** read-only Bestandsaufnahme (kein DB-Zugriff, keine externen Crawls, keine Writes) · **Verifiziert:** kritische Befunde (Indikator-Publish-Pfad, Public-UI-Gate) gegen den realen Code geprüft, nicht nur referenziert.

> Zweck dieses Dokuments: vollständige Sichtbarkeit aller bestehenden Datenbeschaffungs-, Ingestion-, Adapter-, Analyse- und Quellen-Bausteine, **bevor** ein Fact-to-Impact-Layer geplant wird. Bestehende Skripte sind potenzielle Source-of-Truth-Ingestion, keine Altlast.

---

## 1. Kurzfazit

- Es existiert **ein einziger** Ingestion-Core unter `v02/intelligence/` (Python). **Kein** Parallel-/Doppelpfad, **kein** `v02/ingest-py/` (anders als in ADR-038 vorgesehen). Neue Crawler sind nicht nötig — der Bestand ist auszubauen, nicht zu ersetzen.
- **8 Adapter** sind implementiert (6 produktionsnah, 1 Stub, 1 redundant), dazu RSS-Crawler, Vertex-AI-LLM-Extractor, Lag-Engine und eine (ungenutzte) In-Memory-Editorial-Queue.
- Der Core **schreibt real und sofort** in produktive Drizzle-Tabellen (`db.py`). **Kein `--dry-run`, kein Read-Only-Modus.** Das ist das größte operative Risiko.
- Das **Datenmodell ist überraschend reif**: `indicators` + `indicator_observations` (Zeitreihe, Composite-PK), `editorial_status`-Layer auf 8 Content-Tabellen, `item_sources`/`sources`-Registry-Ansatz, `editorial_audit_log`. Der Fact-to-Impact-Prozess lässt sich weitgehend auf Bestehendes mappen.
- **Public-UI-Gate funktioniert** technisch: jede öffentliche Query filtert auf `editorial_status = published`. **Ausnahme:** Indikator-Live-Werte werden ohne erneuten Review aktualisiert (bewusster Sonderpfad — Entscheidung von Jean nötig).
- **Doku-Drift ist erheblich:** ADR-038 beschreibt einen nie gebauten Sollzustand (Scrapy, `editorial_drafts`, `adapter_runs`, Fingerprint-Dedup). Real ist ADR-039 + `editorial_status='draft'` direkt auf Produktivtabellen.

---

## 2. Inventur: Bestehende Daten- und Quellenpipeline

Legende: DB-Write `J/N/~` · Ext-API `J/N` · Secret `J/N` (Variablenname) · Tests `J/N/~` · Status `aktiv / experimentell / geplant / veraltet / unklar`.

| # | Pfad | Typ | Zweck | Quelle/API | Daten | Output-Ziel | DB? | Ext? | Secret? | Frequenz | Tests | Status | Risiko | Empfehlung |
|---|------|-----|-------|-----------|-------|-------------|-----|------|---------|----------|-------|--------|--------|------------|
| 1 | `src/main.py` | Orchestrator | Lädt 8 Adapter + RSS, ruft `fetch_latest()`, routet, persistiert | – | – | DB via `insert_draft` | ~ | N | N | Cron 06:00/18:00 UTC (nur `INGESTION_MODE=scheduled`), sonst `once` | ~ (`test_main.py`, gemockt) | aktiv | Kein `--dry-run`; `try/except` pro Adapter, aber Persistenz-Loop ungeschützt; RSS hart `[:5]`; `ADAPTER_TYPE_MAP` matcht `source_class` statt Adaptername → toter Code | testen + **Dry-Run-Flag** + Logging |
| 2 | `src/db.py` | Persistenz | Schreibt Drafts/Indikatorwerte in Postgres | – | – | `lagebild_items`, `facts`, `cost_impacts`, `indicators`, `indicator_observations`, `editorial_audit_log`, `item_sources` | **J** | N | J (`POSTGRES_URL`) | pro Lauf | ~ (`test_db.py`, gemockt) | aktiv | **Sofortiger Prod-Write, kein Read-Only**; Indikator-`UPDATE` überschreibt Live-Wert + Audit `to_status=published` (Gate-Bypass); `source_stand` synthetisch aus `now` statt Quelldatum (Z.141/162) | **Dry-Run/Read-Only** + Publish-Pfad mit Jean klären |
| 3 | `src/config.py` | Config | pydantic-settings, lädt `.env` | – | – | – | N | N | J (alle Keys) | – | N | aktiv | Hardcoded Dev-Default `POSTGRES_URL` mit Klartext `wachsam:wachsam_dev` (Z.6) | Default entfernen/leeren |
| 4 | `src/models.py` | Datenmodell | `IngestionItem`, `GermanyRelevance` | – | – | – | N | N | N | – | J (`test_models.py`) | aktiv | Enums (severity/confidence/methodology_tag) sind freie Strings, nicht validiert | Enum-Validierung ergänzen |
| 5 | `src/adapters/base.py` | Basisklasse | ABC `BaseAdapter.fetch_latest()`, `create_item`, `log_error` | – | – | – | N | N | N | – | indirekt | aktiv | Kein erzwungener Timeout/Retry/Stale-on-error im Base | Resilienz-Contract in Base hochziehen |
| 6 | `src/adapters/bnetza.py` | Adapter | Gasspeicher-Füllstand DE | GIE AGSI+ `agsi.gie.eu/api/data/de` | `full` % + Vortag | `indicators` (`wi-gasspeicher-fuellstand`) | J | J | ~ (`GIE_API_KEY`, optional) | 2×/Tag | J (1 Live + 1 gemockt) | **aktiv** | Live-Test ungemockt; Fallback liefert immer Item → „Erfolg" trotz Fehler | behalten, Live-Test mocken |
| 7 | `src/adapters/destatis.py` | Adapter | VPI / Inflation YoY | GENESIS REST 2020, Tab. 61111-0002 | YoY-Inflation + Vormonat | `indicators` (`wi-inflation-vpi-de`) | J | J | ~ (`DESTATIS_USERNAME/PASSWORD`, `GAST`-Fallback) | 2×/Tag | J (1 Live + gemockt) | **aktiv** | Credentials als Klartext-Header (GENESIS-Konvention); Live-Test ungemockt | behalten, Live-Test mocken |
| 8 | `src/adapters/eia.py` | Adapter | Brent Crude Spot | EIA OpenData v2 `PET.RBRTE.D` | Brent USD/bbl + Vortag | `indicators` (`wi-oel-brent`) | J | J | J (`EIA_API_KEY`) | 2×/Tag | J (gemockt, +Key-Guard-Test) | **aktiv** | Key-Guard ✓ (2026-06-06, §11.4): ohne Key kein Request, sauberer Quellfehler | erledigt |
| 9 | `src/adapters/fred.py` | Adapter | Erdgaspreis Europa | FRED `PNGASEUUSDM` | Gas USD/MMBtu, 2 Obs | `indicators` (`wi-gaspreis-europa`) | J | J | J (`FRED_API_KEY`) | 2×/Tag | J (5 Tests, gemockt) | **aktiv** | – (sauberste Implementierung) | behalten als Referenz-Pattern |
| 10 | `src/adapters/fao.py` | Adapter | FAO Food Price Index | FAO CSV-Download (statische Doc-URL) | Index + Vormonat | `indicators` (`wi-fao-food-price-index`) | J | J | N | 2×/Tag | J (1 Live + gemockt) | **aktiv** | User-Agent-Spoofing (`Mozilla/5.0`, 403-Umgehung); fragile `sfvrsn`-URL bricht bei FAO-Update; `pandas`-Abhängigkeit | behalten, URL/Quelle robuster lösen |
| 11 | `src/adapters/tankerkoenig.py` | Adapter | Spritpreise E10/Diesel | Tankerkönig MTS-K `list.php` | Mittel über 16 PLZ | `indicators` (`wi-kraftstoffpreis-super-e10`, `-diesel`) | J | J | J (`TANKERKOENIG_API_KEY`, Key-Guard ✓) | 2×/Tag | J (6 Tests, gemockt) | **aktiv** (live-verifiziert 06/01) | 16 Calls + `sleep(2)` ≈ 30s/Lauf; Stichprobe ≠ nat. Mittel (ehrlich dokumentiert) | behalten |
| 12 | `src/adapters/eurostat.py` | Adapter | HICP DE | Eurostat Dissemination API | **wird nicht geparst** (`TODO`, `pass`) | Platzhalter-Item ohne Werte | J | J | N | 2×/Tag | ~ (Live-Struktur-Test) | **experimentell/Stub** | Ruft API, verwirft Antwort; Item suggeriert Aktualität ohne Daten (Z.31) | **deaktivieren** bis fertig (Jean) |
| 13 | `src/adapters/warning_indicators.py` | Adapter | Brent (anderer EIA-Endpoint) | EIA v2 `petroleum/pri/spt`, `EPCBRENT` | Brent, 1 Wert | – (kein `indicator_id`, liefert `[]`-nah) | ~ | J | J (`EIA_API_KEY`, Key-Guard ✓) | 2×/Tag | ~ (Live, nur `isinstance`) | **veraltet/redundant** | Funktional doppelt mit `eia.py`; wirkt wie Vorläufer | **mit eia.py konsolidieren** (Jean) |
| 14 | `src/crawler/rss_crawler.py` | Crawler | RSS-Roh-Ingest (OSINT/Lage) | Tagesschau + Handelsblatt RSS (hardcoded) | bis 10 Entries/Feed | `IngestionItem` `status=raw` → LLM | N (direkt) | J | N | pro Lauf (nur `[:5]` weiterverarbeitet) | **N** | aktiv (roh) | `feedparser` ohne Timeout/Retry; **kein Test**; `print` statt Logger | Test + Timeout ergänzen |
| 15 | `src/extractors/llm_extractor.py` + `prompts.py` | LLM | RSS-Roh → strukturierter Draft | Vertex AI `gemini-2.5-flash` (hardcoded) | extrahiertes `IngestionItem` `status=extracted` | DB-Draft (nicht published) | ~ | J | J (`GOOGLE_CLOUD_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS`) | pro Lauf | J (3, gemockt) | aktiv | LLM-JSON **nicht** gegen Pydantic/Enum validiert; `.get()`-Defaults; fragiles Fence-Stripping | **Schema-Validierung erzwingen** (Gate) |
| 16 | `src/analysis/lag_engine.py` | Analyse | Lead-Lag zwischen Zeitreihen | – (rein pandas) | Cross-Correlation auf Log-Returns | `LagResult` (kein DB-Write) | N | N | N | on-demand | J (umfangreich, numerisch) | aktiv, **nicht verdrahtet** | Kein Aufrufer schreibt Ergebnisse; in keinem ADR dokumentiert | dokumentieren (ADR), später anbinden |
| 17 | `src/queue/editorial_queue.py` | Queue | In-Memory-Editorial-Status | – | `raw/in_review/published` | RAM-Listen | N | N | N | – | J (5, in-memory) | **veraltet/toter Pfad** | Status-Maschine weicht von DB (`draft/approved/published`) ab; in `main.py` nicht genutzt; Selbst-TODO „durch Postgres ersetzt" | entfernen oder an DB angleichen |
| 18 | `v02/db/migrations/0009_*` | Migration | Zeitreihen-Tabelle | – | – | `indicator_observations` (PK `indicator_id,observed_at`) | – | N | N | – | – | aktiv | – | Grundlage Lag-Engine; behalten |
| 19 | `v02/db/migrations/0005_*` | Migration | Editorial-Layer | – | – | `editorial_status`-Enum + `editorial_audit_log` auf 8 Tabellen | – | N | N | – | – | aktiv | Default `editorial_status='published'` → Seed gilt sofort als publiziert | bei Ingest bewusst `draft` setzen |
| 20 | `v02/db/seed/*` + `scripts/seed.ts` | Seed | Recherchierte Startdaten | manuell | echte Fakten + Quellen (Stand ~05/2026) | 12 Tabellen | **J** (manuell) | N | J (`POSTGRES_URL`) | manuell | – | aktiv | Indikatoren ohne Live-Werte (kommt aus Ingestion); `onConflictDoUpdate` | behalten |
| 21 | `.github/workflows/verify.yml` | CI | Gate | – | – | – | N | N | N (Secret-Scan!) | bei PR/push | – | aktiv | – | behalten; Live-Adapter-Tests vom CI trennen |
| 22 | `.github/workflows/deploy.yml` + `scripts/deploy-source.sh` | CI/Deploy | Source-Staging auf VPS | – | – | `$TARGET_DIR` + `.deploy-state` | N | N | J (SSH) | manuell (`workflow_dispatch`) | – | aktiv | **Kein** Migrate/Rebuild/Restart/DB-Write — staged nur | Migrate-Schritt bleibt manuell (siehe Memory) |
| 23 | `v02/intelligence/tests/*` | Tests | pytest | – | – | – | N | ~ (5 Live-Calls!) | N | CI | – | aktiv | `test_adapters.py` + `test_integration.py` machen **echte API-Calls** (CI-Flakiness/Quellenlast) | Live-Tests markieren/mocken |

---

## 3. Aktueller Datenfluss (Ist-Stand)

```
Strukturierte Quellen (8 Adapter)  ─┐
                                     ├─► main.py (sync, 06:00/18:00 UTC) ─► db.py.insert_draft
RSS (Tagesschau/Handelsblatt) ─► LLM-Extractor (Vertex Gemini) ─► [:5] ─┘        │
                                                                                  ▼
        ┌─────────────────────────────────────────────────────────────────────────────────┐
        │ Indikatoren  → UPDATE indicators.current_value + INSERT indicator_observations    │  ← Live, OHNE erneuten Review
        │ lagebild/facts/cost_impacts → INSERT mit editorial_status='draft'                 │  ← wartet auf Redaktion
        └─────────────────────────────────────────────────────────────────────────────────┘
                                                                                  ▼
                          Editorial-Gate (v02/web/lib/admin/editorial.ts, draft→approved→published)
                                                                                  ▼
                          Public-UI (public-data.ts: NUR editorial_status='published')
```

**Antworten auf die Datenfluss-Fragen (Phase 2):**

1. **Heute geholt:** Gasspeicher (GIE), VPI (Destatis), Brent (EIA), Erdgas-EU (FRED), FAO Food Price, Spritpreise (Tankerkönig), RSS (Tagesschau/Handelsblatt). 6 robuste Indikator-Quellen.
2. **Nur geplant/unfertig:** Eurostat HICP (Stub), die in ADR-038 versprochene Staging-Architektur.
3. **Landen in DB:** alle Adapter-Outputs (Indikatoren → `indicators`/`indicator_observations`; übrige → Content-Tabellen als Draft).
4. **Nur in Dateien/Reports:** Lag-Engine-Ergebnisse (kein DB-Write). `outputs/` enthält nur Reports.
5. **Überschrieben:** `indicators.current_value/previous_value` (UPDATE).
6. **Historisiert:** `indicator_observations` (append-only, `ON CONFLICT DO NOTHING`).
7. **Zeitreihen vorhanden?** Ja — `indicator_observations` (Migration 0009, Composite-PK).
8. **Lag-Engine vorhanden?** Ja — implementiert + getestet, aber nicht an die DB/Ingestion verdrahtet.
9. **Fact-/Source-Tabellen?** Ja — `facts` (inline-Quelle), `item_sources` (polymorph n:m), `sources` (Dedup-Registry), `fact_refs`.
10. **Editorial-Freigabe zwischen Ingestion und Public-UI?** Ja für Content-Items (`draft`→Gate→`published`). **Nein** für Indikator-Live-Werte (Sonderpfad `ingest_value`).
11. **Haushaltsrelevant:** Gasspeicher, VPI, Brent, Erdgas, FAO, Spritpreise (= alle aktiven Adapter).
12. **Globale Lage/OSINT:** nur der RSS-Kanal (→ LLM → Redaktion). Keine echten OSINT-Feeds sonst.
13. **Für Member später wichtig:** Spritpreise, Erdgas/Gasspeicher (Energievertrag), VPI (Kaufkraft), FAO (Lebensmittel) — alles preis-/versorgungsnah.

---

## 4. Verifizierte kritische Befunde / Doku-Drift

1. **Indikator-Live-Werte umgehen den Review** (verifiziert `db.py:117-156`, `public-data.ts:184/245`). Indikator-Zeilen sind per Seed-Default `published`; die Ingestion ändert nur `current_value`, nicht `editorial_status` → neue Werte erscheinen ohne Vier-Augen-Prinzip in der Public-UI. Widerspricht README/ADR-039 „kein Auto-Publish", ist in `editorial-gate.md` aber als Sonderpfad erwähnt. **→ bewusste Entscheidung nötig.**
2. **Kein Dry-Run / Read-Only** im gesamten Ingestion-Core. Jeder `python -m src.main` schreibt+committet sofort (`db.py:171`). Größtes operatives Risiko für versehentliche Prod-Writes.
3. **ADR-038-Sollzustand existiert nicht:** kein `v02/ingest-py/`, kein Scrapy, keine `editorial_drafts`/`adapter_runs`-Staging-Tabellen, kein `source_fingerprint`-Dedup, keine No-Publish-Hard-Gates. Real = ADR-039 + Status-Feld auf Produktivtabellen. ADR-038 braucht einen Ist/Soll-Vermerk.
4. **Enums werden nirgends erzwungen** — weder Pydantic noch DB validieren `severity/confidence/methodology_tag/systembereiche` gegen den dokumentierten Kanon (methodology.md). LLM-Output geht ungeprüft durch.
5. **Redundanz/Stub:** `warning_indicators.py` doppelt `eia.py` (Brent); `eurostat.py` ist ein Stub, der API ruft und verwirft.

---

## 5. Source Registry (Bestand + Lücken)

> Diese Registry macht jede vorhandene und geplante Quelle sichtbar. Felder gekürzt auf die für Bewertung/Test relevanten; volle 18-Felder-Spec siehe Auftrag §5.

| source_id | Name | Typ | Betreiber | Auth | Format | Adapter | DE-Relev. | Haushalt | Systembereich | Ausfall/Stale | Status |
|-----------|------|-----|-----------|------|--------|---------|-----------|----------|---------------|---------------|--------|
| `gie-agsi` | Gasspeicher DE | Energie | GIE | Key optional | JSON | `bnetza.py` | hoch | hoch | energie | Fallback-Item (niedrig conf.) | aktiv |
| `destatis-vpi` | VPI/Inflation | Statistik | Destatis | User/Pass (GAST) | CSV | `destatis.py` | hoch | hoch | finanzen/lebensmittel | – (kein Stale-Flag) | aktiv |
| `eia-brent` | Brent Crude | Marktindikator | US EIA | API-Key | JSON | `eia.py` | mittel | indirekt | energie/mobilitaet | Fallback | aktiv |
| `fred-gas-eu` | Erdgas Europa | Marktindikator | St. Louis Fed | API-Key | JSON | `fred.py` | mittel | mittel | energie | Fallback (robust) | aktiv |
| `fao-fpi` | FAO Food Price | Statistik | FAO | – | CSV | `fao.py` | mittel | hoch | lebensmittel | Fallback | aktiv |
| `tankerkoenig` | Spritpreise | Marktindikator | Tankerkönig/MTS-K | API-Key | JSON | `tankerkoenig.py` | hoch | hoch | mobilitaet | leere Liste → 0 Items | aktiv |
| `eurostat-hicp` | HICP DE | Statistik | Eurostat | – | JSON | `eurostat.py` | mittel | mittel | finanzen | — (Stub) | experimentell |
| `eia-brent-2` | Brent (alt) | Marktindikator | US EIA | API-Key | JSON | `warning_indicators.py` | mittel | indirekt | energie | `[]` | veraltet |
| `rss-tagesschau` | Tagesschau | Medien | ARD | – | RSS | `rss_crawler.py` | hoch | indirekt | gesellschaft | kein Timeout | aktiv (roh) |
| `rss-handelsblatt` | Handelsblatt | Medien | HB | – | RSS | `rss_crawler.py` | mittel | indirekt | finanzen/industrie | kein Timeout | aktiv (roh) |

**Registry-Lücken im Datenmodell:** Keine persistente Source-Registry-Tabelle mit `adapter_id`, Lizenz, Polling-Intervall, Frische-Fenster, `source_health`. `sources` existiert nur als Dedup-View aus `item_sources` (kein FK, keine Health-Felder, keine Lizenz).

---

## 6. Lücken für Fact-to-Impact (Mapping auf Bestand)

| Ziel-Feld | Status | Bestehende Abdeckung / Lücke |
|-----------|--------|------------------------------|
| `source_fact` | teilweise | `facts` + `fact_refs`; keine zentrale Impact-Item-Tabelle |
| `item_sources` | **vorhanden** | `item_sources` (neuer `itemType` ins Enum nötig) |
| `entwicklung` | teilweise | `lagebild_items.trend` / Indikator-Zeitreihe; kein strukturiertes Feld |
| `germany_relevance.direct` | teilweise | `germanyRelevance` jsonb (untypisiert) |
| `germany_relevance.systems_affected` | **fehlt** (strukturiert) | nur frei in jsonb |
| `germany_relevance.time_to_impact` | teilweise | `zeithorizont`-Enum, nicht als Subfeld |
| `systembereiche` | teilweise | `system`/`bereich`/`bezugZuBereich` gemischt; kein normalisiertes Vokabular |
| `haushaltsauswirkung` | **vorhanden** | `haushaltswirkung` auf cascades/governance |
| `maßnahme` | **vorhanden** | `citizen_actions` (lose verknüpft) |
| `confidence` | vorhanden | Enum auf cascades/cost/supply/lagebild; **fehlt** auf indicators/facts |
| `severity` | **vorhanden** | `severity`-Enum (5-stufig) |
| `uncertainty` | teilweise | `unsicherheit` inkonsistent (NOT NULL vs. nullable vs. fehlt) |
| `editorial_status` | **vorhanden** | shared Enum auf 8 Tabellen + Audit-Log |
| `source_health` | **fehlt komplett** | keine Spalte/Tabelle |
| `member_relevance` | **fehlt komplett** | nur `households` (modus/plz/heizart), keine Verknüpfung zu Items |

---

## 7. Risiken (priorisiert)

**Hoch**
- Kein Dry-Run/Read-Only im Ingestion-Core → versehentliche Prod-Writes (`db.py`).
- Indikator-Werte ohne erneuten Review live in Public-UI (Design-Entscheidung offen).

**Mittel**
- Hardcoded Dev-DB-Credentials als Default (`config.py:6`).
- LLM-Output ohne Enum/Schema-Validierung Richtung Draft.
- 5 Tests mit echten externen API-Calls → CI-Flakiness, Quellenlast.
- `source_stand` synthetisch (`now`) statt realem Quelldatum → irreführende Provenienz.

**Niedrig**
- `print`-Logging statt strukturiertem Logger.
- `ADAPTER_TYPE_MAP` toter/missverstandener Routing-Code.
- Dependency-Drift `requirements.txt` ↔ `pyproject.toml`.
- Redundanz `warning_indicators.py`/`eia.py`; Stub `eurostat.py`.

**Keine** AGPL-Abhängigkeit, **kein** Secret im Repo, **kein** WorldMonitor-Code gefunden.

---

## 8. Offene Entscheidungen (für Jean)

1. **Indikator-Live-Werte:** Sonderpfad ohne Review beibehalten (offizielle Zahlen) oder auch Indikatoren durchs Gate? → bestimmt, ob `db.py` angepasst wird.
2. **eurostat.py / warning_indicators.py:** deaktivieren + konsolidieren, oder fertigbauen?
3. **ADR-038:** als „verworfen/ersetzt durch ADR-039" markieren?
4. **Nächste kleine Umsetzung:** Welche der Optionen A–E (Auftrag §12) zuerst?

---

## 9. Nächster kleinster Schritt

**Vorschlag:** Dry-Run-/Read-Only-Schutz für den Ingestion-Core (`main.py` + `db.py`) als kleinste, risikosenkende Einheit — adressiert das Hoch-Risiko #1, ohne Datenmodell/Migrationen/Adapterlogik anzufassen. Erst nach Jeans Freigabe und nach Beantwortung der offenen Entscheidungen.

---

## 10. Dry-Run-Status (umgesetzt 2026-06-03)

Umgesetzt nach Jean-Freigabe (Welle 2, Schritt 1) — minimal, ohne Fachlogik-Umbau:

- `db.py`: globaler `set_dry_run()`/`is_dry_run()`-Flag. `insert_draft` öffnet im Dry-Run **keine** Verbindung und schreibt nichts — es loggt nur die beabsichtigte Operation (`INSERT`/`UPDATE`, Ziel, item_id). Bestehender Schreibpfad unverändert.
- `main.py`: `--dry-run` (kein DB-Write, keine Migration) und `--allow-fetch` (im Dry-Run read-only Live-Calls, weiterhin kein Write). Dry-Run gibt einen **Adapter-Plan** aus (Quelle, API-Key nötig?, schreibt DB?, Output-Ziel). `INGESTION_MODE`-Verhalten unverändert.
- `base.py` + 6 aktive Adapter: `describe()` + Metadaten (`source_label`, `requires_api_key`, `output_target`) — Selbstbeschreibung ohne externen Call.
- `eurostat.py` / `warning_indicators.py`: aus aktiver `main.py`-Liste genommen (Imports bleiben für Tests/Reaktivierung), **nicht gelöscht**.

| Baustein | Dry-Run-sicher? | Anmerkung |
|----------|-----------------|-----------|
| `db.py insert_draft` | **ja** | keine Verbindung im Dry-Run (Test: `test_dry_run.py`) |
| `main.py run_ingestion` | **ja** | überspringt externe Calls außer `--allow-fetch` |
| 6 aktive Adapter `fetch_latest` | teilweise | live-Call nur unter `--allow-fetch` (read-only); kein Write |
| `rss_crawler` | teilweise | nur unter `--allow-fetch`; **Timeout fehlt weiterhin** (späterer Task) |
| `llm_extractor` | teilweise | nur unter `--allow-fetch` |
| `lag_engine` | ja | rein numerisch, kein I/O |
| `v02/db/scripts/seed.ts` (TS) | **nein** | separates manuelles Seed-Skript, nicht Teil dieses Schutzes |

**Restrisiken (offen):** `--allow-fetch` löst echte read-only GETs aus; RSS ohne Timeout; die 5 Live-API-Tests in `test_adapters.py` + `test_integration.py` rufen in CI reale Endpunkte. Verifiziert: `pytest` (gemockte Suite) **43 passed**; Dry-Run-Smoke-Test ohne DB/Netz erfolgreich.

---

## 11. Adapter-Status & Datenqualität (Update 2026-06-06)

Fokus: Datenquellen-Status sichtbarer machen + zwei risikofreie, gleichartige Härtungen (**EIA- und FRED-Key-Guard**). **Kein** Active Gate, **keine** Migration, **kein** `source_health`, **kein** Secret berührt. W6b bleibt gesperrt.

### 11.1 Statusmatrix der aktiven Indikator-Quellen

| Adapter | Indikator(en) | Zustand | previous_value | Hinweis | C2-Delta prüfbar? |
|---------|---------------|---------|----------------|---------|-------------------|
| `bnetza.py` (GIE AGSI+) | `wi-gasspeicher-fuellstand` | stabil | ✓ | Fallback liefert immer ein Item (maskiert „Erfolg" trotz Fehler) | ja |
| `destatis.py` | `wi-inflation-vpi-de` | **defekt gemeldet (HTTP 404)** | ✓ | Fehlerzweig → Fallback + C4-Shadow greift; Live-Wert evtl. veraltet | ja |
| `eia.py` | `wi-oel-brent` | stabil (**gehärtet**) | ✓ | NEU: Key-Guard — ohne `EIA_API_KEY` kein Request, sauberer Quellfehler | ja |
| `fred.py` | `wi-gaspreis-europa` | **defekt gemeldet (HTTP 400)**, jetzt **gehärtet** | ✓ | NEU: Key-Guard — ohne `FRED_API_KEY` kein Request, sauberer Quellfehler (entschärft Missing-Key-Fall). 400 **mit** Key = Endpoint/Parameter-Frage → Daten-Task. Sonst sauberste Adapter-Impl. | ja |
| `fao.py` | `wi-fao-food-price-index` | stabil, **fragil** | ✓ | statische `sfvrsn`-URL + User-Agent-Spoofing → bricht bei FAO-Update | ja |
| `tankerkoenig.py` | `wi-kraftstoffpreis-super-e10`, `-diesel` | stabil (live-verifiziert) | **✗ (bewusst)** | Tagesstichprobe über 16 PLZ, keine Historisierung beabsichtigt | **nein** |

Deaktiviert (nicht in `main.py`): `eurostat.py` (Stub — API gerufen + verworfen) · `warning_indicators.py` (redundant zu `eia.py`). Imports bleiben für Tests/Reaktivierung.

### 11.2 Stabil / defekt / unvollständig

- **Stabil & belastbar:** GIE (Gasspeicher), EIA (Brent, jetzt mit Guard), Tankerkönig (Sprit).
- **Defekt gemeldet (HTTP-Fehler, Fallback + C4-Shadow greifen, Wert evtl. veraltet):** Destatis VPI (404), FRED Erdgas-EU (400). FRED hat jetzt zusätzlich einen Key-Guard (Missing-Key-Fall sauber abgefangen); die 400 **mit** gesetztem Key bleibt eine Endpoint/Parameter-Frage. Eigentliche Reparatur = **separater Daten-Task** (Endpoint/Parameter/Key klären) — hier bewusst nicht berührt (kein Secret, keine API-Reparatur).
- **Fragil (kein Defekt, aber Bruchrisiko):** FAO (URL-/UA-Abhängigkeit).
- **Unvollständig:** Tankerkönig ohne `previous_value` → C2-Delta-Anomalie für Spritpreise nicht prüfbar (bewusste Tagesstichprobe, kein Bug).
- **Deaktiviert/Stub:** Eurostat, WarningIndicators.

### 11.3 Was fehlt vor einem möglichen W6b (Active Gate)?

W6b bleibt gesperrt. Unabhängig von der Freigabe fehlt für ein sinnvolles Scharfstellen:

1. **Shadow-Fehlalarm-Auswertung** über mehrere echte Läufe (C1–C4 kalibrieren).
2. **C3-Beobachtbarkeit im Dry-Run:** DB-Schwellen sind `None` → C3 (Schwellenriss) ohne DB-Werte nicht prüfbar.
3. **C2 für Tankerkönig:** ohne `previous_value` kein Delta-Check (Historisierung = DB-/Schema-Frage → **Freigabe nötig**).
4. **Echte Ausreißer** in den Zeitreihen, um C1/C2 überhaupt auszulösen.

→ Kalibrierung/Beobachtbarkeit, kein Code-Blocker — aber ohne diese Punkte wäre ein Active Gate blind scharfgestellt.

### 11.4 Risikofreie Härtung in diesem PR

- **EIA-Key-Guard** (`eia.py`, `fetch_brent`): ohne `EIA_API_KEY` wird **gar nicht** angefragt; der Fehlerzweig meldet `api_key_missing` als Quellfehler (W6a.1-C4) und liefert den **bestehenden** Fallback. Kein Secret berührt, keine Änderung am Erfolgspfad.
- **FRED-Key-Guard** (`fred.py`, `fetch_gas_price`): identisches Muster — ohne `FRED_API_KEY` kein Request, `api_key_missing`-Quellfehler + bestehender Fallback. Verhindert einen kaputten Request (Missing-Key → unnötiger HTTP-Fehler). Kein Secret, kein Eingriff in den Erfolgspfad.
- **Tests:** neue `test_eia_guards_missing_api_key` und `test_fred_guards_missing_api_key`; alle bestehenden FRED-/EIA-Mock-Tests auf gültigen Key umgestellt (prüfen weiter ihren Mock-Pfad — die zuvor protokollierte CI-Falle „gemockter Test fällt ohne Key in den Guard-Fallback" ist damit ausgeschlossen). Verifiziert: FRED/EIA/source-error-Gruppe **16 passed**; volle gemockte Suite **112 passed, 5 skipped** (DB-Integration; 5 Live-Adapter-Tests deselektiert).

### 11.5 Empfehlungen (bewusst NICHT in diesem PR umgesetzt)

- **CI-Härtung:** ✅ **erledigt (siehe §12)** — Live-API-Tests mit `@pytest.mark.live` markiert und per `addopts = -m "not live"` aus der Default-/PR-CI genommen.
- **Public-Transparenz** (risikoarm, vorhandene Felder, **kein Alarm**): `current_value_date`/`last_ingested_at` je Indikator als ruhiges „Stand"-Label sichtbarer; optional dezenter Trend-Hinweis aus `current_value` vs. `previous_value`. *(eigener kleiner Web-PR — Scope-Trennung, nicht hier)*
- **FAO-Robustheit:** statische `sfvrsn`-URL gegen stabilere Bezugsquelle/Parameter prüfen.
- **Destatis/FRED-Reparatur:** Key-Guard ist erledigt; offen bleibt die eigentliche Endpoint/Parameter-Klärung (FRED 400 mit Key, Destatis 404) in separatem Daten-Task (Risikogate: ggf. Keys/Credentials).

**Bewusst nicht angefasst (Risikogate/Freigabe):** `source_health`-Tabelle, UI-Anomaly-Badge, W6b/Active Gate, Tankerkönig-Historisierung, Destatis/FRED-API-Reparatur mit Secrets.

---

## 12. Test-/CI-Strategie & offene Daten-Tasks (Update 2026-06-06, PR G)

Fokus: Test- und Datenfundament stabilisieren — **kein** W6b, **kein** Active Gate, **keine** `source_health`-Logik, **keine** Migration. Reine Test-Isolierung + Doku.

### 12.1 Gemockt vs. live — saubere Trennung

Die Adapter-/Integrationstests, die **echte externe APIs** rufen, waren in der CI die Flakiness-Quelle (`intelligence-verify`-Timeouts, vgl. CI-Live-API-Notiz). Sie sind jetzt isoliert:

- **Marker:** `@pytest.mark.live` an genau den 7 Live-Tests:
  - `test_adapters.py`: `test_destatis_adapter`, `test_bnetza_adapter`, `test_fao_adapter`, `test_eurostat_adapter`, `test_warning_indicators_adapter` (echter API-Call, kein Mock).
  - `test_integration.py`: `TestFullPipeline::test_all_adapters_produce_items`, `::test_adapter_items_persist_as_drafts` (rufen echte Adapter; zusätzlich `@skipdb`).
- **Default-Ausschluss:** `pyproject.toml` → `[tool.pytest.ini_options]` mit `addopts = "-m 'not live'"`. Die CI (`python -m pytest tests/ -q`) und jeder lokale Default-Lauf überspringen Live damit automatisch.
- **Wichtig — NICHT live:** die gemockten Tests mit „live" im Namen (`test_*_maps_*_to_indicator_live_value`) bleiben **un**markiert (sie mocken `requests` und gehören in die CI).
- **Manuell live prüfen:** `python -m pytest -m live` (überschreibt das Default-Filter). Empfohlen vor Adapter-Releases / bei Quell-Verdacht — bewusst außerhalb der PR-CI.

Verifiziert: Default-Lauf **115 passed, 3 skipped (DB-Integration), 7 deselected (live)**; `-m live` sammelt exakt diese 7. Kein Unknown-Marker-Warning.

### 12.2 Offene Daten-Tasks (separat, nicht in PR G)

| Task | Status / Befund | Nächster Schritt | Risikogate |
|------|-----------------|------------------|------------|
| **Destatis VPI 404** | Endpoint/Tabelle liefert 404; Fallback + C4-Shadow greifen, Live-Wert evtl. veraltet | GENESIS-Endpoint/Tabelle 61111-0002 + Credentials prüfen | ggf. Credentials |
| **FRED 400 (mit Key)** | Key-Guard erledigt; 400 mit gesetztem Key = Parameter/Serie offen | `PNGASEUUSDM`-Parameter/`api_key` gegen FRED-Doku verifizieren | ggf. Key |
| **Tankerkönig `previous_value`** | bewusst `✗` (Tagesstichprobe über 16 PLZ, keine Historie) → **C2-Delta für Sprit nicht prüfbar** | Historisierung = DB/Schema → **Freigabe nötig** | DB-Schema/Migration |
| **C3 DB-Schwellen** | Schwellen sind `None` → C3 (Schwellenriss) ohne DB-Werte **nicht prüfbar** | als **W6b-Voraussetzung** vormerken; Schwellen-Quelle/Seed klären | DB/Schema, W6b |

→ Alle vier sind **Voraussetzungen/Vorarbeiten**, kein Code-Blocker in PR G. Ein Active Gate (W6b) bliebe ohne C2 (Sprit) und C3 (Schwellen) teilweise blind — daher bleibt W6b gesperrt, bis diese Punkte beobachtbar sind.

