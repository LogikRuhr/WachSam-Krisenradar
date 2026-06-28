# Spec: Onboarding Activation Loop

## Ziel
Der Public-Haushaltscheck fuehrt nach einer Nutzer-Eingabe zu einem ersten echten WachSam-Wert: Einordnung, Wirkung und vorhandener Massnahmen-Pruefschritt.

## Nicht-Ziele
- Keine neue Datenbanktabelle.
- Kein Drittanbieter-Tracking oder Product-Tour-SDK.
- Keine neuen Quellen, keine erfundenen Massnahmen, keine Euro-Prognose.

## Definition of Done
- [ ] Nach Haushalts-Eingabe erreicht die Checklist `2/3 bereit`; die aktive Handlung bleibt der Pruefschritt.
- [ ] Wenn eine echte vorhandene Massnahme zur sortierten Signalkette existiert, zeigt das Ergebnis Titel, Beschreibung, Aufwand und Link zu `/massnahmen`.
- [ ] Wenn Daten fehlen oder keine Massnahme existiert, erscheint kein Fake-Massnahmen-CTA.
- [ ] Public UI bleibt mobil ohne horizontalen Overflow; erster Input bleibt im ersten Viewport.
- [ ] Keine Speicherung anonymer Eingaben, keine PII, keine Secrets.

## Verify
- `cd v02 && corepack pnpm exec tsx web/lib/household-check.test.ts`
- `cd v02 && corepack pnpm exec tsx web/lib/onboarding.test.ts`
- `cd v02 && corepack pnpm run verify`
- `bash scripts/verify.sh`
- `cd v02/intelligence && python -m pytest tests/ -q`
- Browser-Smoke Desktop/Mobile.

## Rollback
Ein Commit revertbar; keine Migration und keine Runtime-Konfigurationsaenderung.
