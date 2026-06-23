# Spec: Welle 2 — Positive Haushaltscheck-Sprache

## Ziel (in einem Satz)
Aktuelle WachSam-Doku führt mit dem positiven Haushaltscheck-Nutzen statt mit prominenten Negativlisten oder Dashboard-Abgrenzung.

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: Soll jede Welle immer mit Spec und Plan starten? → A: Ja, alle Wellen implementieren immer mit Spec und Plan.
- F: Soll Welle 2 direkt nach dem Push der Repo-Wahrheit Welle 1 starten? → A: Ja, freigegeben.

## Umfang / Nicht-Umfang
- In Scope: `docs/product.md`, `docs/brand.md`, `docs/ui-standard.md` als operationalisierte aktuelle Repo-Doku sprachlich auf Haushaltscheck-Nutzen ausrichten.
- In Scope: prominente `Nicht:`-/`NICHT`-Frames zu kompakten Guardrails verschieben, wenn sie aktuelle Einstiegstexte dominieren.
- In Scope: `v02` als aktuelle Arbeitsbasis und `docs/product-current.md` als höchste Produktwahrheit respektieren.
- Out of Scope: Änderungen an App-Code, Datenmodellen, DB, Deploy, historischen Output-Audits oder Source-of-Truth-Dateien `docs/# WachSam*.md`.
- Out of Scope: neue Produktversprechen wie Live-/Realtime-Status, persönliche Euro-Berechnung oder automatische Schwellenwert-Engine, solange sie nicht gebaut sind.

## Definition of Done
- [ ] `docs/product.md` beginnt fachlich mit Haushaltscheck-Nutzen, Nutzerfrage und Wirkungspfad; Dashboard-Abgrenzung ist nur Guardrail/Historienkontext.
- [ ] `docs/brand.md` beschreibt zuerst, wie WachSam wirken soll; Negativbeispiele sind als kompakte Guardrails eingeordnet.
- [ ] `docs/ui-standard.md` priorisiert Einstieg, Nutzenpfad, mobile Lesbarkeit und Haushaltswirkung; bestehende Trust-/No-Fake-Live-Regeln bleiben erhalten.
- [ ] Keine neuen Daten, URLs, Scores, Frischeversprechen oder Runtime-Claims wurden erfunden.
- [ ] Tests/Verify grün — primär `bash scripts/verify.sh`; zusätzlich `git diff --check`.
- [ ] PASS durch zweiten DoD-Reviewer oder dokumentierter Self-Review gegen diese Spec, falls kein externer Reviewer verfügbar ist.

## Plan
1. Spec-Datei anlegen und gegen User-Freigabe als Arbeitsvertrag nutzen.
2. `docs/product.md` aktualisieren: Einstieg, Vision, Kernidentität, Mehrwert und Produktstil positiv formulieren; Negativlisten zu Guardrails reduzieren.
3. `docs/brand.md` aktualisieren: Brand-Identität auf ruhigen Haushaltscheck und RuhrLogik-DNA ausrichten; `v02`-Priorität in der Verbindlichkeit nennen; Negativliste als Guardrails statt Leitframe.
4. `docs/ui-standard.md` aktualisieren: aktuelle UI-Arbeit auf Haushaltscheck-Einstieg und Nutzenpfad ausrichten; Dashboard-/Live-Verbote als Guardrails beibehalten.
5. Verify ausführen: `git diff --check`, `bash scripts/verify.sh`.
6. Diff gegen Definition of Done prüfen und Git-Status berichten.

## Rollback
- Änderungen liegen in einem kleinen Doku-/Spec-Scope und können per Einzelcommit revertet werden.
- Keine Runtime-, DB- oder Deploy-Seiteffekte.
