# Spec: Lagebild Review Queue sichtbar machen

## Ziel
WachSam zeigt neue Intelligence-Drafts im Admin als priorisierte Review-Queue und erklärt im öffentlichen Lagebild den Gate-Pfad, ohne ungeprüfte Inhalte zu veröffentlichen.

## Umfang / Nicht-Umfang
- In Scope: Admin-Übersicht mit Draft-/Approved-Queue, priorisierte Admin-Listen, öffentliche Gate-Erklärung auf `/lagebild`.
- Out of Scope: DB-Schema, Auto-Publish, neue externe Quellen, Veröffentlichung konkreter Draft-Inhalte ohne redaktionelle Prüfung.

## Acceptance
- Admin-Start zeigt die nächsten Review-Items über alle Editorial-Typen.
- Listen sortieren `draft` und `approved` vor veröffentlichten/abgelehnten Einträgen.
- Public-Lagebild erklärt `Automatische Signale -> Redaktion -> Veröffentlichung`, ohne Draft-Titel, Draft-Quellen oder Draft-Anzahl zu leaken.
- Existing Editorial-Gate bleibt: `publish` nur nach `approve`.
- Keine Secrets oder PII in neuen Dateien.

## Verify
- `bash scripts/verify.sh`
- `cd v02 && corepack pnpm run verify`
- Browser-Smoke für `/admin` und `/lagebild`
- Nach Deploy: Live-Smoke gegen `/api/health`, `/lagebild`, `/admin` mit Statuscodes.

## Rollback
Commit revert. Keine Migration und kein Daten-Write nötig.
