# Verification

## Minimal-Verify

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify.ps1
```

Linux/WSL:

```bash
bash scripts/verify.sh
```

## Gates

Der Minimal-Verify prueft:

- Git-Repository vorhanden
- Markdown-Dateien vorhanden
- keine typischen Secret-Patterns in getrackten Textdateien
- keine unerwuenschten generierten Output-Dateien
- `git diff --check`

## Fertig-Kriterium

Eine Aufgabe ist erst fertig, wenn:

- Acceptance Criteria erfuellt sind
- relevante Verify-Kommandos PASS sind
- Security-Check keine Secrets findet
- `git status --short` verstanden ist

