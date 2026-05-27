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

## Deploy-Verify

Vor Deploy:

```bash
bash scripts/verify.sh
```

Nach Deploy:

```bash
ssh -i ~/.ssh/wachsam_deploy root@85.215.213.110 'cd /opt/wachsam/source && git rev-parse --short HEAD && bash scripts/verify.sh'
```

Der Source-Deploy darf keine produktiven Container neu starten.
