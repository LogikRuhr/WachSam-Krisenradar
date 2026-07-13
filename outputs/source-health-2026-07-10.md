# Source Health Report 2026-07-10

## Scope

Reproduzierbare Auffaelligkeiten aus dem aktuellen Intelligence-/Ingestion-Lauf. Keine Code-Aenderung, keine neue Quelle, keine DB-Aktion.

## Befunde

### Destatis VPI

- Status: fragil, aber nicht hard-failing.
- GENESIS liefert weiterhin keinen nutzbaren Datenquader fuer den VPI-Pfad.
- Der HTML-Fallback in `v02/intelligence/src/adapters/destatis.py` greift und erzeugt Items.
- Risiko: methodische Stabilitaet bleibt eingeschraenkt, weil der produktive Pfad vom Fallback abhaengt.
- Naechster Schritt: Adapter-Scope fuer robusteren GENESIS-/Fallback-Nachweis oder explizite Source-Health-Kennzeichnung.

### Handelsblatt RSS

- Status: faktisch unbrauchbar.
- Ergebnis: 0 Items.
- Das Verhalten ist konsistent mit `status: disabled` in der Registry.
- Risiko: kein akuter Pipeline-Fehler, aber keine operative Abdeckung ueber diesen Feed.
- Naechster Schritt: disabled lassen oder Quelle aus aktivem Health-Reporting getrennt ausweisen.

### RSS/LLM Dry-Run

- Status: technisch kein Hard-Fail, operativ auffaellig.
- Der RSS/LLM-Pfad in `v02/intelligence/src/main.py` fuehrt im Dry-Run echte Extraktionen aus.
- Logs zeigen `LLM quota exhausted; retrying`.
- Risiko: Dry-Runs koennen Quota verbrauchen und Source-Health-Signale verfaelschen.
- Naechster Schritt: separater Fix-Scope fuer Dry-Run-Verhalten, Quota-Gating oder explizite Health-Kennzeichnung.

### Plausibility-Gate / DB-Schwellen

- Status: wiederholt unvollstaendig.
- Mehrere Indikatoren laufen ohne DB-Schwellen.
- Das Gate meldet wiederholt `keine DB-Schwellen ... C3 uebersprungen`.
- Risiko: Plausibility-Pruefung ist fuer diese Indikatoren nicht voll wirksam.
- Naechster Schritt: fehlende Threshold-Seeds identifizieren und als Daten-/Migration-Scope planen.

## Einordnung

- Keine PII betroffen.
- Keine Secrets betroffen.
- Kein unmittelbarer Deploy-Blocker aus diesen Befunden allein.
- Operatives Risiko liegt in Source-Health-Vertrauen, Quota-Verbrauch und unvollstaendiger Plausibility-Abdeckung.

## Empfohlene Reihenfolge

1. RSS/LLM Dry-Run-Quota entschärfen.
2. Fehlende DB-Schwellen fuer aktive Indikatoren inventarisieren.
3. Destatis VPI methodisch haerten oder Fallback sichtbar als degraded markieren.
4. Handelsblatt RSS disabled lassen oder aus aktiven Health-Erwartungen entfernen.

## Verification

- Befunde beruhen auf reproduzierbaren Laufbeobachtungen aus der Session.
- Dieser Report ist ein lokales Repo-Artefakt in `outputs/` und enthaelt keine neuen Live-Daten.
