# WachSam — Plausibilitäts-Gate-Plan (Welle 6, Planung)

**Stand:** 2026-06-04 · **Typ:** Planungsdokument — **kein Gate-Code, keine Migration, keine Drizzle-Änderung in diesem Schritt.** · **Entscheidung:** [ADR-041](../adr/041-plausibility-gate.md) · **Basis:** [fact-to-impact-plan.md §6](./fact-to-impact-plan.md), [source-health-plan.md §8](./source-health-plan.md), [ADR-040](../adr/040-source-health-model.md)

> Ziel: Live-Indikatorwerte nicht mehr **still** als Normallage übernehmen, wenn Plausibilitätsgrenzen, Deltas oder Schwellen auffällig sind oder die Quelle fehlerhaft ist. W6 startet **migrationsfrei** und **im Shadow-Modus** (nur beobachten/loggen, Live-Pfad unverändert). Scharfstellung ist eine spätere, eigene Entscheidung.

---

## 0. Festgelegte Entscheidungen (Jean, 2026-06-04)

| # | Entscheidung | Wahl |
|---|--------------|------|
| 1 | **Anomalie-Semantik** | **Differenziert.** Daten-/Parsingfehler (C1/C4) halten den letzten guten Wert; plausibler Ausreißer (C2/C3) übernimmt mit Prüfhinweis. Unparsebares wird **nie** öffentlicher `current_value`. |
| 2 | **Grenzen/Delta-Ablage** | **Python-Config, keine Migration.** `PLAUSIBILITY_RULES` pro Indikator; fehlende Regel crasht nicht (nur C3/C4 + Warning). C3 nutzt die bestehenden DB-Schwellen. |
| 3 | **source_health-Sequencing** | **Gate ohne Tabelle.** Audit/Log statt `source_health`-Persistenz; kein UI-Badge; keine Migration. |
| 4 | **Aktivierung** | **Shadow/Log-only zuerst.** Gate bewertet & loggt, ändert den Live-Pfad **nicht**. Scharfstellung getrennt nach Auswertung. |

---

## 1. Abgrenzung — was W6 (diese Welle) NICHT tut

- **Keine** DB-Migration, **keine** Drizzle-Schemaänderung, **keine** `source_health`-Tabelle.
- **Kein** UI-Anomaly-Badge (kommt später mit W4b-Migration + W7).
- **Keine** stille Änderung am `ingest_value`-Pfad: im Shadow-Modus wird `current_value` **byte-genau wie heute** geschrieben.
- **Keine** Blockade produktiver Werte im Shadow-Modus.
- **Kein** Auto-Publish erklärender Drafts — das redaktionelle Gate bleibt maßgeblich.
- **Keine** Änderung an redaktionellen Texten, `haushaltsauswirkung`, `maßnahme`, `severity`/Lagestufe, `published_at`, `editorial_status`.

---

## 2. Ist-Zustand: der `ingest_value`-Pfad heute

Für ein Indikator-Item (`item_type == "indicators"` **und** `item.indicator_id`) macht `db.py:190–224`:

1. **Direkter Live-Overwrite** ungeprüft: `UPDATE indicators SET current_value, current_value_date, previous_value, previous_value_date, last_ingested_at` (`db.py:192`).
2. Append in `indicator_observations` (idempotent, `ON CONFLICT DO NOTHING`, `db.py:215`).
3. Audit-Log: `editorial_audit_log` mit `action="ingest_value"`, `from/to_status="published"`, `reason=` Validierungs-JSON (`db.py:228`).
4. `item_sources` mit ehrlichem `source_stand`-Label (`db.py:252`).

Die Indikatorzeile ist per Seed `published` → der Wert ist **sofort öffentlich, ohne Plausibilitätsprüfung**. Genau diese Lücke schließt W6.

---

## 3. Geltungsbereich des Gates

Das Gate läuft **ausschließlich** auf dem Indikator-Pfad (Pfad A), erkennbar an `item_type == "indicators"` **und** `item.indicator_id`. In Scope sind heute die Indikatoren, die über `item.indicator_id` aktualisiert werden (BNetzA/Gasspeicher, EIA/Brent, FRED/Erdgas-Europa, Tankerkönig/Kraftstoff E10+Diesel — exakte IDs werden bei Umsetzung gegen den Seed verifiziert).

**Nicht in Scope:** Pfad B (`facts`, `lagebild_items` etc. — z. B. Destatis/VPI, FAO als `facts`). Diese berühren `current_value` nicht und durchlaufen ohnehin das Editorial-Gate.

---

## 4. Die vier Check-Familien

| Check | Frage | Grenze aus | gate_class | would_action (scharf) |
|-------|-------|-----------|-----------|------------------------|
| **C1 Plausibilitätsgrenze** | Wert physisch/logisch unmöglich? (z. B. Gasspeicher <0/>100 %, Sprit 0,01 €/L) | `PLAUSIBILITY_RULES[id].plausibility_min/max` (**Config**) | `C1` | `keep_previous_value` |
| **C2 Delta-Anomalie** | Sprung ggü. Vorwert größer als erlaubt? | `PLAUSIBILITY_RULES[id].max_delta_percent` (**Config**) | `C2` | `accept_with_review` |
| **C3 Schwellenriss** | Warn-/Kritisch-Schwelle überschritten? | `indicators.threshold_warn/critical` + `scale_direction` (**DB, read-only**) | `C3` | `accept_with_review` |
| **C4 Quelle fehlerhaft/stale** | Wert fehlt, unparsebar, Fallback-/`confidence=niedrig`-Item? | Adapter-Output (kein Grenzwert nötig) | `C4` | `parsing_error` → `keep_previous_value` |
| **ok** | alle Checks grün | — | `ok` | `accept_normal` |

**Präzedenz bei Mehrfachtreffer (von hart nach weich):** `C4` (Quelle/Parsing) → `C1` (unmöglich) → `C3` (Schwellenriss) → `C2` (Delta). Der härteste Befund bestimmt `gate_class`/`would_action`; die weiteren Treffer werden im `reason` mitgeführt.

**Regeln für robustes Verhalten:**
- Fehlt für einen Indikator eine Config-Regel → nur C3/C4 prüfen, C1/C2 überspringen, **Warning loggen**, nicht crashen.
- C2 braucht einen parsebaren Vorwert; fehlt `previous_value` oder ist 0 → C2 überspringen + Warning.
- C3 braucht die DB-Schwellen; sind sie nicht lesbar (Dry-Run, fehlende Zeile) → C3 überspringen + Warning.
- C1/C4: ein `None`/NaN/unparsebarer `current_value` ist **immer** `C4 parsing_error` (nicht C1).

---

## 5. Anomalie-Semantik (Entscheidung 1, differenziert)

Diese Regeln beschreiben das **scharfe** Verhalten (W6b). Im Shadow-Modus (W6a) werden sie nur als `would_action` geloggt, **nicht** ausgeführt.

| gate_class | would_action | öffentlicher `current_value` | Historie (`observations`) | Audit/Review |
|------------|--------------|------------------------------|---------------------------|--------------|
| `ok` | `accept_normal` | neu übernehmen (wie heute) | append | normaler Audit-Eintrag |
| `C2`/`C3` | `accept_with_review` | **neuen Wert übernehmen** | append | Review-Spur + Audit, UI-Hinweis „Einordnung in Prüfung" |
| `C1` | `keep_previous_value` | **alten Wert halten** | append (Wahrheit der Quelle bleibt dokumentiert) | Review-Spur + Audit |
| `C4` | `parsing_error` | **alten Wert halten** | **kein** Append eines unparsebaren Werts | Review-/Audit-Eintrag, UI-Hinweis „Quelle/Parsing in Prüfung" |

**Harte Grenzen (Entscheidung 1):** Unparsebare/offensichtlich kaputte Werte werden **nie** öffentlicher `current_value`. Plausible Ausreißer dürfen sichtbar werden — aber nur mit Prüfhinweis. **Kein** Auto-Publish erklärender Drafts.

---

## 6. Config-Struktur (`PLAUSIBILITY_RULES`)

Eigenes Modul `v02/intelligence/src/plausibility_rules.py` (getrennt von `config.py` — das ist Settings/Secrets, nicht statische Kalibrierung).

```python
# Konservativ starten, später kalibrieren. Fehlende Regel ist erlaubt (nur C3/C4).
PLAUSIBILITY_RULES: dict[str, dict] = {
    "wi-oel-brent":               {"plausibility_min": 0,   "plausibility_max": 300, "max_delta_percent": 25},
    "wi-gasspeicher-fuellstand":  {"plausibility_min": 0,   "plausibility_max": 100, "max_delta_percent": 15},
    "wi-gaspreis-europa":         {"plausibility_min": 0,   "plausibility_max": 400, "max_delta_percent": 40},
    "wi-kraftstoffpreis-e10":     {"plausibility_min": 0.5, "plausibility_max": 5,   "max_delta_percent": 20},
    "wi-kraftstoffpreis-diesel":  {"plausibility_min": 0.5, "plausibility_max": 5,   "max_delta_percent": 20},
}
```

- Werte sind **illustrativ** und werden bei Umsetzung mit Jean kalibriert (konservativ = lieber etwas zu weit, um Fehlalarme im Shadow zu messen).
- IDs werden gegen `v02/db/seed/indicators.ts` verifiziert.
- **Keine** DB-Spalten, **keine** CMS-Editierbarkeit in W6. Spätere DB-Spalten nur als eigene Welle, wenn die Regeln stabil sind.

---

## 7. Gate-Modul (reine Funktion, Muster wie `validation.py`)

Neues Modul `v02/intelligence/src/gate.py`, seiteneffektfrei und isoliert testbar:

```python
@dataclass
class GateVerdict:
    indicator_id: str
    raw_value: str | None          # roher Adapter-Output
    parsed_value: float | None     # parsebar? sonst None → C4
    previous_value: float | None
    gate_class: str                # "ok" | "C1" | "C2" | "C3" | "C4"
    would_action: str              # accept_normal | accept_with_review | keep_previous_value | parsing_error
    reason: str                    # maschinenlesbares JSON (alle Treffer + Grenzwerte)
    source_name: str | None
    source_stand: str | None
    observed_at: str | None

def evaluate(item, thresholds: dict | None) -> GateVerdict: ...
```

- `thresholds` (C3) kommt aus einem **read-only** Lookup `fetch_indicator_thresholds(indicator_id)` (SELECT `threshold_warn/critical`, `scale_direction`). Read-only, kein Write, dry-run-sicher (None → C3 skip).
- `evaluate()` ist rein — keine DB-Writes, kein Log; das Aufruf-Modul loggt/dokumentiert.

---

## 8. Shadow-Modus (Entscheidung 4) — W6a

**Was läuft:** Jeder Indikator-Wert wird vor dem Write durch `gate.evaluate()` bewertet; das Ergebnis wird strukturiert geloggt.

**Was NICHT läuft (Shadow):** keine `would_action` wird ausgeführt; `current_value` wird **wie heute** geschrieben; keine Blockade; keine Stale-on-error-Aktion; keine UI-Badges; keine Migration.

**Verdrahtung:** im Lauf (`main.py`, Schleife um `validate_draft`/`insert_draft`, ~Zeile 122–134) wird die Gate-Bewertung **vor** `insert_draft` berechnet und geloggt. Der Indikator-`UPDATE` in `db.py` bleibt unangetastet.

**Shadow-Log-Felder (verbindlich):** `indicator_id`, `raw_value`, `parsed_value`, `previous_value`, `gate_class` (C1/C2/C3/C4/ok), `would_action` (keep_previous_value | accept_with_review | accept_normal | parsing_error), `reason`, `source_name`, `source_stand`, `observed_at`.

---

## 9. Auditierbarkeit ohne Migration

**Entscheidung (Jean, 2026-06-04): W6a nutzt ausschließlich (A).** W6a bleibt Shadow/Log-only und **Null-Touch** am Live-/DB-Pfad — kein zusätzlicher Write. (B) bleibt als späterer, eigener Mikro-Schritt offen.

- **(A) — gewählt für W6a:** Strukturiertes stdout-JSON je bewertetem Wert. Null-Eingriff in den Live-Pfad / `insert_draft`, im Ingestion-Log auswertbar.
- **(B) — später, offen (nicht W6a):** Gate-Verdikt in das bereits existierende `editorial_audit_log.reason`-JSON falten (wird heute schon je Ingest geschrieben, `db.py:228`). Macht den Trail in der DB abfragbar, ohne neue Spalte/neuen `action`-Enum/Migration — aber ein minimaler expliziter Touch am Audit-Write. Bewusst **nicht** Teil von W6a.

---

## 10. Review-Draft

- **Migrationsfrei bevorzugt:** Der Review-Bedarf wird über den Audit-Trail (§9) sichtbar gemacht; ein dedizierter Review-Draft-Content-Eintrag wird nur erzeugt, wenn das ohne Migration über bestehende Strukturen geht. Sonst bleibt es bei Audit/Log.
- **Kein** Auto-Publish. Das Editorial-Gate (draft → approved → published) bleibt die einzige Veröffentlichungsinstanz.

---

## 11. Modul-/Test-Layout (bei Umsetzung)

| Datei | Inhalt | Art |
|-------|--------|-----|
| `src/plausibility_rules.py` | `PLAUSIBILITY_RULES`-Dict | neu, reine Daten |
| `src/gate.py` | `GateVerdict`, `evaluate()`, Checks C1–C4, Präzedenz | neu, reine Funktion |
| `src/db.py` | read-only `fetch_indicator_thresholds()` (kein Write) | additiv, read-only |
| `src/main.py` | Shadow-Aufruf + Log in der Ingestion-Schleife | additiv |
| `tests/test_gate.py` | Unit-Tests je Check, Präzedenz, fehlende Config, fehlender Vorwert, Dry-Run | neu (gemockt) |

Live-API-Tests bleiben getrennt; die Gate-Tests sind rein gemockt (wie `test_validation.py`).

---

## 12. Rollout-Reihenfolge

| Schritt | Inhalt | Art | Freigabe |
|---------|--------|-----|----------|
| **W6 (dieses Dokument + ADR-041)** | Checks, Semantik, Config, Shadow-Design | reine Doku/ADR | — |
| **W6a (Shadow)** | `gate.py` + Config + read-only Threshold-Read + Shadow-Log + Tests | Code + Tests, **migrationsfrei**, Live-Pfad unverändert | **eigene Freigabe** |
| **Auswertung** | Fehlalarm-Rate gegen echte Daten messen, Grenzen kalibrieren | Analyse | — |
| **W6b (Scharf)** | `would_action` ausführen (halten/übernehmen-mit-Review) | Code | **eigene Freigabe nach Auswertung** |
| **W4b (später)** | additive `source_health`-Tabelle (Migration) | Migration | **eigene Freigabe** |
| **W7 (später)** | UI-Badges fresh/stale/error/anomaly | Web-Code | — |

---

## 13. Offene Punkte für die Scharfstellung (W6b, nicht jetzt)

- Kalibrierte Grenzen/Delta pro Indikator (aus Shadow-Auswertung).
- Schwelle für „zu viele Fehlalarme" (wann nachjustieren statt scharf schalten).
- Genaue Stelle/Form, an der `would_action` im scharfen Modus ausgeführt wird (in `db.py` Indikator-Zweig vs. Vor-Filter in `main.py`).
- UI-Texte für „Einordnung in Prüfung" / „Quelle in Prüfung" (mit Brand-/Ton-Vorgaben, gehört zu W7).
- C4-Verfeinerung: Fallback-/`confidence=niedrig`-Items sauber als Quelle-fehlerhaft erkennen (BNetzA „Erfolg trotz Fehler").

**W6 endet hier — reine Dokumentation. Nächster Schritt nur auf ausdrückliche Freigabe: W6a (Shadow-Implementierung), migrationsfrei.**
