# ADR-041 — Plausibilitäts-Gate (Shadow-First, migrationsfrei)

**Status:** accepted (Entscheidungen); Implementierung deferriert (W6a nur auf eigene Freigabe)
**Datum:** 2026-06-04
**Autor:** Jean Schütz
**Kontext-Dok:** `docs/intelligence/plausibility-gate-plan.md`, `docs/intelligence/fact-to-impact-plan.md §6`, `docs/intelligence/source-health-plan.md §8`, ADR-040

## Kontext

Indikator-Live-Werte fließen heute **ungeprüft** in die Öffentlichkeit: der Ingestion-Pfad macht einen direkten `UPDATE indicators SET current_value …` (`db.py:190–224`), und die Indikatorzeile ist per Seed `published`. Es gibt keine Plausibilitätsprüfung, kein „nicht still übernehmen", keinen Stale-on-error-Anker. Die Soll-Policy ist seit 2026-06-03 dokumentiert (fact-to-impact §6), aber bewusst ungebaut.

W6 baut die **Entscheidungslogik** (das Gate). `source_health` (ADR-040) ist die spätere Persistenz-/Anzeige-Schicht und in W6 **nicht** Voraussetzung.

## Entscheidung

Ein Plausibilitäts-Gate prüft jeden Indikator-Wert (Pfad A, `item.indicator_id`) gegen vier Check-Familien — **C1** harte Plausibilitätsgrenze, **C2** Delta-Anomalie, **C3** Schwellenriss (Warn/Kritisch), **C4** Quelle fehlerhaft/stale — und leitet eine `would_action` ab. Vier Festlegungen:

1. **Anomalie-Semantik: differenziert.** Daten-/Parsingfehler (C1/C4) halten den letzten guten öffentlichen Wert; plausible Ausreißer (C2/C3) übernehmen den neuen Wert mit Prüfhinweis. Unparsebare Werte werden **nie** öffentlicher `current_value`. Kein Auto-Publish; das Editorial-Gate bleibt maßgeblich.

2. **Grenzen in Python-Config, keine Migration.** `PLAUSIBILITY_RULES` (pro Indikator `plausibility_min/max`, `max_delta_percent`) in `plausibility_rules.py`. Fehlende Regel crasht nicht (nur C3/C4 + Warning). C3 nutzt die vorhandenen DB-Schwellen `threshold_warn/critical` + `scale_direction` (read-only). Keine DB-Spalten, keine Drizzle-Änderung.

3. **Gate ohne `source_health`-Tabelle.** W6 persistiert keinen `source_health`-Status; Entscheidungen werden auditierbar dokumentiert (`editorial_audit_log` / strukturiertes Log). Keine Migration, kein UI-Badge. Die `source_health`-Tabelle folgt später als eigene W4b-Migration mit ausdrücklicher Freigabe; das Badge mit W7.

4. **Shadow-First-Rollout.** W6a läuft zunächst nur beobachtend: jeder Wert wird bewertet und geloggt, der Live-Pfad bleibt **unverändert** (`current_value` wird wie heute geschrieben, nichts blockiert). Erst nach Auswertung der Fehlalarm-Rate gegen echte Daten wird in W6b — eigene Freigabe — scharf geschaltet.

**Diese ADR trifft die Logik-/Rollout-Entscheidung. Sie baut nichts:** keine Migration, kein Gate-Code, kein Badge. Die Shadow-Implementierung (W6a) folgt nur auf ausdrückliche Freigabe.

## Konsequenzen

### Positiv
- Migrationsfrei startbar — kein Schema-/Produktionsrisiko, schnelle Kalibrierung über Config.
- Shadow-Modus macht Fehlalarme sichtbar, **bevor** produktive Werte blockiert werden — erfüllt „keine Blockade ohne klaren Gate-Flow".
- Live-Pfad bleibt im Shadow byte-genau erhalten — keine stille Änderung am `ingest_value`-Pfad.
- C3 nutzt vorhandene DB-Schwellen — keine doppelte Wahrheit, kein neues Feld.
- Reine `evaluate()`-Funktion (Muster wie `validation.py`) — isoliert, gemockt testbar.

### Negativ
- Plausibilitätsgrenzen/Delta liegen (vorerst) im Code, nicht im CMS — Änderung erfordert Deploy.
- Doppelter Trail-Weg (stdout + optional Audit-reason) bis `source_health` existiert.

### Risiken
- Konservative Startgrenzen können echte Krisensignale als „ok" durchlassen oder zu viele Fehlalarme erzeugen — Kalibrierung in der Shadow-Auswertung nötig.
- C4 muss Fallback-/`confidence=niedrig`-Items zuverlässig als Quelle-fehlerhaft erkennen, sonst bleibt „Erfolg trotz Fehler" bestehen.

## Alternativen (verworfen)

1. **DB-Spalten für Grenzen/Delta + Migration sofort:** verfrüht — Kalibrierung iteriert stark; Migration lockt unausgereifte Werte fest. Später als eigene Welle möglich.
2. **`source_health`-Tabelle zuerst, dann Gate:** koppelt W6 an eine Migration; nicht nötig, da Audit-Log den Trail migrationsfrei trägt.
3. **Gate sofort scharf (ohne Shadow):** höchstes Fehlalarm-Risiko auf Live-Werten; widerspricht „keine Blockade ohne klaren Gate-Flow".
4. **Anomalie immer anzeigen-mit-Hinweis (statt differenziert):** ein Parsing-Fehler würde kurz Müll als `current_value` zeigen — verletzt das Vertrauensversprechen.

## Referenzen

- `docs/intelligence/plausibility-gate-plan.md` — detaillierter Plan (Checks, Semantik, Config, Shadow-Log, Rollout)
- `docs/intelligence/fact-to-impact-plan.md` §6 — Plausibilitäts-Gate-Policy (Soll)
- `docs/intelligence/source-health-plan.md` §8 — Zusammenspiel Gate ↔ source_health
- ADR-040 — Source-Health als eigene Struktur (spätere Persistenz/Badge)
