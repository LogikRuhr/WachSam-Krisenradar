# Workflow

## Standardablauf

1. Kontext lesen: `README.md`, `AGENTS.md`, relevante `docs/` und `specs/`.
2. Plan erstellen: Ziel, Non-Goals, Acceptance Criteria, File-Scope, Verify, Rollback.
3. Freigabe abwarten.
4. In kleinen Schritten editieren.
5. Verify lokal ausfuehren.
6. Explizite Pfade stagen.
7. Commit mit englischem Imperativ-Subject erstellen.

## Branches

- `main` bleibt stabil.
- Feature-Branches nutzen klare Prefixe: `feat-`, `fix-`, `docs-`, `chore-`, `ci-`, `test-`.
- Kein Force-Push ohne explizite Freigabe.

## Commits

Gute Subjects:

- `docs: add project workflow`
- `ci: add verify workflow`
- `fix: tighten secret scan`

Vor Commit:

```bash
git status --short
git diff --check
bash scripts/verify.sh
```

## Reviews

Reviews priorisieren Bugs, Security, fehlende Tests, gebrochene Workflows und unklare Ownership.

