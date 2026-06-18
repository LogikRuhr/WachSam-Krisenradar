# Lessons Learned

> Read first, update last. Jeder Eintrag: Datum · Erkenntnis · konkrete Handlung · Confidence (low/med/high).
> Verhältnis zu anderen Systemen: `.remember/` = automatischer Session-Buffer (nicht kuratiert);
> diese Datei = kuratierte, repo-getrackte Lessons, die mit dem Repo reisen und von Claude Code **und** Codex gelesen werden.

## Was funktioniert
- 2026-06-10 · Qualitäts-/Lern-System „Simply First" vorbereitet und additiv in AGENTS.md verankert; CLAUDE.md verweist auf AGENTS.md, docs/specs/TEMPLATE-spec.md definiert DoD, lokaler `.claude/agents/reviewer.md` bleibt gitignored und liefert PASS/FAIL-Review. · Handlung: bestehende Systeme (`.remember/`, `/code-review`, `wachsam-editorial-reviewer`) nicht duplizieren; echte Lessons nur aus Tests, Linter, Builds, Reviews oder User-Feedback eintragen. · Confidence: high
- 2026-06-11 · Codex und Hermes arbeiten am selben Working Tree; Codex hat Dateien gestaged/committet, während Hermes parallel lief → Risiko, dass ein Agent dem anderen ungeprüfte Dateien in den Index legt oder ein Commit zwei getrennte Arbeiten vermischt. Handlung: Vor jedem Commit git status (unfiltered) + git show --stat HEAD prüfen, nie git add . / -A, nur gezielt benannte Dateien stagen, ein Commit = eine Arbeit. Confidence: high
- 2026-06-18 · Bei einem öffentlichen POST-Endpoint mit IP-Rate-Limit ist der LINKESTE `x-forwarded-for`-Eintrag vom Client frei setzbar → trivial umgehbar mit rotierenden Fake-IPs. · Handlung: vom eigenen Reverse-Proxy gesetzten `x-real-ip` bzw. den RECHTESTEN xff-Eintrag als Limiter-Key nehmen; Honeypot als zweite, unabhängige Spam-Hürde. Confidence: high
- 2026-06-19 · Hinter einem Reverse-Proxy (Traefik) trägt `request.url` den INTERNEN Host (z. B. web:3000), nicht den öffentlichen → ein Same-Origin-Check `origin.host === new URL(request.url).host` blockt legitime Browser-POSTs mit 403; lokal unsichtbar, erst auf Prod sichtbar. · Handlung: erwarteten Host aus `x-forwarded-host` (bzw. `host`) ableiten, `request.url` nur als Fallback; Vergleichslogik in reine, getestete Funktion auslagern. Confidence: high

## Was fehlgeschlagen ist (und warum)
- <noch leer>

## Muster & Präferenzen des Nutzers
- Antworten auf Deutsch.
- „Simply First": einfache, robuste Lösung vor komplexem Framework.
- Keine erfundenen Dinge; bei Unsicherheit sagen.
