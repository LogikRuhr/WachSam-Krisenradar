# Preisradar Startseite

## Ziel

WachSam zeigt auf der Startseite einen schnellen Preisradar für Haushalte:
typische Tankstellen-Sorten, Strom und Gas mit Wert, Quelle, Stand und Status.

## Scope

- Sprit: Super E5, Super E10, Diesel aus Tankerkönig/MTS-K.
- Strom: BDEW-Haushaltsstrompreis als redaktioneller Monatsstand.
- Gas: BDEW-Haushaltsgaspreis für Einfamilienhaus als redaktioneller Monatsstand.
- UI: kompakte Karten unter dem Haushaltskontext.

## Nicht-Ziele

- Keine Premiumsorten ohne Tankerkönig-Standardfeld.
- Kein individueller Tarifvergleich.
- Kein externer API-Call im Web-Renderpfad.
- Keine erfundenen Werte oder Schwellen.

## Akzeptanz

- `/` zeigt `Super E5`, `Super E10`, `Diesel`, `Strom Haushalte`, `Gas Haushalte`.
- Spritkarten markieren die 16-PLZ-Stichprobe und Source-Health.
- BDEW-Karten markieren den redaktionellen Monatsstand.
- Fehlende Livewerte zeigen `Stand ausstehend`.
- Mobile Darstellung erzeugt keinen horizontalen Overflow.

## Verify

- `bash scripts/verify.sh`
- `cd v02 && corepack pnpm run verify`
- `cd v02 && corepack pnpm run smoke:ui`
- `cd v02/intelligence && python -m pytest tests/ -q`

## Rollback

Ein Commit, rücknehmbar per `git revert <commit>`. Keine Migration, keine Secrets.
