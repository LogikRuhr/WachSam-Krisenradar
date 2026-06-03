# WachSam — Source-Health-Plan (Welle 4, reine Planung)

**Stand:** 2026-06-03 · **Typ:** Planungsdokument, **keine Migration**, **kein Code**, **keine Plausibilitätslogik**. · **Entscheidung:** [ADR-040](../adr/040-source-health-model.md) · **Basis:** [source-inventory.md](./source-inventory.md), [fact-to-impact-plan.md](./fact-to-impact-plan.md)

> Ziel: Festlegen, wie WachSam die **Gesundheit seiner Datenquellen** sichtbar, bewertbar und testbar macht — als eigene Struktur, nicht als Anhängsel an `indicators`. Es wird in dieser Welle nichts gebaut. WorldMonitor dient nur konzeptionell als Inspiration (Datenfrische sichtbar machen, Stale-on-error, Quellenlücken zeigen) — **kein Code, keine Komponenten, keine Algorithmen übernommen.**

---

## 1. Zweck von `source_health`

`source_health` beantwortet pro Quelle/Adapter genau eine Frage: **„Ist das, was wir anzeigen, gerade belastbar?"**

- Macht **Datenfrische** sichtbar (wann zuletzt erfolgreich aktualisiert?).
- Macht **Quellenlücken/Ausfälle** sichtbar, statt die UI still mit altem oder kaputtem Wert weiterlaufen zu lassen.
- Liefert die Grundlage für **Stale-on-error** (alten guten Wert behalten, Zustand markieren).
- Ist die Persistenz-Schicht für die spätere **Plausibilitäts-Gate**-Entscheidung „Wert nicht still als normale Lage übernehmen" (§8).
- Speist die **Source-Registry** (Inventur §5) mit Laufzeit-Status.
- Schützt das **Vertrauensversprechen**: WachSam zeigt nie eine Zahl als „aktuell", die es nicht belegen kann.

`source_health` ist **kein** Newsfeed-Status und **keine** Fehler-Log-Tabelle — es ist ein **aktueller Zustand pro Quelle** plus minimaler Verlauf für Stale-/Alerting-Entscheidungen.

---

## 2. Warum eigene Struktur statt Spalten auf `indicators`

Entscheidung (Jean, 2026-06-03): **eigene Tabelle/Struktur**, nicht Spalten auf `indicators`.

| Grund | Erläuterung |
|-------|-------------|
| **Geltungsbereich** | Health betrifft nicht nur Indikatoren, sondern **alle** Quellen, Adapter, `facts`, `item_sources` und später Member-relevante Daten. Spalten auf `indicators` würden nur den Indikator-Pfad abdecken. |
| **Granularität** | Eine Quelle/ein Adapter kann **mehrere** Indikatoren oder Items speisen (z. B. Tankerkönig → E10 *und* Diesel). Health gehört an die Quelle/den Adapter, nicht redundant an jede Indikatorzeile. |
| **Trennung der Belange** | `indicators` modelliert die fachliche Größe (Schwellen, Zonen, Bedeutung). Betriebs-/Frische-Zustand ist eine **andere Belang-Ebene** und soll das fachliche Modell nicht aufblähen. |
| **Keine Migrationslast auf Kerntabellen** | Eine additive `source_health`-Tabelle berührt die bestehenden, produktiven Content-Tabellen nicht. |
| **Registry-Anbindung** | Eine eigene Struktur kann 1:1 mit der geplanten Source-Registry verbunden werden. |

---

## 3. Betroffene Entitäten

Health wird primär **am Adapter/an der Quelle** geführt und auf die abhängigen Datenobjekte bezogen:

| Entität | Bezug zu source_health |
|---------|------------------------|
| **`adapter_id`** | Primärer Schlüssel des Zustands (1 Adapter = 1 Health-Datensatz). Existiert heute nur implizit als Adapter-Klassenname (`name`) — in der Registry zu formalisieren. |
| **`source_id`** | Quelle hinter dem Adapter (`sources`-Registry / `item_sources.sourceUrl`). Ein Adapter kann auf eine source_id zeigen. |
| **`indicators`** | Abhängig: ein Indikator-Badge in der UI liest den Health-Status des speisenden Adapters (z. B. `wi-kraftstoffpreis-*` ← Tankerkönig). |
| **`facts`** | Abhängig: Fakten tragen `sourceUrl`/`sourceStand`; ihr Frische-/Belastbarkeitshinweis kommt aus dem Health-Status der Quelle. |
| **`item_sources`** | Verbindet Content-Items mit Quellen; Health hängt an der Quelle, nicht am einzelnen item_source-Eintrag. |

**Kein** Health-Feld auf jeder Content-Zeile — stattdessen Lookup `Item → Quelle/Adapter → source_health`.

---

## 4. Statuswerte

| Status | Bedeutung | Auslöser |
|--------|-----------|----------|
| `fresh` | Letzter erfolgreicher Abruf innerhalb des Frische-Fensters, Daten valide | erfolgreicher Lauf, Wert plausibel |
| `stale` | Frische-Fenster überschritten — keine neuen Daten, aber kein harter Fehler | kein Update seit X, Quelle „still" |
| `error` | Quelle nicht erreichbar / HTTP-Fehler / Parsing-Fehler / Fallback-Item | Adapter-Exception, Non-200, leeres/ungültiges Ergebnis |
| `disabled` | Quelle/Adapter bewusst deaktiviert | z. B. `eurostat` (Stub), `warning_indicators` (redundant) |
| `unknown` | Noch nie geprüft / kein Health-Datensatz vorhanden | Default vor erstem Check |
| `anomaly` | Wert außerhalb Plausibilitätsgrenzen oder Schwellenriss | gesetzt durch Plausibilitäts-Gate (§8, **später**) |

**Frische-Fenster** ist pro Quelle definierbar (z. B. Spritpreise stündlich/täglich, VPI monatlich). Die konkreten Fenster werden mit der Registry festgelegt, **nicht in W4**.

---

## 5. Zeit-/Stand-Felder — Begriffsklärung (zentral)

Diese vier Begriffe werden heute teils vermischt (u. a. synthetischer `source_stand` aus `now`, `db.py:141/162`). Klare Trennung:

| Feld | Bedeutet | Wer setzt es | Beispiel | Ort heute |
|------|----------|--------------|----------|-----------|
| **`source_stand`** | **Fachlicher Stand/Periode** der Quelldaten selbst | Adapter aus dem realen Quelldatum | „VPI Mai 2026", „Gasstand 2026-05-27" | `facts.sourceStand`, `item_sources.sourceStand`, `indicator_observations.source_stand` |
| **`retrieved_at`** | Zeitpunkt der **redaktionellen Abruf-/Verifikation** | Redaktion/System | 2026-05-28 | `facts.retrievedAt`, editorial-Helper |
| **`last_ingested_at`** | Letzter **technischer Adapter-Lauf, der Daten geschrieben** hat | Adapter | 2026-06-03 06:00 | `indicators.lastIngestedAt`, `IngestionItem` |
| **`last_checked_at`** *(neu, source_health)* | Letzter **Health-Check-Lauf**, unabhängig davon ob neue Daten kamen | Health-Check | 2026-06-03 12:00 | — (fehlt) |

Zusätzlich sinnvoll in `source_health`: **`last_success_at`** = letzter Check mit validen, erfolgreich verarbeiteten Daten.

**Kernunterschiede:**
- `last_checked_at` ≠ `last_ingested_at`: Ein Check kann laufen und „error/stale" feststellen, **ohne** zu ingestieren. `last_ingested_at` ändert sich nur bei erfolgreichem Schreiben.
- `source_stand` ist **fachlich** (welche Periode), nicht technisch (wann abgerufen). Er darf **nie** synthetisch aus `now` entstehen, wenn der reale Quellenstand nicht `now` ist (→ separater `source_stand`-Fix, siehe §9 / Inventur).
- `stale` leitet sich aus `source_stand`/`last_success_at` + Frische-Fenster ab, nicht aus `last_checked_at`.

---

## 6. Stale-on-error-Verhalten

Prinzip (WorldMonitor-Inspiration, konzeptionell): **Eine ausgefallene Quelle bricht nicht die UI — sie wird als Lücke sichtbar.**

1. **Letzten guten Wert behalten.** Bei Fehler/Non-200/Parsing-Fehler wird der bestehende `current_value` **nicht** mit einem kaputten/leeren Wert überschrieben.
2. **Status setzen:** `source_health.status = error` (Quelle weg) bzw. `stale` (nur veraltet).
3. **Kein Fehler als Wert.** Niemals „0", „null", „—" oder eine Exception als angezeigten Zahlenwert.
4. **Fallback-Items markieren.** Heute liefern manche Adapter (z. B. BNetzA) bei Fehler ein Fallback-Item mit `confidence=niedrig` — solche Läufe gelten als `error`/`stale`, nicht als Erfolg (heutiger Stolperstein: „Erfolg trotz Fehler", Inventur).
5. **`consecutive_failures` zählen** für Alerting (z. B. ab 2 konsekutiven Fehlern eskalieren — Schwelle später festzulegen).

---

## 7. UI-Verhalten bei Datenlücke

Die Public-UI zeigt **immer den letzten belegbaren Stand plus einen ehrlichen Frische-/Belastbarkeits-Hinweis** — nie eine kaputte Kachel.

| source_health | UI-Anzeige (Vorschlag) |
|---------------|------------------------|
| `fresh` | Wert + „Stand: \<source_stand\>" |
| `stale` | Wert + Badge „Daten älter als erwartet — Stand: \<source_stand\>" |
| `error` | Letzter Wert + Badge „Quelle aktuell nicht belastbar" |
| `disabled` | Indikator ausgeblendet oder „derzeit nicht erfasst" |
| `unknown` | „noch keine Daten" (kein Pseudowert) |
| `anomaly` | Wert + „Wert aktualisiert, Einordnung in Prüfung" (siehe §8) |

Regeln: keine PII, keine Roh-Slugs, kein technischer Fehlertext für Bürger. Die Anzeige bleibt im ruhigen WachSam-Ton. Konkrete UI-Texte werden mit der Umsetzung final formuliert, **nicht in W4**.

---

## 8. Zusammenhang mit dem Plausibilitäts-Gate

`source_health` ist die **Persistenz-/Anzeige-Schicht**, das Plausibilitäts-Gate (siehe [fact-to-impact-plan.md §6](./fact-to-impact-plan.md)) ist die **Entscheidungs-Logik**. Zusammenspiel (Soll, **nicht in W4 gebaut**):

1. Adapter liefert neuen Messwert.
2. Plausibilitäts-Gate prüft (Grenzen, Delta, Quellenstatus).
3. **Plausibel** → Messwert fließt live; `source_health = fresh`.
4. **Grenzverletzung/Schwellenriss** → `source_health = anomaly`, Wert **nicht** still übernehmen, **Review-Draft** erzeugen, UI „Einordnung in Prüfung".
5. **Quelle fehlerhaft/stale** → `source_health = error`/`stale`, Stale-on-error (§6).

**Wichtig: In W4 wird keine Plausibilitätslogik implementiert.** W4 definiert nur, dass `anomaly` existiert und vom späteren Gate gesetzt wird.

---

## 9. Rollout-Reihenfolge

| Schritt | Inhalt | Art | Freigabe |
|---------|--------|-----|----------|
| **W4 (dieses Dokument + ADR-040)** | Zweck, Struktur-Entscheidung, Status, Felder, Verhalten | reine Doku/ADR | — |
| **`source_stand`-Fix** | realer Quellenstand statt `now` (db.py) | kleiner Code + Test | separat, vor Plausibilitäts-Welle |
| **W4b (später)** | Migration: additive `source_health`-Tabelle | Migration | **eigene Freigabe** (Drizzle: generate, nie migrate) |
| **W4c (später)** | Read-only Health-Check-Funktion pro Adapter (schreibt source_health) | Code + Tests | nach Migration |
| **W7 (später)** | UI-Badges (fresh/stale/error/Datenlücke) | Web-Code | — |
| **W6 (später)** | Verbindung zum Plausibilitäts-Gate (`anomaly`) | Code | eigene Welle |

**Keine** Migration und **kein** Code in W4. Reihenfolge bewusst: erst Struktur-Entscheidung (W4), dann der kleine Vertrauens-Fix (`source_stand`), dann optionale Tabelle, dann Logik.

---

## 10. Offene Punkte (für Jean, später)

- Frische-Fenster pro Quelle (stündlich/täglich/monatlich) — wo definiert (Registry-Tabelle vs. Config)?
- `consecutive_failures`-Schwelle für Alerting + Kanal (Resend?).
- Health-Check-Trigger: im Ingestion-Lauf mitlaufen oder separater Job?
- Genaue UI-Texte/Badges (mit Brand-/Ton-Vorgaben).

**W4 endet hier — reine Dokumentation. Nächster Schritt laut Freigabe: Commit `docs(intelligence): plan source health model`, dann kleiner `source_stand`-Fix, dann W5 (Fact-to-Impact-Draft-Validierung).**
