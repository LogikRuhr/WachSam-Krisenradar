---
adr: 038
title: Live-Ingestion Architektur — Python+Scrapy Worker mit Editorial-Approval-Queue
status: accepted
date: 2026-05-22
accepted_date: 2026-05-22
superseded_date:
wave: W0
deciders: Jean Schütz
relates_to: 028, 033, 034, 035, 036
supersedes: —
superseded_by: —
---

# ADR-038 — Live-Ingestion Architektur

## Kontext

ADR-033 hat die Boundaries für Live-Ingestion als Future-Work-Konzept festgelegt (zulässige Quellen, Architekturgrenzen, Validierung vor Veröffentlichung, Rollback-Pfade). Mit dem Backend-Pivot (ADR-034) ist Live-Ingestion produktive Anforderung ab Welle W2. ADR-038 konkretisiert die Architektur: Welche Komponenten, welche Daten-Pfade, welche Audit-Trails, welche No-Publish-Logik.

ADR-038 ist eine Architektur-Spec. Die Implementierung erfolgt in Welle W2 und folgenden — nicht in W1.

### Anforderungen

- Ingestion ist isoliert vom Frontend-Stack (siehe ADR-036).
- Jede ingestierte Aussage durchläuft Editorial-Review, bevor sie in produktiven Tabellen landet.
- Schema- und Methodology-Gates aus ADR-028 sind hard, kein Bypass möglich.
- Per-Source-Status ist sichtbar in der Editorial-UI.
- Run-Log mit `adapter_id`, Zeitstempel, HTTP-Status und Source-Fingerprint ist Pflicht.
- No-Publish bei Schema-Fail oder bei zwei konsekutiven Adapter-Fehlern.
- Editorial-Approval ist deterministische Zustandsmaschine — keine impliziten Übergänge.

## Entscheidung

Live-Ingestion läuft als **Python+Scrapy Worker** in isoliertem Docker-Container unter `v02/ingest-py/`. Worker schreibt **direkt in Postgres** (siehe ADR-035), aber **nur in Staging-Tabellen** (`editorial_drafts` und Adjazenten). Inhalte erscheinen in produktiven Tabellen erst nach Editorial-Approval über das **Publish-Gate-UI** unter `v02/web/admin`. Die Architektur implementiert ADR-033 Boundaries 1:1.

## Architektur-Komponenten

### 1. Adapter pro Quelle

Jede Quelle oder Quellfamilie bekommt eine eigene Python-Adapter-Klasse:

- Eigene `adapter_id` (z.B. `fao_food_price_index`, `iw_koeln_makro`, `bsi_lageberichte`, `destatis_vpi`, `bundesnetzagentur_gasfuellstand`).
- Eigene Konfiguration (Source-URL, Polling-Intervall, Schema-Mapping-Regeln).
- Eigene Item-Pipeline für Severity-, Confidence- und Methodology-Tag-Mapping.
- Subklasse von Scrapy-Spider mit `parse()`-Implementierung pro Quelle.

Adapter sind unabhängig deploybar, einzeln aktivierbar und einzeln pausierbar.

### 2. Run-Log-Tabelle

Tabelle `adapter_runs` in Postgres:

| Feld | Typ | Inhalt |
|---|---|---|
| `id` | uuid | Primary Key |
| `adapter_id` | text | Adapter-Identifier |
| `started_at` | timestamptz | Lauf-Start |
| `ended_at` | timestamptz | Lauf-Ende (nullable solange running) |
| `ok` | boolean | Lauf-Ergebnis |
| `http_status` | int | HTTP-Status der Quelle |
| `source_fingerprint` | text | SHA-256 des Source-Content |
| `items_ingested` | int | Anzahl ingestierter Drafts |
| `error_message` | text | Fehler-Beschreibung bei `ok=false` |

Jeder Adapter-Lauf schreibt genau eine Zeile. Run-Log ist immutable — Korrekturen über neue Zeilen, keine Updates.

### 3. Source-Fingerprint

Vor jeder Verarbeitung berechnet der Adapter einen Source-Fingerprint (SHA-256 des Source-Content). Der Fingerprint wird im Run-Log persisted. Identische Fingerprints zwischen Läufen bedeuten unveränderte Quelle — keine neuen Drafts werden erzeugt, der Lauf wird mit `ok=true` und `items_ingested=0` abgeschlossen.

### 4. Editorial-Approval-Queue

Tabelle `editorial_drafts` in Postgres:

| Feld | Typ | Inhalt |
|---|---|---|
| `id` | uuid | Primary Key |
| `adapter_run_id` | uuid | FK auf `adapter_runs` |
| `target_table` | text | Zielname in produktiven Tabellen (z.B. `lagebild_items`, `warning_indicators`) |
| `target_id` | uuid | Optionaler FK auf bestehenden Item-Datensatz (Update vs. Insert) |
| `payload_jsonb` | jsonb | Vorgeschlagener Datensatz, vollständig schema-valid |
| `diff_jsonb` | jsonb | Diff gegen aktuellen produktiven Stand (für Update-Drafts) |
| `methodology_tag` | text | Pflichtfeld gemäß ADR-028 |
| `germany_relevance` | jsonb | Pflichtfeld gemäß ADR-028 |
| `retrieved_at` | timestamptz | Setzt der Adapter, nicht editierbar |
| `status` | text | `pending` \| `approved` \| `rejected` \| `quarantined` |
| `reviewer_id` | uuid | FK auf Editorial-User, nullable bis Review |
| `reviewed_at` | timestamptz | nullable bis Review |
| `review_note` | text | Editorial-Notiz, optional |

Drafts mit `status=pending` erscheinen in der Editorial-UI. Drafts mit `status=approved` werden durch einen separaten Publish-Worker in die produktiven Tabellen geschrieben (idempotent, mit `target_id`-Lookup für Updates).

### 5. Publish-Gate-UI

Editorial-UI unter `v02/web/admin/drafts`:

- Liste aller `pending` Drafts mit Source-Pill, methodology_tag, Confidence, germany_relevance.
- Diff-Anzeige gegen aktuellen produktiven Stand bei Update-Drafts.
- Approve-/Reject-/Quarantine-Buttons mit Review-Note-Feld.
- Adapter-Status-Übersicht: pro Adapter letzter Lauf, ok-Status, letzte Fingerprint-Änderung.

Nur authentifizierte User mit Editorial-Rolle haben Zugriff. Auth über Auth.js v5 (siehe ADR-036).

### 6. UI-Status pro Source

Im Frontend (`v02/web/`) zeigt jede betroffene Section pro Item den Quellen-Status:

- `live` — letzter Adapter-Lauf erfolgreich, Daten frisch.
- `stale` — letzter Adapter-Lauf länger als das adapter-spezifische Frische-Fenster zurück.
- `error` — letzter oder zweitletzter Adapter-Lauf fehlgeschlagen.

Status wird über Server-Component aus Postgres-Aggregaten berechnet, nicht client-side.

### 7. No-Publish-Logik

Hard-Gates, die einen Draft am `approved`-Übergang hindern:

- Schema-Fail: `payload_jsonb` validiert nicht gegen das Ziel-Schema → Draft wird mit `status=quarantined` markiert, kein Approve möglich.
- Forbidden-Language-Hit (ADR-028 G-Language): Draft enthält verbotene Begriffe → `quarantined`.
- Provenance-Fail: `source_fingerprint`, `adapter_run_id` oder `retrieved_at` fehlen → `quarantined`.
- Zwei konsekutive Adapter-Fehler: Editorial-UI markiert den Adapter als `degraded`, neue Drafts können erst nach manuellem Adapter-Reset durch Editorial-User wieder erzeugt werden.

Quarantined Drafts bleiben sichtbar, können aber nicht approved werden. Sie können nur rejected oder via manueller Korrektur in einen neuen `pending` Draft überführt werden (mit Audit-Trail).

### 8. Alerting

Zwei oder mehr konsekutive `ok=false`-Läufe eines Adapters lösen Alerting aus:

- E-Mail an Editorial-User via Resend (siehe ADR-036).
- Adapter-Status in Editorial-UI auf `degraded` gesetzt.
- Keine neuen automatischen Läufe, bis Editorial-User den Adapter explizit zurücksetzt.

## Begründung

- **ADR-033 1:1 implementiert.** Adapter-pro-Quelle, kein monolithischer Cron, Per-Adapter-Run-Log, Schema-Gate im Ingest-Pfad, Per-Source-Status, Alerting ab zwei Fehlern, Rollback-Pfad — jeder Punkt aus ADR-033 ist hier konkretisiert.
- **Klare Trennung Staging vs. Production.** Adapter dürfen Postgres beschreiben, aber nur in `editorial_drafts` und `adapter_runs` — niemals direkt in produktive Tabellen. Damit kann kein Adapter-Bug Production-Daten überschreiben.
- **Editorial-Review als Hard-Gate.** Methodology-Gates (ADR-028) werden im Editorial-Workflow durchgesetzt, nicht im Adapter-Code. Adapter erzeugen Vorschläge, Editorial entscheidet.
- **Idempotente Publish-Worker.** Drafts mit `target_id` werden als Update angewendet, ohne `target_id` als Insert. Mehrfach-Approve desselben Drafts hat keinen zusätzlichen Effekt.
- **Audit-Trail vollständig.** Jeder produktive Datensatz lässt sich zu einem Draft, zu einem Adapter-Lauf, zu einer Source-URL und zu einem Reviewer zurückverfolgen.
- **Isolation per Container.** Adapter-Crash kann maximal den Ingest-Container runterziehen, nie das Frontend oder die Auth-Schicht.
- **Backpressure möglich.** Wenn Editorial-Queue zu lang wird, kann der Adapter pausieren, ohne dass Production-State leidet.

## Konsequenzen

- **Implementierung in Welle W2+**. W1 ist Python-frei und Ingestion-frei. Erst nach W1.7-Cutover beginnt W2 mit der Ingest-Schicht.
- **Schema-Definitionen in `v02/db/`**. Drizzle-Migrations definieren `adapter_runs`, `editorial_drafts` und die produktiven Ziel-Tabellen. Python-Seite konsumiert das Schema über SQL oder SQLAlchemy-Stubs (Detail in W2-Planning).
- **Erster Pilot-Adapter wird in W2.1 entschieden**. Wahrscheinliche Kandidaten: FAO Food Price Index, Bundesnetzagentur Gasfüllstand, Destatis VPI — jeweils mit stabilen `https://`-Dokumenten und klarer Deutschland-Relevanz.
- **G3-Liveness-Policy** wird in W2.0 als Hard-Gate operationalisiert (aktuell advisory laut ADR-028). Ohne G3-Hard-Gate kein Ingest-Adapter-Launch.
- **ADR-033 wird parallel von `draft` auf `accepted` gehoben** — die Boundaries gelten ab jetzt operativ.
- **Methodology-Gates aus ADR-028** sind im Editorial-Workflow durchgesetzt. Forbidden-Language, Provenance-Pflicht, Stale-Data-Handling und Publish-Binary bleiben Hard.

### Pfad-übergreifende Nicht-Konsequenzen

- Frontend-Code (`v02/web/`) kennt keine Python-Klassen, kein Scrapy-Import, keine Adapter-Logik.
- API-Routes lesen aus produktiven Tabellen, niemals aus `editorial_drafts`.
- Endnutzer sehen keine Drafts, keine Adapter-Status-Logs außer dem hochaggregierten `live/stale/error`-Flag pro Item.

## Risiken

- **Risiko:** Editorial-Queue wächst schneller, als Reviewer sie abarbeiten können.
  - **Auswirkung:** Drafts veralten, Production-Stand wird stale.
  - **Gegensteuerung:** Adapter-Polling-Intervalle pro Quelle adaptiv setzen, Backpressure-Mechanismus (Adapter pausiert bei zu langer Queue), Editorial-UI mit Priority-Sortierung.
- **Risiko:** Adapter werden zu permissiv und ingesten Items, die methodisch nicht zu WachSam passen.
  - **Auswirkung:** Editorial muss exzessiv viel rejecten, Vertrauen in Pipeline sinkt.
  - **Gegensteuerung:** Strikte Item-Pipelines pro Adapter, Schema-Validation hart, Mapping-Regeln per Adapter dokumentiert und reviewed.
- **Risiko:** Source ändert Format oder URL, Adapter bricht silent.
  - **Auswirkung:** Production-Stand veraltet ohne sichtbaren Hinweis.
  - **Gegensteuerung:** Stale-Flag im UI, Alerting ab zwei Fehlern, Per-Source-Status in Editorial-UI.
- **Risiko:** Source-Fingerprint-Berechnung ist instabil (z.B. wechselnde Timestamps in Response-Header).
  - **Auswirkung:** Adapter erzeugt bei jedem Lauf neue Drafts, Editorial-Queue spammt.
  - **Gegensteuerung:** Fingerprint nur über inhaltlich relevante Felder, dokumentiert pro Adapter; bei Quelle mit instabilem Format zusätzliche Normalisierung.
- **Risiko:** Quarantined Drafts werden vergessen.
  - **Auswirkung:** Hinweise auf Mapping-Bugs verloren.
  - **Gegensteuerung:** Quarantined-Liste in Editorial-UI als eigene Sicht, Quarantine-Counter pro Adapter sichtbar.

## Open Decisions

- Erster Pilot-Adapter — wird in W2.1 entschieden.
- Polling-Mechanismus (Cron im Ingest-Container vs. externe Orchestrierung) — wird in W2.0 entschieden.
- Off-Site-Persistence für Quarantined Outputs — wird in W2.0 entschieden.
- Welche Schema-Stub-Strategie Python nutzt (manuelle SQLAlchemy-Modelle vs. generierte Stubs aus Drizzle) — wird in W2-Planning entschieden.
- Wie viele erfolgreiche Trockenläufe vor dem ersten Production-Approve verlangt werden — wird in W2.1 entschieden.

## Explicit deferred

Die folgenden Punkte sind explizit nicht Teil von ADR-038 und werden in separaten ADRs oder Wellen adressiert:

- Notifications an Endnutzer (E-Mail, Web-Push) — Welle W2.x oder W3.
- Auto-Approval-Regeln für „triviale" Updates — nicht in v0.3.
- ML-basierte Adapter-Hinweise (z.B. Severity-Vorschläge) — nicht in v0.3.
- Real-time Streaming-Quellen (WebSocket, SSE) — nicht in v0.3.

## Status

`accepted` seit 2026-05-22 als Architektur-Spec. Implementierung in Welle W2 und folgenden.

## Status-History

| Datum | Von | Nach | Auslöser |
|---|---|---|---|
| 2026-05-22 | — | accepted | Architektur-Konkretisierung von ADR-033 im Rahmen Backend-Pivot W0 |
