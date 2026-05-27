# Acceptance Criteria

Jede Aufgabe braucht testbare Akzeptanzkriterien.

## Pflichtfelder

- Ziel ist in einem Satz beschrieben.
- Non-Goals sind benannt.
- File-Scope ist mit `ADD`, `CHANGE`, `DELETE` freigegeben.
- Verify-Kommandos sind konkret.
- Security- und Datenschutz-Auswirkungen sind geklaert.
- Rollback ist moeglich oder bewusst ausgeschlossen.

## Qualitaet

Gute Kriterien sind:

- beobachtbar
- automatisierbar oder manuell eindeutig pruefbar
- frei von Platzhaltern
- auf den Scope begrenzt

Schlechtes Kriterium:

- "Deploy funktioniert."

Gutes Kriterium:

- "`deploy-source` laeuft auf `main` erfolgreich und `/opt/wachsam/source` steht auf dem Workflow Head SHA."

