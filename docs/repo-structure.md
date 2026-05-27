# Repo Structure

## Top-Level

| Pfad | Zweck | Tracking |
|---|---|---|
| `.github/` | GitHub Templates und CI | getrackt |
| `docs/` | Regeln, Entscheidungen, Betriebsdoku | getrackt |
| `docs/adr/` | Architecture Decision Records | getrackt |
| `specs/` | freigegebene Feature- oder Aufgabenvertraege | getrackt |
| `templates/` | wiederverwendbare Vorlagen | getrackt |
| `scripts/` | lokale Verify- und Hygiene-Scripts | getrackt |
| `outputs/` | Markdown-Reports und explizite Ergebnisartefakte | nur `.md` und `.gitkeep` |

## Nicht getrackt

- Secrets und lokale Env-Dateien
- Dependency-Ordner
- Build-Ausgaben
- lokale Agent-/Tool-Caches
- Rohdaten, Datenbanken, CSV/JSON-Exports
- HTML-Mockups unter `outputs/`

## Neue Bereiche

Neue Runtime-Pfade wie `src/`, `app/`, `db/`, `infra/` oder `packages/` brauchen vorher eine akzeptierte Spec.

