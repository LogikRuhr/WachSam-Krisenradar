# Spec: WachSam Onboarding

## Ziel (in einem Satz)
Neue Nutzer sollen auf WachSam in wenigen Minuten vom ersten Haushalts-Input zur ersten Einordnung und einem ruhigen Prüfschritt kommen.

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: Soll P0 direkt umgesetzt werden? -> A: Ja, Freigabe erteilt.

## Umfang / Nicht-Umfang
- In Scope: native Onboarding-Checklist auf `/`, Profil-Onboarding auf `/profil`, reine Ableitungslogik, CSS, Unit- und Public-Smoke-Test.
- Out of Scope: Product-Tour-Library, Drittanbieter-Analytics, A/B-Test-Infrastruktur, neue Datenbanktabellen, Euro-Spannen, neue Quellen.

## Definition of Done
- [ ] `/` zeigt einen ruhigen 3-Schritte-Pfad: Haushalt einordnen, Wirkung verstehen, Prüfschritt mitnehmen.
- [ ] Nach Haushaltsauswahl wird der erste WachSam-Wert sichtbar, ohne blockierendes Modal.
- [ ] `/profil` zeigt eine Profil-Checklist auf Basis vorhandener Profilvollständigkeit.
- [ ] Keine neuen personenbezogenen Daten, keine Drittanbieter-Events, keine Fake-Daten.
- [ ] Tests grün — Root: `bash scripts/verify.sh` · TS: `cd v02 && corepack pnpm run verify` · Python: `cd v02/intelligence && python -m pytest tests/ -q`
- [ ] Browser-Smoke ohne horizontales Overflow auf Desktop/Mobile.

## Schritte
1. Onboarding-Status als reine Helper-Funktion modellieren.
2. Wiederverwendbare `OnboardingChecklist` rendern.
3. Public Haushalts-Cockpit mit Checklist verbinden.
4. Member-Profilseite mit Profil-Checklist verbinden.
5. Tests und Browser-Smoke erweitern.

## Rollback
Ein Commit revertbar; keine Migration, kein externer Dienst, keine Produktionseinstellungen.
