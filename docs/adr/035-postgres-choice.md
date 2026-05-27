---
adr: 035
title: Datenbank — Postgres 16 Self-Host auf IONOS-VPS
status: accepted
date: 2026-05-22
accepted_date: 2026-05-22
superseded_date:
wave: W0
deciders: Jean Schütz
relates_to: 026, 034
supersedes: —
superseded_by: —
---

# ADR-035 — Datenbank: Postgres 16 Self-Host

## Kontext

Der Backend-Pivot (ADR-034) verlangt eine Datenbank, die gleichzeitig Frontend-Reads, Editorial-Pflege, Auth-Sessions, Haushaltsprofile und ab Welle W2 Live-Ingestion bedient. Die DB muss DSGVO-konform in Deutschland laufen, deterministisch backupbar sein und mit der bestehenden IONOS-VPS-Topologie koexistieren (siehe ADR-030: Traefik-Reverse-Proxy, Docker-Compose-Stack unter `/opt/wachsam/`).

### Anforderungen

- DSGVO-konform und deutscher Standort.
- Self-Host auf IONOS-VPS mit ca. 1–2 GB RAM-Budget für die DB.
- Concurrency ohne Lock-Engpass bei parallelem Editorial- und Ingest-Traffic.
- Semi-strukturierte Daten (z.B. `germany_relevance`, `methodology_tag`, Quellen-Arrays) effizient indizierbar.
- Volltext-Suche für später ingestierte News-Items.
- Stabile Drizzle-ORM-Unterstützung (TypeScript primary, siehe ADR-036).
- Deterministisches Backup-Verfahren (Cron + Off-Site).
- Skala bis Millionen Rows (Adapter-Runs, ingestierte Items, Audit-Trails).

## Anwärter

### Option A — Postgres 16 in Docker

- Mature relationale DB, JSONB für strukturierte Sub-Objekte, `tsvector` für Full-Text-Search.
- Skala unproblematisch bis weit über Millionen Rows.
- MVCC-Concurrency-Modell — keine Lock-Engpässe bei paralleler Schreib-Last.
- Drizzle-ORM hat Postgres als Primary-Target; Migrations-Tooling ausgereift.
- Backup über `pg_dump` trivial scriptbar.
- Speicher: 1–2 GB RAM, je nach Workload skalierbar.

### Option B — PocketBase

- All-in-one Backend mit eingebauter Admin-UI, SQLite-basiert.
- Schnelle Time-to-First-Value.
- Concurrency-Limits durch SQLite-WAL — Schreib-Last serialisiert.
- Editorial-UI ist generisch, nicht WachSam-spezifisch anpassbar ohne Hacks.
- Kein nativer Drizzle-Pfad, eigenes Tooling.

### Option C — Supabase Self-Hosted

- Postgres-basiert, mit Auth, Storage, Realtime und Studio-UI.
- DSGVO-konform self-hosted möglich, AVV-Frage durch Eigenbetrieb gelöst.
- Operativer Footprint groß (mehrere Container, Realtime-Service, Storage-Service, Studio).
- Lock-in über Supabase-spezifische Auth-/Storage-Konventionen.
- Mehr Komplexität als nötig für aktuellen Scope.

### Option D — SQLite via better-sqlite3

- Embedded, kein separater DB-Container.
- Excellent für Read-heavy Workloads mit niedriger Schreib-Concurrency.
- WAL-Mode hat ernste Limits bei paralleler Schreib-Last (Editorial + Ingest + Auth-Sessions).
- JSON-Support vorhanden, aber kein JSONB-Index und kein nativer Full-Text-Vergleich mit Postgres.
- Backup über Datei-Copy möglich, aber atomar nur über `VACUUM INTO`.

### Option E — MariaDB

- Etablierte relationale DB, MySQL-kompatibel.
- JSON-Support funktional, aber weniger ausgereift als Postgres-JSONB.
- Full-Text-Search vorhanden, weniger flexibel als `tsvector`.
- Drizzle unterstützt MariaDB, aber Postgres-Pfad ist deutlich gepflegter.
- Kein klarer Vorteil gegenüber Postgres.

### Option F — MongoDB

- Document-DB, Schema-flexibel.
- Falsche Modellierung für WachSam-Daten — Items, Quellen, Adapter-Runs sind relational.
- Joins und referenzielle Integrität nur via App-Layer.
- Operativer Footprint und Lizenz-Fragen (SSPL) zusätzlich problematisch.

## Bewertung

Skala: ✅ stark · ◐ akzeptabel · ⚠ schwach

| Kriterium | Postgres 16 | PocketBase | Supabase | SQLite | MariaDB | MongoDB |
|---|---|---|---|---|---|---|
| DSGVO / DE-Hosting | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ |
| Concurrency (parallele Schreiber) | ✅ | ⚠ | ✅ | ⚠ | ✅ | ✅ |
| Semi-strukturierte Daten (JSONB-Index) | ✅ | ◐ | ✅ | ◐ | ◐ | ✅ |
| Full-Text-Search | ✅ | ◐ | ✅ | ◐ | ◐ | ◐ |
| Drizzle-ORM-Standard | ✅ | ⚠ | ✅ | ◐ | ◐ | ⚠ |
| Skala bis Millionen Rows | ✅ | ⚠ | ✅ | ⚠ | ✅ | ✅ |
| Backup-Trivialität | ✅ | ✅ | ◐ | ✅ | ✅ | ◐ |
| Ops-Footprint auf IONOS-VPS | ✅ | ✅ | ⚠ | ✅ | ✅ | ⚠ |
| Editorial-Anpassbarkeit (eigene UI) | ✅ | ⚠ | ◐ | ✅ | ✅ | ✅ |
| Relationale Integrität | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠ |

## Entscheidung

WachSam nutzt **Postgres 16** in Docker auf dem IONOS-VPS, mit **Drizzle ORM** als TypeScript-Mapping-Schicht. PocketBase, Supabase Self-Hosted, SQLite, MariaDB und MongoDB werden verworfen.

## Begründung

- **JSONB für strukturierte Sub-Objekte.** `germany_relevance`, `methodology_tag`, Quellen-Arrays und Causal-Links lassen sich nativ und indizierbar speichern, ohne separate Tabellen für jedes Sub-Feld.
- **tsvector für Full-Text-Search.** Spätere News- und Source-Item-Suche braucht echten Text-Index. Postgres bringt das nativ mit.
- **Skala unproblematisch.** Adapter-Runs, ingestierte Drafts und Audit-Trails wachsen langfristig in den Millionen-Bereich. Postgres bleibt dabei innerhalb der VPS-Ressourcen handhabbar.
- **Keine Concurrency-Limits.** Editorial-Schreiber, Ingest-Worker und Auth-Session-Writes laufen parallel ohne SQLite-typische Serialisierung.
- **Drizzle-Standard.** Drizzle-Migrations sind Single-Source des DB-Schemas. TypeScript-Typen und SQL-Schema bleiben im Lockstep.
- **Backup trivial.** `pg_dump` ist deterministisch, scriptbar, off-site-übertragbar (rsync / S3-kompatibel).
- **Speicherbudget passt.** Postgres 16 läuft komfortabel mit 1–2 GB RAM für den erwarteten v0.3-Workload und kann später vertikal skaliert werden.
- **DSGVO out-of-the-box.** Postgres-Container läuft auf bestehendem IONOS-VPS in deutschem Rechenzentrum mit AVV.

## Konsequenzen

- Drizzle-Migrations unter `v02/db/migrations/` sind **die einzige Quelle** des DB-Schemas. Keine manuellen SQL-Edits in Production.
- `pg_dump`-Backup als Cron-Job mit Off-Site-Sync wird Bestandteil von Welle W1.1 (Postgres-Setup).
- Postgres-Container kommt in den bestehenden Docker-Compose-Stack unter `/opt/wachsam/` (siehe ADR-030 für VPS-Topologie). Eigenes Volume, kein Bind-Mount in tracked Pfade.
- Connection-String wird über sichere Env-Variable bereitgestellt; **kein VPS-lokales `.env` als Single Source** (ADR-033 §Architekturgrenzen).
- Editorial-UI wird WachSam-spezifisch unter `v02/web/admin` gebaut (siehe ADR-036), nicht über generische Admin-Tools.
- Ingest-Container (ADR-038) schreibt direkt in Postgres über dieselbe Drizzle-Schema-Definition; Python-Seite nutzt SQLAlchemy oder rohes SQL, aber gegen das von Drizzle generierte Schema.

## Risiken

- **Risiko:** Postgres-Container-Ressourcenverbrauch wächst über VPS-Budget.
  - **Auswirkung:** n8n- oder andere Container leiden, OOM-Killer aktiv.
  - **Gegensteuerung:** Docker-Compose-Limits (`mem_limit`), Monitoring der Postgres-Statistiken, vertikales VPS-Upgrade als Notfallpfad dokumentiert.
- **Risiko:** Backup-Cron schlägt unbemerkt fehl.
  - **Auswirkung:** Datenverlust bei DB-Crash.
  - **Gegensteuerung:** Backup-Cron schreibt Statusdatei mit Timestamp, separater Health-Check verifiziert Frische. Off-Site-Sync ist Pflicht-Schritt, nicht optional.
- **Risiko:** Migration ohne Rollback-Pfad zerstört Production-Daten.
  - **Auswirkung:** Down-Time, manuelle Recovery.
  - **Gegensteuerung:** `pg_dump` vor jeder Production-Migration. Drizzle-Migrations werden in Staging-Container getestet, bevor sie Production erreichen.
- **Risiko:** Single-Postgres-Instanz ohne Replikation = Single-Point-of-Failure.
  - **Auswirkung:** DB-Ausfall = App-Ausfall.
  - **Gegensteuerung:** Akzeptiert für v0.3-Scope. Replikation oder Managed-DB ist explizit deferred bis Wave W3+.

## Open Decisions

- Off-Site-Backup-Ziel (S3-kompatibler Bucket vs. zweiter VPS) — wird in W1.1 entschieden.
- Konkrete Postgres-Resource-Limits in Docker-Compose — wird in W1.1 nach erstem Load-Test fixiert.

## Status

`accepted` seit 2026-05-22. Setup in Welle W1.1.

## Status-History

| Datum | Von | Nach | Auslöser |
|---|---|---|---|
| 2026-05-22 | — | accepted | DB-Entscheidung im Rahmen Backend-Pivot W0 |
