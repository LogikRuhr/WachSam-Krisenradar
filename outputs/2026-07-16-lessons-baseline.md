# Lessons-Messung K1–K7 — 2026-07-16 11:46

System-Start: 2026-07-16 · Repo: 07195bd · Modus: Baseline

## K1 — Lesson-Gate blockt (Stop-Hook)
- Selbsttest: exit 0 im Block-Szenario — vermutlich existiert bereits eine Lesson/ein Run-Memory, das juenger ist als der letzte Commit (frisch nach einer Arbeits-Session normal). Durchlass-Fall ✅
- Feld-Abdeckung (jeder Commit-Tag seit 2026-07-16 hat Run-Memory oder LESSONS.md-Aenderung):
  - 2026-07-16: ✅ (run-memory)

**Ergebnis K1: PASS** — Selbsttest ok; 1/1 Commit-Tagen mit Distillat

## K2 — Fehlschlag-Sektion gefuellt
- Eintraege in 'Was fehlgeschlagen ist': 1
- CI-Failures seit 2026-07-16 (Gegencheck, inkl. transienter Live-API-Flakes): 0

**Ergebnis K2: PASS** — 1 Eintrag/Eintraege; CI-Fails seit Start: 0 (bei >0 pruefen, ob ein Distillat existiert — Flakes zaehlen nicht)

## K3 — Specs referenzieren Lessons

**Ergebnis K3: n/a** — keine neue Spec seit 2026-07-16

## K4 — Review-Evidenz pro Merge/Push
- Review-Marker-Tage: 
- Commit-Tag 2026-07-16: ❌ kein Review-Marker (±1 Tag). Commits: 07195bd docs: establish run-log-distill-repeat memory contract

**Ergebnis K4: FAIL** — 0/1 Commit-Tagen mit Review-Evidenz (docs-only-Tage werden ausgewiesen, nicht versteckt)

## K5 — Lessons-Injection beim Session-Start
- Selbsttest: Injection enthaelt juengsten Eintrag (2026-07-16) ✅
- Session-Marker der letzten 7 Tage (Aufbewahrungsfenster): 3

**Ergebnis K5: PASS** — Injection korrekt; 3 Session(s) mit Hook in den letzten 7 Tagen

## K6 — System greift in wachsam-produkt-v1

**Ergebnis K6: n/a** — Repo existiert lokal noch nicht — beim Bootstrap LESSONS.md + docs/specs/TEMPLATE-spec.md mitgeben, dann greift das Gate automatisch

## K7 — Wirkungsnachweis (halb-manuell)
- Destillierte Regeln aus Run-Memories:
  - **Distilled rule:** → LESSONS.md 2026-07-16 (set -e + `|| true`, Zweige isoliert testen).
- LESSONS-Eintraege seit 2026-07-16:
  - 2026-07-16 · Unter `set -e` beendet `find | grep -q . && VAR=1` das ganze Script, sobald grep nichts findet (`a && b` endet non-zero) — der Bug blieb im er
- Wiederverwendungs-Hinweise (Lesson-Datum taucht in spaeteren Specs/Run-Memories auf):
  - Lesson 2026-07-16 referenziert in 1 Datei(en)

**Ergebnis K7: MANUAL** — finale Bewertung durch Jean+Claude in der Mess-Session: hat >=1 Regel nachweislich einen Fehler verhindert oder eine Spec gepraegt?

## Zusammenfassung

| Kriterium | Status | Daten |
|---|---|---|
| K1 | **PASS** | Selbsttest ok; 1/1 Commit-Tagen mit Distillat |
| K2 | **PASS** | 1 Eintrag/Eintraege; CI-Fails seit Start: 0 (bei >0 pruefen, ob ein Distillat existiert — Flakes zaehlen nicht) |
| K3 | **n/a** | keine neue Spec seit 2026-07-16 |
| K4 | **FAIL** | 0/1 Commit-Tagen mit Review-Evidenz (docs-only-Tage werden ausgewiesen, nicht versteckt) |
| K5 | **PASS** | Injection korrekt; 3 Session(s) mit Hook in den letzten 7 Tagen |
| K6 | **n/a** | Repo existiert lokal noch nicht — beim Bootstrap LESSONS.md + docs/specs/TEMPLATE-spec.md mitgeben, dann greift das Gate automatisch |
| K7 | **MANUAL** | finale Bewertung durch Jean+Claude in der Mess-Session: hat >=1 Regel nachweislich einen Fehler verhindert oder eine Spec gepraegt? |

PASS: 3 · FAIL: 1 · n/a: 2 · manuell: 1

> FAILs werden zu Nachjustierungs-Massnahmen; docs-only-Ausnahmen bei K4 explizit begruenden, nicht wegdefinieren.
