# AGENTS.md

## Sprache & Stil

- Antworten auf Deutsch.
- Code-Identifier, Tools und Commit-Subjects auf Englisch.
- Sachlich, kurz, ohne Filler.

## Arbeitsweise

1. Plan vor Code: vor jedem Edit File-Scope mit ADD/CHANGE/DELETE zeigen.
2. Kleine Scopes: eine Aufgabe pro Commit.
3. Keine erfundenen Daten, Quellen oder APIs.
4. Verify vor Fertig-Claim.
5. Blocker melden statt raten.
6. `git add` mit expliziten Pfaden, nie `git add .` oder `git add -A`.

## Sicherheit

- Keine Secrets in tracked Files.
- `.gitignore` zuerst pruefen, bevor neue Tooling- oder Env-Dateien entstehen.
- Keine PII in Repo, Logs, Outputs, Issues oder Chat.
- Bei Secret-Leak: Arbeit stoppen, Secret rotieren, Leak entfernen, Historie pruefen.
- Vor Commit Secret- und Hygiene-Check ausfuehren.

## Repo-Konventionen

- Doku liegt in `docs/`.
- Freigegebene Arbeitsvertraege liegen in `specs/`.
- Wiederverwendbare Vorlagen liegen in `templates/`.
- Reports liegen als Markdown in `outputs/`.
- Lokale Experimente und generierte HTML/JSON/CSV/DB-Dateien werden nicht getrackt.

