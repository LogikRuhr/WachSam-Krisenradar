# Spec: Cockpit-Ergebnis verdichten

## Ziel (in einem Satz)
Der anonyme Haushalts-Check zeigt nach der Eingabe zuerst eine kompakte, handlungsnahe Einordnung statt mehrere gleichgewichtige Textblöcke.

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: Darf die Welle direkt umgesetzt und mit Sub-Agents geprüft werden? -> A: Ja, Freigabe erteilt; passende Sub-Agents nutzen.

## Umfang / Nicht-Umfang
- In Scope: Ergebnis-Summary im Haushalts-Cockpit, kompakte Detailableitung, Mobile-Layout, Unit-/Smoke-Tests.
- Out of Scope: neue Quellen, neue EUR-Beträge, neue Datenbankfelder, regionalisierte PLZ-Logik, Deploy-Änderungen.

## Definition of Done
- [ ] Summary zeigt Primärlage, erste echte Haushaltswirkung, nächsten Prüfschritt und Boundary sichtbar vor Detailgruppen.
- [ ] Weitere Treffer, weitere Kosten-/Versorgungswirkungen und indirekte Bereiche liegen hinter Progressive Disclosure.
- [ ] Empty/disconnected States bleiben ehrlich und erzeugen keine Fake-Treffer.
- [ ] Tests grün — Root: `bash scripts/verify.sh` · TS: `cd v02 && pnpm run verify` · Python: `cd v02/intelligence && python -m pytest tests/ -q`
- [ ] Browser-Smoke ohne horizontales Overflow auf Desktop/Mobile.

## Schritte
1. Ableitungsfunktion um kompakte Sekundärlisten und den Randfall später Haushaltswirkung erweitern.
2. `HouseholdCheck` auf Summary + Boundary + `details`-Struktur umbauen.
3. CSS fuer kompakte Status-/Result-Darstellung und kleine Viewports anpassen.
4. Unit- und Playwright-Smoke-Tests erweitern.
5. Security-, Verify-, Git-Check vor Commit/Push ausführen.

## Rollback
Ein Commit revertbar; keine DB-, Secret- oder Infrastrukturänderung in dieser Welle.
