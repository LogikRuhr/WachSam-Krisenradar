---
adr: 036
title: Stack — TypeScript primary, Python für Live-Ingestion ab Welle W2
status: accepted
date: 2026-05-22
accepted_date: 2026-05-22
superseded_date:
wave: W0
deciders: Jean Schütz
relates_to: 034
supersedes: —
superseded_by: —
---

# ADR-036 — Stack: TypeScript primary, Python für Ingestion

## Kontext

Der Memory-Pin „1 Sprache, 1 Stack, Self-Hosted Vendor-Lock" (2026-05-03) hat festgelegt, dass WachSam TypeScript-only fährt. Mit dem Backend-Pivot (ADR-034) und der Live-Ingestion-Schicht (ADR-038) entsteht ein neuer Anwendungsfall: das systematische, robuste Crawlen und Parsen von News- und Behörden-Quellen.

### Anforderungen

- Frontend, API-Routes und Editorial-Oberfläche in einer einheitlichen TypeScript-Toolchain.
- Live-Ingestion muss robuste HTTP-Retries, Rotating-User-Agents, HTML-Parsing, PDF-Parsing, RSS/Atom-Parsing und Source-Fingerprinting beherrschen.
- Kein zusätzlicher Sprach-Stack im Core (Frontend + API).
- Klare Isolation zwischen Frontend-Code und Ingestion-Code, damit Frontend-Dependencies nicht durch Ingest-Libraries aufgebläht werden.
- Ingestion-Schicht muss eigenständig deploybar und neustartbar sein.

### Bestandsaufnahme

- Next.js 15 mit App-Router ist Stand der Technik für TypeScript-Fullstack-Apps; Server Actions und API-Routes decken Backend-Bedarf ab.
- Drizzle-ORM ist Postgres-First (ADR-035).
- Auth.js v5 (NextAuth-Nachfolger) ist der TypeScript-Standard für Auth in Next.js.
- Resend ist DSGVO-konformer transactional E-Mail-Provider mit deutscher Datenresidenz-Option.
- Python + Scrapy ist State-of-the-Art für strukturiertes News-Crawling: ausgereifte Middleware-Pipelines, eingebaute Throttling, ItemPipeline für Validierung.
- Alternative TypeScript-Scraping-Stacks (Playwright, Cheerio, Crawlee) decken Browser-Automation, aber Scrapy ist im News-Adapter-Bereich klar überlegen (Feed-Parsing, robots.txt, Rate-Limiting, Item-Pipelines).

## Anwärter

### Option A — TypeScript-only (Next.js für alles, inkl. Ingestion)

- Konsequente Ein-Sprach-Linie.
- Crawlee oder eigene Playwright-Pipelines für Ingestion.
- Mehr Eigenentwicklung für News-Adapter-Standardfälle (Feed-Parsing, Throttling, robots.txt).

### Option B — TypeScript primary + Python für Ingestion (W2+)

- Frontend + API + Editorial: Next.js 15 + Drizzle + Auth.js v5.
- Ingestion: Python + Scrapy in isoliertem Docker-Container, schreibt nur in Postgres.
- Sprach-Footprint im Core bleibt TypeScript.

### Option C — Go für Ingestion

- Performant, statisch typisiert, gute HTTP-Libraries.
- Kein vergleichbares News-Crawling-Framework wie Scrapy.
- Würde Sprach-Stack auf drei erweitern (TS Frontend + Go Ingest + perspektivisch Python für ML).

## Bewertung

Skala: ✅ stark · ◐ akzeptabel · ⚠ schwach

| Kriterium | A (TS-only) | B (TS + Python) | C (TS + Go) |
|---|---|---|---|
| Ein-Sprach-Disziplin im Core | ✅ | ✅ | ✅ |
| News-Crawling-Reife | ◐ | ✅ | ⚠ |
| Sprach-Footprint gesamt | ✅ | ◐ | ⚠ |
| Eigenentwicklungs-Aufwand Ingestion | ⚠ | ✅ | ⚠ |
| Container-Isolation möglich | ✅ | ✅ | ✅ |
| Dependency-Bloat im Frontend | ⚠ | ✅ | ✅ |

## Entscheidung

**TypeScript primary, Python für Ingestion ab Welle W2.** Frontend, API-Routes und Editorial-Oberfläche unter `v02/web/` in Next.js 15 + Drizzle + Auth.js v5 + Resend. Live-Ingestion unter `v02/ingest-py/` als Python + Scrapy in eigenem Docker-Container ab Welle W2.

## Begründung

- **Frontend + Editorial profitieren von TS+Next.** Server Actions, Type-Safety zwischen Drizzle-Schema und API-Layer, eingebaute Image-/Font-Optimierung, App-Router mit Streaming. Editorial-UI bleibt WachSam-spezifisch und wachsam.de-nahe.
- **Python + Scrapy ist State-of-the-Art für News-Ingestion.** Spider, ItemPipelines, AutoThrottle, robots.txt-Compliance, FeedExporters — alles eingebaute Mechanik. Eigenentwicklung in TypeScript würde Wochen kosten und nie dieselbe Robustheit erreichen.
- **Sprach-Footprint im Core bleibt eins.** Frontend-Dev arbeitet ausschließlich in TypeScript. Python lebt isoliert im Ingest-Container; Frontend-Code importiert kein Python.
- **Einziger Touch-Point ist Postgres.** Ingest-Container kennt nur die DB-Connection-String — kein HTTP-Call zwischen Python und Next.js, kein RPC, keine geteilte Schema-Library. Drizzle-Migrations definieren das Schema, Python liest es per SQL.
- **Container-Isolation begrenzt Blast-Radius.** Ingest-Crash zieht Frontend nicht runter. Ingest-Dependency-Updates berühren Frontend-Toolchain nicht.

## Konsequenzen

- **Repo-Struktur unter `v02/`:**
  - `v02/web/` — Next.js 15 App (Frontend + API-Routes + Editorial-UI unter `/admin`).
  - `v02/db/` — Drizzle-Schema-Definitionen und Migrations.
  - `v02/ingest-py/` — ab Welle W2: Python + Scrapy Spider, Adapter-Klassen, Item-Pipelines. Eigenes `requirements.txt` und Dockerfile.
- **Tech-Choices fixiert:**
  - Next.js 15 (App-Router)
  - Drizzle-ORM (Postgres-Adapter)
  - Auth.js v5
  - Resend für transactional Mail
  - Python 3.12 + Scrapy für Ingestion (ab W2)
- **Welle W1 ist Python-frei.** CMS, API, Auth, Profil — alles TypeScript.
- **Welle W2 bringt Python in den Stack.** Vorher gibt es keinen Python-Code im Repo.
- **Build- und Deploy-Pipelines werden getrennt.** `v02/web/` und `v02/ingest-py/` haben eigene Build-Targets, eigene Container, eigene Health-Checks.
- **Memory-Pin „TS-only" wird kontextualisiert.** Der Pin gilt weiterhin für den Core (Frontend + API + Editorial). Python ist die explizit dokumentierte, isolierte Ausnahme für News-Crawling — kein generischer Sprach-Wildwuchs.

### Pfad-übergreifende Nicht-Konsequenzen

- TypeScript bleibt die Sprache für Code-Reviews und Architektur-Diskussionen.
- Kein Python-Code im Frontend, in API-Routes oder im Editorial-UI.
- Kein TypeScript-Code im Ingest-Container außer optionale Schema-Stubs.

## Open Decisions

- Wie Python-Code die Drizzle-Schemas konsumiert (manuelle SQLAlchemy-Modelle vs. generierte Stubs) — wird in W2-Planning entschieden.
- Ob Scrapy-Items über eine ItemPipeline direkt in Postgres geschrieben werden oder über eine `editorial_drafts`-Staging-Tabelle gehen — Referenz-Architektur siehe ADR-038.

## Status

`accepted` seit 2026-05-22. TS-Stack in W1, Python-Add in W2.

## Status-History

| Datum | Von | Nach | Auslöser |
|---|---|---|---|
| 2026-05-22 | — | accepted | Stack-Entscheidung im Rahmen Backend-Pivot W0 |
