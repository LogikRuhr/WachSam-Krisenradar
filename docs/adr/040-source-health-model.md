# ADR-040 — Source-Health als eigene Struktur

**Status:** accepted (Entscheidung); Implementierung deferriert (keine Migration in dieser Welle)
**Datum:** 2026-06-03
**Autor:** Jean Schütz
**Kontext-Dok:** `docs/intelligence/source-health-plan.md`, `docs/intelligence/source-inventory.md`

## Kontext

WachSam holt Messwerte über mehrere Python-Adapter (GIE/Gasspeicher, Destatis/VPI, EIA/Brent, FRED/Erdgas, FAO/Food Price, Tankerkönig/Spritpreise) und plant unstrukturierte Quellen (RSS → LLM). Heute gibt es **keinerlei** Quellen-Gesundheit: weder `sources` noch `item_sources` noch `indicators` tragen Erreichbarkeit, Frische, Fehlerzustand oder Lizenz (siehe Inventur). Folgen:

- Eine ausgefallene Quelle kann still einen veralteten oder per Fallback erzeugten Wert weiterzeigen („Erfolg trotz Fehler").
- `source_stand` wird teils synthetisch aus `now` gesetzt (`db.py:141/162`), nicht aus dem realen Quellenstand — ein Vertrauens-/Transparenzproblem.
- Es gibt keine Basis für „Datenfrische sichtbar machen" / „Quellenlücke statt kaputter UI" (konzeptionelle WorldMonitor-Inspiration, **kein** Code-Übernahme).

Für das geplante Plausibilitäts-Gate (ADR-Folge, `fact-to-impact-plan.md §6`) wird zudem eine Stelle gebraucht, an der ein „nicht still übernehmen"-Zustand (`anomaly`) persistiert wird.

## Entscheidung

Source-Health wird als **eigene Struktur** modelliert — **nicht** als Spalten auf `indicators`.

- **Geltungsbereich:** alle Quellen/Adapter, bezogen auf `adapter_id` und/oder `source_id`; abhängige Objekte (`indicators`, `facts`, `item_sources`) lesen den Status per Lookup `Item → Quelle/Adapter → source_health`.
- **Statuswerte:** `fresh` · `stale` · `error` · `disabled` · `unknown` · `anomaly`.
- **Zeit-/Stand-Felder klar getrennt:** `source_stand` (fachlicher Quellenstand) ≠ `retrieved_at` (redaktionelle Verifikation) ≠ `last_ingested_at` (letzter Schreib-Lauf) ≠ `last_checked_at` (letzter Health-Check, neu) ≠ `last_success_at` (letzter valider Abruf).
- **Stale-on-error:** letzten guten Wert behalten, Zustand markieren, nie Fehler als Wert anzeigen.
- **Verhältnis zum Plausibilitäts-Gate:** `source_health` ist Persistenz-/Anzeige-Schicht; das Gate ist die Entscheidungslogik und setzt `anomaly`. Die Gate-Logik wird hier **nicht** spezifiziert/gebaut.

**Diese ADR trifft die Struktur-Entscheidung. Sie baut nichts:** keine Migration, kein Code, keine Plausibilitätslogik. Die additive Tabelle, der Health-Check und die UI-Badges folgen in eigenen, explizit freizugebenden Wellen (Rollout-Reihenfolge im Plan).

## Konsequenzen

### Positiv
- Health gilt für alle Quellen (Adapter/Facts/ItemSources), nicht nur Indikatoren.
- Keine Migrationslast auf produktiven Content-Tabellen (rein additiv).
- Saubere Trennung fachliches Modell (`indicators`) vs. Betriebszustand (`source_health`).
- Grundlage für ehrliche Frische-Anzeige, Stale-on-error und das Plausibilitäts-Gate.
- Lässt sich mit der Source-Registry verbinden.

### Negativ
- Ein zusätzliches Modell + Lookup-Pfad (Item → Quelle → Health) statt direkter Spalte.
- Adapter brauchen eine formalisierte `adapter_id` (heute nur Klassenname `name`).

### Risiken
- Frische-Fenster und Failure-Schwellen müssen pro Quelle sinnvoll kalibriert werden (sonst Fehlalarme oder verpasste Ausfälle).
- Doppelte Wahrheit vermeiden: `source_health` ist Zustand, nicht zweite Datenhaltung.

## Alternativen (verworfen)

1. **Spalten auf `indicators`** (`source_health`, `source_checked_at`): deckt nur den Indikator-Pfad ab, nicht Facts/ItemSources/RSS; redundant bei mehreren Indikatoren pro Adapter; bläht das fachliche Modell auf.
2. **Reine Log-/`adapter_runs`-Tabelle** (wie ADR-038 vorsah): liefert Verlauf, aber keinen schnell lesbaren *aktuellen Zustand* für UI-Badges; ADR-038-Staging ist ohnehin nie gebaut worden.
3. **Kein Health-Modell, nur Timestamps interpretieren:** zu fragil, keine `anomaly`/`disabled`-Semantik, kein Stale-on-error-Anker.

## Referenzen

- `docs/intelligence/source-health-plan.md` — detaillierter Plan (Felder, UI, Rollout)
- `docs/intelligence/source-inventory.md` — Inventur (source_health als Lücke)
- `docs/intelligence/fact-to-impact-plan.md` §6 — Plausibilitäts-Gate-Policy
- ADR-038 — Ingestion-Architektur (`adapter_runs`/Staging, nicht implementiert)
- ADR-039 — Intelligence Core
