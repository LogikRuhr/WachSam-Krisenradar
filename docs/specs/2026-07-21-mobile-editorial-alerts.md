# Spec: Mobile Gesamtstand und Redaktionsalarm

## Ziel (in einem Satz)
Ein eingetragener Operator erhält bei fälligem Gesamtstand eine begrenzte E-Mail-Erinnerung und kann den quellengebundenen Entwurf auf dem Smartphone ohne JSON-Eingaben prüfen, anlegen und bewusst veröffentlichen.

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: Darf eine Benachrichtigung an die vorhandenen Operator-Adressen versendet werden? → A: Ja, Freigabe für den Scope am 21. Juli 2026.

## Relevante Lessons (Pflicht: LESSONS.md konsultieren)
- keine einschlägig: Die bestehenden Lessons betreffen keine mobile Gesamtstand-Freigabe oder den Versand redaktioneller Erinnerungen.

## Umfang / Nicht-Umfang
- In Scope: tägliche, deduplizierte Erinnerung an `ADMIN_EMAILS`, wenn eine frische Quelle neuer als der veröffentlichte Gesamtstand ist oder kein Gesamtstand veröffentlicht ist; mobile Gesamtstand-Priorisierung; Quellenfelder ohne JSON; sichtbare Quellen in der Review.
- Out of Scope: automatische Formulierung, automatische Freigabe oder automatische Veröffentlichung; Push-Benachrichtigungen; Änderungen an Bürgerdaten oder an bereits veröffentlichten Inhalten.

## Definition of Done
- [ ] Die Ingestion reserviert den Versand atomar und versendet höchstens eine Erinnerung je Kalendertag bei fehlendem oder fälligem Gesamtstand; Versandspuren enthalten keine E-Mail-Adresse.
- [ ] `/review` zeigt Gesamtstand vor allen weiteren Entwürfen, seine Quellen direkt und einen sicheren manuellen Publish-Schritt.
- [ ] Neue oder geänderte Gesamtstände erfassen Quellen als mobile Felder; der bestehende Primärquellen-Gate bleibt serverseitig wirksam.
- [ ] Tests grün — TS: `cd v02 && pnpm run verify` · Python: `cd v02/intelligence && python -m pytest tests/ -q`
- [ ] Lint/Typecheck ok — in `pnpm run verify` enthalten (`eslint --max-warnings 0` + `tsc --noEmit`); Python: kein separater Linter konfiguriert.
- [ ] Migration, Seed-Dry-Run und Browser-Smoke sind geprüft.
- [ ] PASS durch zweiten DoD-Reviewer — lokal `.claude/agents/reviewer.md`.

## Schritte
1. Deduplizierte Versandspur und Ingestion-Hook ergänzen.
2. Gesamtstand in der Review und im Editor mobil priorisieren.
3. Tests, Build, Review, Deployment und Live-Smoke durchführen.

## Rollback
- Alert-Logik mit dem Release zurückrollen; die additive Versandspur kann ohne Datenverlust bestehen bleiben.
- Einen fehlerhaften Gesamtstand über den vorhandenen Unpublish-Pfad wieder auf Draft setzen.
