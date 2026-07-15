# Spec: Kraftstoffpreis-Frische und gezielter Refresh

## Ziel (in einem Satz)

WachSam kennzeichnet die 16-Orte-Kraftstoffstichprobe mit ihrem echten Abrufzeitpunkt, stuft sie nach 90 Minuten nicht mehr als aktuell ein und erlaubt einen gezielten Betreiber-Refresh ohne vollständigen Intelligence-Lauf.

## Clarifications

- F: Soll die 16-Orte-Stichprobe stündlich automatisiert werden? → A: Nein. Die freie Tankerkönig-API rät Websites von regelmäßigen Abfragen ab und kann Massenabfragen sperren; ein höherer Automatismus braucht zuerst eine geklärte Datennutzung.
- F: Was wird jetzt produktiv behoben? → A: Wahrheitsgemäße Zeit-/Frischeanzeige, gezielter Betreiber-Refresh und einmaliger Produktionsrefresh nach Deploy.

## Umfang / Nicht-Umfang

- In Scope: `--only Tankerkoenig` für einen DB-schreibenden Einzellauf ohne RSS/LLM; Abrufzeit auf Kraftstoffkarten; sichtbarer Altersstatus ab 90 Minuten; Tests, Deploy und Live-Smoke.
- Out of Scope: höhere automatische Abruffrequenz, Änderung der 16-Orte-Stichprobe, neuer Datenanbieter, Schemaänderung oder Migration.

## Definition of Done

- [ ] Ein gezielter Tankerkönig-Lauf instanziiert keinen anderen Adapter und startet keinen RSS/LLM-Pfad.
- [ ] Kraftstoffkarten verwenden `source_health.last_success_at` als sichtbaren Abrufzeitpunkt.
- [ ] Ein erfolgreicher Abruf bis einschließlich 90 Minuten bleibt „Quelle aktuell“; danach erscheint „Abruf älter als 90 Min.“ mit erhöhter Kennzeichnung.
- [ ] Fehler- und Stale-Status aus `source_health` haben Vorrang vor der Altersberechnung.
- [ ] `bash scripts/verify.sh`, `cd v02 && pnpm run verify` und `cd v02/intelligence && python -m pytest tests/ -q` sind grün.
- [ ] Read-only DoD-Review ist PASS.
- [ ] Produktion zeigt den neuen Abrufzeitpunkt und die nach Deploy aktualisierten Kraftstoffwerte.

## Verify und Rollback

- Verify: fokussierte Red/Green-Tests, vollständige Root-/TS-/Python-Gates, öffentlicher HTTP-/Browser-Smoke, Containerstatus, DB-Sanity.
- Rollback: vorheriger Git-SHA und vor dem Deploy gesicherte Produktionsquellen; Web und Intelligence auf den vorherigen Build zurücksetzen. Keine Migration ist beteiligt.
