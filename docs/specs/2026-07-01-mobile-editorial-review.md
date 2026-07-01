# Spec: Mobile Editorial Review

## Ziel
WachSam bekommt eine mobile Operator-Oberfläche unter `/review`, damit Editorial-Drafts ohne lokale CLI geprüft, freigegeben, publiziert oder abgelehnt werden können.

## Clarifications
- F: Soll die CLI ersetzt werden? -> A: Nein, sie bleibt Fallback.
- F: Darf publiziert werden? -> A: Ja, aber nur manuell und nur nach `approve`.
- F: Darf die Oberfläche öffentlich Draft-Daten leaken? -> A: Nein, `/review` bleibt `editor/admin`-geschützt.

## Umfang / Nicht-Umfang
- In Scope: mobile Queue, Detailansicht, Approve/Reject/Publish-Actions, Audit-Log über bestehende Statusmaschine, Operator-Rollen-Script.
- Out of Scope: neues DB-Schema, Auto-Publish, neue Quellen, öffentlicher Draft-Preview, Umbau des Admin-CMS.

## Definition of Done
- [ ] `/review` ist nur für `editor/admin` erreichbar.
- [ ] Queue zeigt Typ, Status, Titel, Beschreibung, Confidence, Quelle, Quellenstand und letzten Audit-Hinweis, soweit vorhanden.
- [ ] Detailseite zeigt die relevanten Item-Felder ohne Tabellenlayout.
- [ ] `approve`, `publish` und `reject` nutzen die bestehende Statusmaschine und schreiben Audit-Log.
- [ ] `publish` ist nur aus `approved` möglich; `reject` verlangt einen Grund.
- [ ] Operator-Rollen-Script promoted nur existierende Auth-User und mutiert nur mit `--confirm`.
- [ ] Keine Secrets, keine öffentlichen PII, keine Draft-Leaks auf Public Routes.
- [ ] Tests grün: `cd v02 && corepack pnpm run verify`.
- [ ] Root-Gate grün: `bash scripts/verify.sh`.

## Schritte
1. Review-Readmodel in `v02/web/lib/admin/editorial-read.ts` um Quellen- und Audit-Kontext erweitern.
2. `/review`-Layout, Queue-Seite, Detailseite und Server Actions ergänzen.
3. Mobile Review-Cards und Detail-Komponente ergänzen.
4. Auth-Middleware für `/review` analog Admin absichern, aber Rollenprüfung serverseitig erzwingen.
5. Operator-Rollen-Script und Test ergänzen.
6. CSS mobile-first ergänzen und Browser-Smoke im mobilen Viewport ausführen.
