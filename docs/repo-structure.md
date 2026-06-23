# Repo Structure

WachSam hat eine aktive Arbeitsbasis: `v02/`. Historische v0.1/v0.2-/Cutover-Texte sind Kontext, aber keine aktuelle Runtime- oder Arbeitsanweisung.

## Aktive Top-Level-Bereiche

| Pfad | Zweck | Tracking-Regel |
|---|---|---|
| `v02/` | aktiver Produktcode | aktiv getrackt |
| `v02/web/` | Next.js 15 App Router, Public UI, Auth, Admin/UI | aktiv getrackt |
| `v02/db/` | Drizzle-Schema, Migrations und Seed-Daten | aktiv getrackt |
| `v02/intelligence/` | Python-Adapter, Source Health, Evidence-first Intelligence | aktiv getrackt |
| `v02/infra/` | Docker-/Runtime-Artefakte für WachSam | aktiv getrackt |
| `docs/` | Produkt-, Methodik-, Brand-, UI-, Workflow- und ADR-Doku | aktiv getrackt |
| `docs/specs/` | aktuelle Feature-/Implementierungs-Specs | aktiv getrackt |
| `outputs/` | Markdown-Reports, Audits und Plan-Artefakte | aktiv getrackt, historische Momentaufnahme |
| `scripts/` | Verify-, Smoke- und Hilfsskripte | aktiv getrackt |
| `.github/` | CI und GitHub-Workflows | aktiv getrackt |
| `templates/` | wiederverwendbare Vorlagen | aktiv getrackt |

## Historische oder lokale Bereiche

| Pfad | Bedeutung |
|---|---|
| `v01/` | keine aktuelle Arbeitsbasis; falls in alten Docs erwähnt, historisch lesen |
| `.remember/` | lokaler Session-/Handoff-Kontext; nicht als Produktcode behandeln |
| `.superpowers/` | lokale Experimente/Mockups; nicht als aktuelle Produktweisung behandeln |
| `.playwright-mcp/` | lokale Browser-/Tool-Artefakte; nicht als Produktquelle behandeln |
| `.claude/`, `.codex/`, `.agents/` | lokale Agenten-/Skill-Artefakte, oft gitignored |

## Verbotene Runtime-Rückkehr

Diese Pfade dürfen nicht als neue aktive Runtime wiederbelebt werden:

- Root-`src/`
- Root-`tests/`
- Root-Next.js-/Drizzle-/Auth-/Cron-Strukturen außerhalb von `v02/`
- `v01/` als neuer Feature-Ort

Neue Produktarbeit findet in `v02/` statt. Neue Doku, Specs und Reports liegen in `docs/`, `docs/specs/` oder `outputs/`.

## Aktuelle Produktwahrheit

Bei widersprüchlicher Doku gilt:

1. `docs/product-current.md`
2. `.remember/next-session-brief.md`
3. `AGENTS.md`
4. aktuelle `v02/`-Struktur
5. ältere ADRs, Outputs und v0.1/v0.2-Texte nur historisch

## Repo-Gesundheitscheck

Vor Cleanup- oder Struktur-Wellen:

```bash
git status --short --branch --untracked-files=all
git ls-files -o --exclude-standard
git ls-files -m
```

Vor Abschluss:

```bash
git diff --check
bash scripts/verify.sh
```
