# Spec: Feedback PII Minimization

## Ziel
Feedback darf keine freiwillige Kontakt-E-Mail mehr persistent in der WachSam-Datenbank speichern.

## Clarifications
- F: Soll die Rueckfragefunktion erhalten bleiben? -> A: Nur, wenn sie ohne persistente PII in WachSam-DB auskommt oder als separater Support-Flow mit eigener Freigabe spezifiziert wird.

## Umfang / Nicht-Umfang
- In Scope: `contactEmail` aus Feedback-Input, API-Route, DB-Persistenz, Admin-Lesemodell und Tests entfernen oder hart auf `null` begrenzen.
- In Scope: Bestehende Feedback-Eintraege mit `contact_email` per Migration oder dokumentiertem Operator-Schritt bereinigen.
- Out of Scope: Neues Support-Ticket-System, Mail-Versand, CRM, neue PII-Speicherklasse.

## Kriterien
- Feedback-Schema akzeptiert keine E-Mail fuer DB-Persistenz mehr.
- API schreibt bei Feedback keine E-Mail-Adresse in `feedback.contact_email`.
- Admin-UI zeigt keine Kontakt-E-Mail aus Feedback-Daten.
- Datenschutz-/Security-Doku beschreibt: Feedback speichert Inhalt, Kategorie, optional User-Bezug, aber keine Kontaktadresse.
- Bestehende Daten werden geloescht oder nachweisbar auf `null` gesetzt.

## Tests
- `cd v02 && pnpm run verify`
- Unit/API-Test: Feedback mit `contactEmail` speichert `contact_email = null` oder wird schema-konform abgewiesen.
- DB-Smoke lokal: neue Feedback-Zeile enthaelt keine E-Mail.
- Secret-/PII-Check: keine testweise echte E-Mail in Fixtures, Logs oder Outputs.

## Qualitaet
- Keine neue PII in Tabellen, Logs, Admin-Views oder Audit-Outputs.
- Migration/Operator-Schritt ist idempotent und rollbackfaehig.
- Fehlermeldungen bleiben sachlich und leaken keine Eingaben.

## Optimierung
- UI-Wording reduzieren: Feedback ist Einweg-Hinweis, keine Support-Anfrage.
- Optional spaeter separater Support-Flow mit expliziter Einwilligung, Retention und Loeschpfad.

## Schritte
1. Aktuelle Feedback-Pfade und Tests inventarisieren.
2. Persistenz von `contactEmail` entfernen oder auf `null` erzwingen.
3. Bestandsdaten bereinigen.
4. Tests und Security-Check ausfuehren.
