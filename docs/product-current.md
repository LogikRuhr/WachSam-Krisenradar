# WachSam — aktuelle Produktwahrheit

Stand: 2026-06-23

## Aktiver Code

Aktiver Produktcode ist `v02/`:

- `v02/web/` für die Next.js-App
- `v02/db/` für Schema, Migrations und Seed-Daten
- `v02/intelligence/` für Datenadapter, Source Health und Evidence-first Intelligence
- `v02/infra/` für Runtime-/Deploy-Artefakte

`v01` ist keine aktuelle Arbeitsbasis. Alte v0.1/v0.2-/Cutover-Texte sind historischer Kontext und dürfen keine neue Arbeit steuern.

## Produktziel

WachSam soll ein persönlicher Haushalts-Krisencheck für Deutschland werden.

Die zentrale Nutzerfrage lautet:

> Was betrifft meinen Haushalt, was kostet es ungefähr pro Monat, und was kann ich konkret tun?

## Aktuelle Priorität

Priorität hat nicht weitere Text-/Karten-Politur, sondern ein nutzbarer Haushalts-Check:

1. Haushaltsdaten erfassen, zuerst anonym und kurz.
2. Kostenrisiken in Euro-Spannen zeigen.
3. Sparhebel mit grobem Potenzial zeigen.
4. Klar markieren, was den Nutzer wahrscheinlich nicht betrifft.
5. Quellen, Unsicherheit und Datenstand sichtbar halten.

## Produktform

WachSam ist:

- Haushalts-Krisencheck
- Kosten- und Versorgungsradar
- ruhige Einordnung mit Quellenstand
- Werkzeug für konkrete Alltagsentscheidungen

WachSam priorisiert Haushaltsnutzen vor Nachrichtenstrom, Analystenansicht oder reiner Lagekarte.

## Arbeitsregel für Agenten

Wenn Doku widerspricht, gilt diese Reihenfolge:

1. `docs/product-current.md`
2. `.remember/next-session-brief.md`
3. `AGENTS.md`
4. aktuelle `v02/`-Code- und DB-Struktur
5. ältere Produkt-/ADR-/Output-Dateien nur als historische Belege
