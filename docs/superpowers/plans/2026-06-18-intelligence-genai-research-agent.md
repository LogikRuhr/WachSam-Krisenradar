# Intelligence GenAI Research Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the WachSam RSS/LLM draft path to `google-genai` with configurable models and add a strict, feature-flagged Research-Agent draft gate.

**Architecture:** Keep deterministic adapters untouched. Replace the Vertex legacy SDK inside the unstructured extraction boundary, then route RSS evidence either to the existing extractor or to a constrained Research-Agent facade that can only return draft candidates or rejection reasons.

**Tech Stack:** Python 3, `google-genai`, Pydantic models, pytest/pytest-asyncio, Next.js verify gates for public published-only invariants.

---

### Task 1: Planning Artifacts

**Files:**
- Create: `docs/specs/2026-06-18-intelligence-genai-research-agent.md`
- Create: `docs/superpowers/plans/2026-06-18-intelligence-genai-research-agent.md`

- [x] **Step 1: Write spec and implementation plan**

Record scope, non-scope, acceptance, security, verify and rollback.

- [ ] **Step 2: Verify planning files**

Run: `git diff -- docs/specs/2026-06-18-intelligence-genai-research-agent.md docs/superpowers/plans/2026-06-18-intelligence-genai-research-agent.md`

Expected: both files are documentation-only and contain no secrets.

### Task 2: GenAI SDK Migration

**Files:**
- Modify: `v02/intelligence/requirements.txt`
- Modify: `v02/intelligence/src/config.py`
- Modify: `v02/intelligence/src/extractors/llm_extractor.py`
- Modify: `v02/intelligence/src/extractors/prompts.py`
- Test: `v02/intelligence/tests/test_llm_extractor.py`

- [ ] **Step 1: Write failing tests for `google-genai` usage**

Update tests to patch `google.genai.Client` and assert:
- client is created with `vertexai=True`
- model is read from `settings.GEMINI_MODEL_ID`
- JSON config sets `response_mime_type="application/json"`
- API errors with code 429 preserve quota circuit-breaker behavior

- [ ] **Step 2: Run targeted tests to verify RED**

Run: `cd v02/intelligence && python -m pytest tests/test_llm_extractor.py -q`

Expected: failures caused by missing `google-genai` implementation.

- [ ] **Step 3: Implement minimal SDK wrapper**

Use:

```python
from google import genai
from google.genai import errors, types
```

Create `genai.Client(vertexai=True, project=settings.GOOGLE_CLOUD_PROJECT, location=settings.VERTEX_AI_LOCATION)` and call `client.models.generate_content(...)`.

- [ ] **Step 4: Run targeted tests to verify GREEN**

Run: `cd v02/intelligence && python -m pytest tests/test_llm_extractor.py -q`

Expected: PASS.

### Task 3: Research-Agent Draft Gate

**Files:**
- Create: `v02/intelligence/src/research_agent/__init__.py`
- Create: `v02/intelligence/src/research_agent/tools.py`
- Create: `v02/intelligence/src/research_agent/agent.py`
- Modify: `v02/intelligence/src/config.py`
- Modify: `v02/intelligence/src/main.py`
- Modify: `v02/intelligence/src/extractors/prompts.py`
- Test: `v02/intelligence/tests/test_research_agent.py`
- Test: `v02/intelligence/tests/test_main.py`

- [ ] **Step 1: Write failing tests for evidence quality**

Tests must show:
- navigation/low-information evidence returns rejection and no `IngestionItem`
- sufficient evidence returns an `IngestionItem` with `status="extracted"`
- agent result ignores any incoming `published` status

- [ ] **Step 2: Run targeted tests to verify RED**

Run: `cd v02/intelligence && python -m pytest tests/test_research_agent.py tests/test_main.py::test_rss_items_use_article_evidence_before_llm -q`

Expected: failures caused by missing research-agent module and feature flag.

- [ ] **Step 3: Implement minimal Research-Agent facade**

Add deterministic quality checks first; call existing LLM extractor only when evidence is usable. Keep this as a local facade with ADK-compatible `root_agent` definition for later Agent Engine deployment.

- [ ] **Step 4: Wire feature flag in `main.py`**

When `settings.WACHSAM_RESEARCH_AGENT_ENABLED` is true, call `extract_with_research_agent`; otherwise call `extract_with_llm`.

- [ ] **Step 5: Run targeted tests to verify GREEN**

Run: `cd v02/intelligence && python -m pytest tests/test_research_agent.py tests/test_main.py -q`

Expected: PASS.

### Task 4: Full Verification

**Files:**
- All changed files.

- [ ] **Step 1: Python suite**

Run: `cd v02/intelligence && python -m pytest tests/ -q`

Expected: PASS.

- [ ] **Step 2: Root and v02 verify**

Run:

```bash
bash scripts/verify.sh
cd v02 && pnpm run verify
```

Expected: PASS.

- [ ] **Step 3: Static invariants**

Run:

```bash
rg "vertexai\\.generative_models|gemini-2\\.5-flash" v02/intelligence
rg "published" v02/intelligence/src/research_agent v02/intelligence/src/extractors
```

Expected: no legacy SDK import; hardcoded old model removed; no agent publish path.

- [ ] **Step 4: Git diff review**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only approved files changed; no whitespace errors.
