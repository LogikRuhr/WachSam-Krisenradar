# Quality Gates

## Vor jedem Commit

```bash
git status --short
git diff --check
bash scripts/verify.sh
```

## Vor jedem Push

- Arbeitsbaum verstanden.
- Keine fremden oder unfreigegebenen Aenderungen gestaged.
- Keine Secrets oder PII.
- Commit-Subject ist englisch und imperativ.
- Lokaler Verify ist gruen.

## Vor Deploy

- `verify` Workflow auf `main` ist gruen.
- Zielumgebung und Zielpfad sind explizit.
- Rollback-Pfad ist bekannt.
- Keine produktive `.env` wird kopiert, solange keine Runtime-Spec das verlangt.
- Post-Deploy-Smoke ist definiert.

## Konsistenz

- `main` ist die kanonische Quelle.
- Bash/YAML/Markdown nutzen LF via `.gitattributes`.
- `scripts/verify.sh` bleibt executable.
- PowerShell- und Bash-Verify pruefen dieselben Basiseigenschaften.

