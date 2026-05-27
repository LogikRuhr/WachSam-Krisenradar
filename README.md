# WachSam-Krisenradar

Sauberes RuhrLogik-Repo fuer strukturierte Produkt-, Tool- oder App-Arbeit.
`main` ist die kanonische Quelle. GitHub Actions prueft jeden Push und Pull Request.

Der Startzustand enthaelt bewusst keinen App-Stack. Er definiert zuerst Ordnung:
klare Doku-Orte, Issue-/PR-Templates, ADRs, Specs, Verify-Scripts und
Security-Regeln. Frameworks, Datenbanken und externe Services werden erst nach
einer akzeptierten Spec ergaenzt.

## Struktur

- `docs/` - Workflow, Security, Verification, Repo-Struktur und ADRs
- `specs/` - freigegebene Aufgaben- und Feature-Vertraege
- `templates/` - wiederverwendbare Issue-, PR-, ADR- und Session-Vorlagen
- `scripts/` - lokale Verify- und Hygiene-Checks
- `outputs/` - explizite Markdown-Reports, keine PII oder Rohdaten
- `.github/` - GitHub Templates und CI

## Start

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
```

```bash
bash scripts/verify.sh
```

Vor Code gilt: Plan schreiben, File-Scope freigeben lassen, klein committen,
Verify ausfuehren, dann Review.
