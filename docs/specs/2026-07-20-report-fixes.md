# Spec: Report fixes for freshness, national state and source trust

## Ziel (in einem Satz)
Die öffentliche Datenstatusanzeige bewertet Quellen nach ihrer tatsächlichen Kadenz, und ein neuer Gesamtstand kann nur mit nachvollziehbaren, ausdrücklich markierten Primärquellen redaktionell veröffentlicht werden.

## Clarifications
- F: Welchen Scope decken die Reports ab? → A: Alle operativen Befunde.
- F: Wie wird der alte Lagebild-Stand behandelt? → A: Sichtbar und klar datiert, ohne ihn als aktuellen Gesamtstand auszugeben.

## Relevante Lessons
- 2026-07-19 · Green technical checks beweisen keine aktuelle öffentliche Datenlage; Status, Quellenstand und Gesamtstand separat prüfen.
- 2026-07-20 · Ein publizierter Inhalt ist kein Ersatz für den unabhängigen Fakten- und Editorial-Review.

## Umfang / Nicht-Umfang
- In Scope: Arbeitslosigkeit-Retry, Freshness-Kadenz, Quellenpflicht für Gesamtstände, öffentliche Kennzeichnung und Trust-Wording.
- Out of Scope: automatische Veröffentlichung, Produktions-DB-Write, Neuredaktion aller Lagebild-Signale.

## Definition of Done
- [ ] Python-Tests decken Retry und alle drei Freshness-Regeln ab.
- [ ] `cd v02 && pnpm run verify` sowie `cd v02/intelligence && python -m pytest tests/ -q` sind grün.
- [ ] Migration, Admin-Formular und öffentliche Quellenanzeige sind im Browser geprüft.
- [ ] Ein unabhängiger DoD-Reviewer bestätigt Scope, Quellenpflicht und DSGVO-Schutz.

## Rollback
- Neuen Gesamtstand ausschließlich über den bestehenden Unpublish-Pfad wieder auf Draft setzen.
- Code-Rollback auf den vorherigen Deployment-Commit; keine Daten löschen.
