# Fuel Price Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the fuel sample operationally refreshable without a full ingestion run and truthful about its exact retrieval age.

**Architecture:** Reuse the existing ingestion pipeline with an optional adapter-name filter and suppress RSS/LLM work for targeted runs. Pass the existing `source_health.last_success_at` into price cards and derive a deterministic 90-minute display status at render-data construction time.

**Tech Stack:** Python 3, pytest, Next.js 15, TypeScript 5.9, Node assert tests, Docker Compose.

## Global Constraints

- No database migration or secret change.
- No increased automatic Tankerkoenig polling without a separate data-use decision.
- Tests must fail for the missing behavior before production code changes.
- Deploy only from a verified intentional state with known rollback.

---

### Task 1: Targeted Tankerkoenig ingestion

**Files:**
- Modify: `v02/intelligence/tests/test_main.py`
- Modify: `v02/intelligence/src/main.py`

**Interfaces:**
- Produces: `run_ingestion(..., adapter_names: set[str] | None = None)` and CLI `--only Tankerkoenig`.

- [ ] Add a test that calls targeted ingestion and asserts only `TankerkoenigAdapter` is instantiated while `RSSCrawler` is untouched.
- [ ] Add a CLI test that sets `INGESTION_MODE=scheduled`, passes `--only Tankerkoenig`, and asserts a one-shot ingestion call rather than scheduler startup.
- [ ] Run `python -m pytest tests/test_main.py -q` and confirm the new assertions fail for missing filtering/CLI behavior.
- [ ] Extract the existing adapter construction into `build_adapters()`, filter by adapter name in `run_ingestion`, and skip the RSS block for targeted runs.
- [ ] Parse `--only` with the exact adapter names and run the filtered ingestion before evaluating `INGESTION_MODE`.
- [ ] Re-run `python -m pytest tests/test_main.py -q` and confirm PASS.

### Task 2: Retrieval timestamp and 90-minute truth label

**Files:**
- Modify: `v02/web/lib/price-radar.test.ts`
- Modify: `v02/web/lib/price-radar.ts`
- Modify: `v02/web/components/PriceRadar.tsx`

**Interfaces:**
- Produces: `PriceRadarCard.retrievedAt: Date | null` and optional deterministic `now` input to `buildPriceRadar`.

- [ ] Add test fixtures with a successful Tankerkoenig retrieval at `2026-07-15T06:00:00Z`.
- [ ] Assert a card built at `07:30:00Z` remains current and carries the retrieval timestamp; assert a card built one millisecond later shows `Abruf älter als 90 Min.` with elevated tone.
- [ ] Run `pnpm exec tsx web/lib/price-radar.test.ts` and confirm failure because retrieval time and age handling are absent.
- [ ] Add `retrievedAt` to fuel cards, preserve explicit DB error/stale precedence, and apply the 90-minute label only to successful live samples.
- [ ] Format live-sample source lines as `Abruf <date>, <time> Uhr`; retain date-only formatting for editorial values.
- [ ] Re-run the focused test and confirm PASS.

### Task 3: Verification, review and production rollout

**Files:**
- Modify at session close: `.remember/codex-session.md`

**Interfaces:**
- Consumes: verified source diff and targeted CLI.
- Produces: deployed containers, refreshed production rows, current handoff.

- [ ] Run `bash scripts/verify.sh`.
- [ ] Run `pnpm run verify` from `v02`.
- [ ] Run `python -m pytest tests/ -q` from `v02/intelligence`.
- [ ] Run secret/diff checks and the read-only DoD reviewer against the spec.
- [ ] Show explicit staged paths/status/stat and obtain the required commit gate.
- [ ] Commit and push the approved diff, back up live source/config, deploy web and intelligence, then run `python -m src.main --only Tankerkoenig` in production.
- [ ] Verify container health, public price values, retrieval timestamp, auth route behavior and DB connectivity.
- [ ] Update `.remember/codex-session.md` with verified state, rollback and remaining API/data-source work.
