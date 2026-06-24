# Spec: Welle 4 — Datenfrische vor Deploy

## Ziel (in einem Satz)
WachSam soll vor dem nächsten Live-Deploy eindeutig erkennen und sichtbar machen, welche öffentlichen Daten frisch, akzeptabel verzögert, veraltet oder quellseitig gestört sind, damit keine April/Mai-/Altstände unbemerkt prominent live gehen.

## Clarifications (vom Agenten gestellte Rückfragen + meine Antworten)
- F: Sollen alte Daten manuell überschrieben oder systematisch geprüft werden? → A: Empfehlung freigegeben: zuerst Freshness Gate + Source-Health-Sichtbarkeit, danach kontrollierter Refresh-/Publish-Pfad.
- F: Ist `Rentebeziehende` als Haushaltsmodus-Begriff gewünscht? → A: Ja, bereits in Welle 3 vereinheitlicht.

## Ausgangslage / Befund
- Welle 3 ist committed, gepusht und CI-grün: `2507c50 feat: add anonymous household check entry`.
- `v02/db/seed/facts.ts` enthält statische Public-/Seed-Facts mit u.a. Januar, März, April, Mai 2026 sowie November/Dezember 2025.
- Read-only Live-Dry-Run am 2026-06-24 zeigt frischere Adapterdaten für mehrere Quellen: Tankerkönig/Pegelonline/DWD 2026-06-23, EIA 2026-06-15, EZB 2026-06-17, Destatis/FAO/Arbeitslosigkeit 2026-05.
- Nicht jedes ältere Datum ist automatisch schlecht: FAO/Destatis/Arbeitslosigkeit sind monatlich, BIP quartalsweise, Staatsschulden jährlich/offiziell verzögert.
- Blocker/Schwächen: BNetzA/Gasspeicher Timeout, Handelsblatt RSS 0 Items, LLM/RSS wegen Placeholder-Credentials übersprungen, fehlende Schwellen/Plausibilitätsregeln bei mehreren Indikatoren.

## Umfang / Nicht-Umfang
- In Scope:
  - Python Freshness Gate, das aktive Quellen aus `v02/intelligence/source_registry.yaml` anhand ihrer `freshness_expectation` bewertet.
  - Tests für die Freshness-Klassifikation: `fresh`, `acceptable-lag`, `stale`, `source-error`, `archival`.
  - Persistente/anzeigbare Source-Health-Semantik so `/status` zwischen `ok`, `degraded`, `failed` und Frischezustand verständlich unterscheiden kann.
  - BNetzA Timeout als Source-Error/Stale-on-error sichtbar halten, nicht als frisches leeres Item veröffentlichen.
  - Handelsblatt RSS als reparieren-oder-deaktivieren-Entscheidung dokumentieren; kein grünes 0-Items-Fake.
  - Frontdoor/Public-Status soll alte prominente Daten nicht ohne Stand-/Frischehinweis erscheinen lassen.
- Out of Scope:
  - Kein Production-Deploy in dieser Welle.
  - Keine automatische Veröffentlichung ungeprüfter Adapterwerte.
  - Keine große DB-Migration ohne separate Freigabe.
  - Kein vollständiger Claim-Discovery-/LLM-Produktivpfad; RSS/LLM darf als inactive/blocked markiert bleiben.
  - Keine manuelle Aktualisierung aller historischen Facts ohne Quellenprüfung.

## Vorgeschlagene File-Liste
- ADD `v02/intelligence/src/freshness.py` — reine Frische-Klassifikation nach Erwartung/Frequenz.
- ADD `v02/intelligence/tests/test_freshness.py` — deterministische Tests ohne Netzwerk.
- CHANGE `v02/intelligence/src/source_health.py` — SourceHealthRecord optional um Frischeklassifikation / Erwartung erweitern.
- CHANGE `v02/intelligence/src/main.py` — Live-Dry-Run/Source-Health um Frischezustand aus Registry/Adapterständen anreichern, ohne DB-Writes im Dry-Run.
- CHANGE `v02/intelligence/source_registry.yaml` — Handelsblatt/BNetzA-Status/Notes aktualisieren, falls Prüfung es bestätigt.
- CHANGE `v02/web/app/status/page.tsx` — Statusseite zeigt Frischezustand/Erwartung verständlicher.
- Optional CHANGE `v02/web/lib/public-data.ts` und passende Komponenten — nur falls die Public-Frontdoor aktuell veraltete prominente Items ohne Hinweis zeigt.

## Definition of Done
- [ ] Freshness-Klassifikation unterscheidet mindestens: `fresh`, `acceptable-lag`, `stale`, `source-error`, `archival`.
- [ ] Frischebewertung basiert auf `freshness_expectation`, nicht auf pauschalem Kalenderalter.
- [ ] Monatliche/Quartals-/Jahresquellen werden nicht fälschlich als stale bewertet, wenn ihr Stand zur offiziellen Frequenz passt.
- [ ] Daily/near-real-time Quellen werden als stale/source-error erkannt, wenn sie nicht aktuell sind oder timeouten.
- [ ] BNetzA Timeout bleibt Source-Error/Stale-on-error; kein Fake-Wert, kein frisches Leer-Item.
- [ ] Handelsblatt RSS wird entweder mit aktuellem Feed repariert oder im Registry-/Statusmodell als nicht produktiv markiert.
- [ ] `/status` zeigt für Quellen neben technischem Status auch erwartete Aktualität/Frische verständlich an.
- [ ] Root/Security: `bash scripts/verify.sh` PASS.
- [ ] v02 App: `cd v02 && pnpm run verify` PASS, sofern Web geändert wird.
- [ ] Python Intelligence: `cd v02/intelligence && python -m pytest tests/ -q` PASS.
- [ ] Read-only Live-Probe: `cd v02/intelligence && WACHSAM_SOURCE_HEALTH_PATH=<tmp> python -m src.main --dry-run --allow-fetch` läuft und berichtet Source Health ohne DB-Write.

## Verify / Review
1. Focused RED/GREEN Tests für `freshness.py`.
2. Python-Gesamttests: `python -m pytest tests/ -q`.
3. App-Verify bei Web-Änderungen: `cd v02 && pnpm run verify`.
4. Root-Security: `bash scripts/verify.sh`.
5. Read-only Live-Dry-Run mit temporärem Source-Health-Output.
6. DoD-Self-Check gegen diese Spec; Reviewer bleibt read-only.

## Rollback
- Freshness-Gate-Dateien und Source-Health/UI-Änderungen revertieren.
- `source_registry.yaml` auf vorherigen Status zurücksetzen.
- Keine DB-/Production-Änderungen in dieser Welle; daher Rollback ohne Datenmigration möglich.

## Nächste Welle nach PASS
Welle 5: Kontrollierter Data Refresh / Publish Path für frische Adapterdaten: Adapterwerte als Draft/Candidate erfassen, plausibilisieren, redaktionell freigeben und erst danach öffentlich anzeigen.
