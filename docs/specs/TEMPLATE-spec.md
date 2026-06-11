# Spec: <Feature-Name>

## Ziel (in einem Satz)
<was am Ende funktionieren soll>

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: ... → A: ...

## Umfang / Nicht-Umfang
- In Scope: ...
- Out of Scope: ...

## Definition of Done
- [ ] Tests grün — TS: `cd v02 && pnpm run verify` · Python: `cd v02/intelligence && python -m pytest tests/ -q`
- [ ] Lint/Typecheck ok — in `pnpm run verify` enthalten (`eslint --max-warnings 0` + `tsc --noEmit`); Python: kein separater Linter konfiguriert
- [ ] PASS durch zweiten DoD-Reviewer — lokal `.claude/agents/reviewer.md`; `/code-review` nur ergänzend für Diff-Bugs/Cleanups

## Schritte
1. ...
