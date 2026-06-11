# Lessons Learned

> Read first, update last. Jeder Eintrag: Datum · Erkenntnis · konkrete Handlung · Confidence (low/med/high).
> Verhältnis zu anderen Systemen: `.remember/` = automatischer Session-Buffer (nicht kuratiert);
> diese Datei = kuratierte, repo-getrackte Lessons, die mit dem Repo reisen und von Claude Code **und** Codex gelesen werden.

## Was funktioniert
- 2026-06-10 · Qualitäts-/Lern-System „Simply First" vorbereitet und additiv in AGENTS.md verankert; CLAUDE.md verweist auf AGENTS.md, docs/specs/TEMPLATE-spec.md definiert DoD, lokaler `.claude/agents/reviewer.md` bleibt gitignored und liefert PASS/FAIL-Review. · Handlung: bestehende Systeme (`.remember/`, `/code-review`, `wachsam-editorial-reviewer`) nicht duplizieren; echte Lessons nur aus Tests, Linter, Builds, Reviews oder User-Feedback eintragen. · Confidence: high
- 2026-06-11 · Codex und Hermes arbeiten am selben Working Tree; Codex hat Dateien gestaged/committet, während Hermes parallel lief → Risiko, dass ein Agent dem anderen ungeprüfte Dateien in den Index legt oder ein Commit zwei getrennte Arbeiten vermischt. Handlung: Vor jedem Commit git status (unfiltered) + git show --stat HEAD prüfen, nie git add . / -A, nur gezielt benannte Dateien stagen, ein Commit = eine Arbeit. Confidence: high

## Was fehlgeschlagen ist (und warum)
- <noch leer>

## Muster & Präferenzen des Nutzers
- Antworten auf Deutsch.
- „Simply First": einfache, robuste Lösung vor komplexem Framework.
- Keine erfundenen Dinge; bei Unsicherheit sagen.
