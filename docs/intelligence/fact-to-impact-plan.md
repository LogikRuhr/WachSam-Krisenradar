# WachSam — Fact-to-Impact-Plan (Welle 3, reine Planung)

**Stand:** 2026-06-03 · **Typ:** Planungsdokument, **keine Codeänderung**, **keine Migration**, **keine Schwellenlogik**. · **Basis:** [source-inventory.md](./source-inventory.md)

> Ziel: Wie aus einer Quelle / einem bestehenden Python-Skript / einem Rohdatenpunkt ein **redaktionell prüfbares WachSam-Item** wird — gemappt auf die **bestehenden** Drizzle-Tabellen. Es wird in dieser Welle nichts implementiert; dieses Dokument legt nur fest, *wohin* welche Daten gehören und *welche Lücken* vor einer Umsetzung geschlossen werden müssen.

---

## 0. Leitprinzipien (aus AGENTS-Vorgaben)

1. **Bestehende Strukturen zuerst.** Keine neue Tabelle, wenn vorhandene reichen. Bestehende Python-Skripte sind Source-of-Truth-Ingestion, nicht Altlast.
2. **Trennung der Ebenen.** Rohdaten ≠ Messwert ≠ redaktionelles Item ≠ Public-Item. Jede Ebene bleibt getrennt.
3. **Editorial-Gate ist Pflicht.** Zwischen Ingestion und Public-UI liegt immer eine redaktionelle Prüfung — **außer** für rein numerische Indikator-Messwerte unter der Plausibilitäts-Gate-Policy (§6, **noch nicht gebaut**).
4. **Kein LLM-Text und kein ungeprüftes Rohsignal direkt in die Bürgeroberfläche.**

---

## 1. Zielprozess (Soll-Kette)

```
Quelle / Python-Adapter / Rohdatenpunkt
   │
   ├── (A) numerischer Messwert ──► indicators.current_value  +  indicator_observations (Zeitreihe)
   │                                   └─ Plausibilitäts-Gate-Policy (§6) entscheidet: live oder Review-Draft
   │
   └── (B) Meldung / RSS / LLM-Extraktion ──► belegbarer Fakt (facts)
                                                  │
                                                  ▼
                                    redaktionelles WachSam-Item (Entwurf)
                                    = cascades / cost_impacts / supply_risks /
                                      lagebild_items / governance / citizen_actions
                                    mit editorial_status = 'draft'
                                                  │
                                          Editorial-Gate (draft → approved → published)
                                                  │
                                                  ▼
                                    Public-UI (nur editorial_status = 'published')
                                                  │
                                                  ▼
                                    Member-Personalisierung (nur published Items, später)
```

**Kernunterscheidung:**
- **Pfad A (Messwert):** Zahlen aus den 6 aktiven Adaptern. Werden *gemessen*, nicht *redaktionell verfasst*. Landen in `indicators`/`indicator_observations`.
- **Pfad B (Bedeutung):** Die Übersetzung „Was bedeutet diese Zahl/Meldung für deutsche Haushalte?" ist **immer** redaktionell und durchläuft das Gate.

---

## 2. Mapping: Quelle/Skript → Fakt → WachSam-Item

| Quelle / Skript | liefert | Ebene | Zielablage (bestehend) | Gate? |
|-----------------|---------|-------|------------------------|-------|
| `bnetza.py` (GIE) | Gasspeicher % | Messwert (A) | `indicators` (`wi-gasspeicher-fuellstand`) + `indicator_observations` | Plausibilitäts-Gate |
| `destatis.py` | VPI/Inflation | Messwert (A) | `indicators` (`wi-inflation-vpi-de`) + `indicator_observations` | Plausibilitäts-Gate |
| `eia.py` | Brent | Messwert (A) | `indicators` (`wi-oel-brent`) + `indicator_observations` | Plausibilitäts-Gate |
| `fred.py` | Erdgas EU | Messwert (A) | `indicators` (`wi-gaspreis-europa`) + `indicator_observations` | Plausibilitäts-Gate |
| `fao.py` | Food Price Index | Messwert (A) | `indicators` (`wi-fao-food-price-index`) + `indicator_observations` | Plausibilitäts-Gate |
| `tankerkoenig.py` | E10/Diesel | Messwert (A) | `indicators` (`wi-kraftstoffpreis-*`) + `indicator_observations` | Plausibilitäts-Gate |
| `rss_crawler.py` → `llm_extractor.py` | Meldung → strukturierter Entwurf | Bedeutung (B) | `facts` (Beleg) + `lagebild_items`/`cost_impacts`/… (Entwurf) | **Editorial-Gate (immer)** |
| manuelle Redaktion | Einordnung/Kaskade/Maßnahme | Bedeutung (B) | `cascades`/`cost_impacts`/`supply_risks`/`governance`/`citizen_actions` | **Editorial-Gate (immer)** |

**Regel:** Ein Adapter-Output (Pfad A) darf den *Messwert* aktualisieren, aber **niemals** automatisch eine neue *Haushaltsauswirkung/Maßnahme/Einordnung* (Pfad B) erzeugen oder veröffentlichen.

---

## 3. Feld-Mapping: WachSam-Item → bestehende Tabellen

Status: **vorhanden** / **teilweise** (unstrukturiert/inkonsistent) / **fehlt** (neue, additive Struktur nötig → eigener ADR + Freigabe).

| # | WachSam-Item-Feld | Bestehende Ablage | Status |
|---|-------------------|-------------------|--------|
| 1 | `source_fact` | `facts` + Verknüpfung via `fact_refs` / `lagebild_items.factIds` | teilweise (keine zentrale Impact-Item-Tabelle) |
| 2 | `source_id` / `item_sources` | `item_sources` (polymorph) + `sources` (Dedup) | vorhanden (neuer `itemType` ins Enum, falls neuer Item-Typ) |
| 3 | `entwicklung` | `lagebild_items.trend` / Indikator-Zeitreihe | teilweise (kein strukturiertes Feld) |
| 4 | `germany_relevance.direct` | `germanyRelevance` jsonb (cascades/indicators) | teilweise (untypisiert) |
| 4 | `germany_relevance.systems_affected` | nur frei in jsonb | **fehlt strukturiert** |
| 4 | `germany_relevance.time_to_impact` | `zeithorizont`-Enum (nicht als Subfeld) | teilweise |
| 5 | `systembereiche` (10er-Kanon) | `system`/`bereich`/`bezugZuBereich` gemischt | teilweise (kein normalisiertes Vokabular) |
| 6 | `haushaltsauswirkung` | `haushaltswirkung` (cascades/governance) | vorhanden |
| 7 | `maßnahme` | `citizen_actions` | vorhanden (lose verknüpft) |
| 8 | `confidence` (niedrig/mittel/hoch) | `confidence`-Enum auf cascades/cost/supply/lagebild/citizen | teilweise (fehlt auf indicators/facts) |
| 9 | `severity` (5-stufig) | `severity`-Enum (lagebild/supply) + `severityTrigger` (indicators) | vorhanden |
| 10 | `uncertainty` | `unsicherheit` (cost_impacts NOT NULL, supply_risks nullable) | teilweise (inkonsistent) |
| 11 | `editorial_status` | shared Enum auf 8 Content-Tabellen + `editorial_audit_log` | vorhanden |
| 12 | `source_health` | — | **fehlt komplett** (§5) |
| 13 | `member_relevance` | nur `households` (modus/plz/heizart), keine Verknüpfung | **fehlt komplett** (§7) |

**Schlussfolgerung:** ~70 % des WachSam-Items ist bereits abbildbar. **Genuine Lücken:** `source_health` (§5), `member_relevance` (§7) und eine konsistente, validierte `germany_relevance`/`systembereiche`-Struktur. Diese erfordern **additive** Strukturen — jeweils **eigener ADR-Vorschlag, keine sofortige Migration**.

---

## 4. Umgang mit `indicator_observations`

Bestehend (Migration 0009): `indicator_id` (FK), `observed_at`, `value`, `source_stand`, `ingested_at`; **PK `(indicator_id, observed_at)`** → idempotenter Append (`ON CONFLICT DO NOTHING`).

**Plan:**
1. **Zwei Orte, eine Wahrheit.** `indicators.current_value/previous_value` (denormalisiert, für UI-Schnellzugriff) bleibt der „Live-Wert"; `indicator_observations` ist die **historisierte Zeitreihe**. Bei jedem akzeptierten Messwert wird **beides** geschrieben (so wie heute in `db.py`), damit sie nicht auseinanderlaufen.
2. **`source_stand` ehrlich befüllen.** Heute synthetisch aus `now` (`db.py:141/162`). Soll: realer Datenstand der Quelle (`current_value_date`). → kleiner, klar abgegrenzter Folge-Fix (separat).
3. **Zeitreihe als Basis der Lag-Engine.** `lag_engine.py` erwartet genau Spalten `value`/`observed_at` — passt. Anbindung (Lag-Ergebnisse persistieren) ist **spätere** Welle, nicht hier.
4. **Kein Schema-Change nötig** für den reinen Messwert-Pfad — die Tabelle reicht.

---

## 5. `source_health`-Konzept (neu — Vorschlag, noch nicht vorhanden)

Heute existiert **keinerlei** Quellen-Gesundheit (weder `sources` noch `item_sources` haben Erreichbarkeit/Alter/Status). WorldMonitor-Inspiration (nur konzeptionell): Datenfrische sichtbar machen, Stale-on-error, Quellenlücken zeigen.

**Vorgeschlagenes Status-Enum:** `fresh` · `stale` · `error` · `disabled` · `unknown` (zusätzlich `anomaly` für Plausibilitäts-Verletzung, siehe §6).

**Zwei Umsetzungsoptionen (Entscheidung später, KEINE Migration jetzt):**

- **Option A — schlanke neue Tabelle `source_health`** (additiv, bestehende Tabellen unangetastet):
  `adapter_id` / `indicator_id`, `status`, `last_check_at`, `last_success_at`, `http_status`, `consecutive_failures`, `message`. Quelle der Wahrheit für UI-Badges „live/stale/error" und Alerting.
- **Option B — Spalten auf `indicators`** (`source_health` enum, `source_checked_at`): minimal, aber nur für den Indikator-Pfad; deckt RSS/Fakten nicht ab.

**Empfehlung:** Option A (eigene Tabelle), weil sie adapter- statt nur indikatorzentriert ist und damit auch die Source-Registry (§8 der Inventur) speisen kann. → **eigener ADR + Freigabe vor jeder Migration.**

**Ableitung des Status (Regelidee, später):** letzter erfolgreicher Abruf innerhalb des Frische-Fensters → `fresh`; überschritten → `stale`; HTTP-Fehler/Parsing-Fehler/Fallback-Item → `error`; Adapter deaktiviert → `disabled`.

---

## 6. Plausibilitäts-Gate-Policy für Indikator-Live-Werte

> **Status: dokumentierte Entscheidung (Jean, 2026-06-03). NICHT implementiert.** Die Schwellen-/Anomalie-Logik wird in dieser Welle **nicht** gebaut. Heute fließen Indikatorwerte unverändert wie zuvor.

**Grundsatz:** Messwerte dürfen automatisiert fließen. Bedeutung, Einordnung und Handlungsempfehlung gehen durchs Editorial-Gate.

**Automatisch aktualisierbar (numerisch), wenn alle Bedingungen erfüllt sind:**
- `current_value`, `current_value_date`, `previous_value`, `previous_value_date`
- `last_ingested_at`
- `source_health`
- reine numerische Anzeige + Append in `indicator_observations`

**Bedingungen (alle):**
1. Quelle in der Source-Registry als **aktiv/vertrauenswürdig** markiert,
2. Adapter und Datenformat **validiert**,
3. `source_id`, `source_stand`, `retrieved_at`/`last_ingested_at` **gesetzt**,
4. neuer Wert innerhalb definierter **Plausibilitätsgrenzen** (pro Indikator min/max — später festzulegen),
5. **Delta** zum Vorwert unauffällig (pro Indikator max-Delta — später festzulegen),
6. **keine** Parsing-/Source-Health-Fehler.

**Niemals automatisch geändert:**
- redaktionelle Texte, `haushaltsauswirkung`, `maßnahme`
- `severity` / Lage-Stufe, sofern öffentlich als redaktionelle Einordnung wirksam
- `published_at`, `editorial_reviewed_at`, `editorial_status`

**Bei Grenzverletzung / Schwellenriss (Warn/Kritisch) / fehlerhafter oder stale Quelle:**
- Wert **nicht** still als normale Lage übernehmen,
- `source_health` auf `stale`/`error`/`anomaly` setzen,
- **Review-Task / Draft-Hinweis** erzeugen,
- Public-UI zeigt: „Wert aktualisiert, Einordnung in Prüfung" bzw. „Quelle aktuell nicht belastbar",
- **keine** automatische neue Haushaltsauswirkung veröffentlichen.

**Heute-vs-Soll (Drift):** Heute aktualisiert `db.py` `indicators.current_value` ohne Plausibilitätsprüfung; die Public-UI zeigt den Wert, weil die Indikator-Zeile per Seed `published` ist. Die obige Policy ist die **Soll-Vorgabe**, deren Umsetzung eine spätere, explizit freizugebende Welle ist.

---

## 7. `member_relevance` — nur vorbereiten

Heute: `households` (anonym: `modus`, `plz`, `heizart`) ohne Verknüpfung zu Items. **In dieser Welle nichts bauen.** Nur festhalten:

- Personalisierung **filtert** published Items (z. B. `heizart=gas` → Gas/Heizkosten-Items priorisieren), **erzeugt keine** neuen Items.
- Member-Bereich greift **nur** auf `editorial_status='published'` zu — nie auf Rohquellen, LLM-Output oder ungeprüfte Ingestion.
- Spätere additive Struktur denkbar: Relevanz-Mapping `published Item ↔ Haushaltsmerkmal` (eigener ADR).
- Datenliefernde Quellen für Member-Nutzen: Spritpreise, Erdgas/Gasspeicher, VPI, FAO (alle bereits aktiv). Fehlend für echten Nutzen: regionale Granularität, Vertrags-/Tarifdaten (nicht Teil dieser Wellen).

Siehe geplantes `member-readiness-plan.md` (eigene Welle).

---

## 8. Abgrenzung — was diese Welle NICHT tut

- **Keine** Codeänderung (außer vorher explizit abgestimmt).
- **Keine** Migration (`source_health`, `member_relevance` etc. nur als Vorschlag).
- **Keine** Plausibilitäts-/Schwellen-/Anomalie-Logik implementiert.
- **Keine** neue Impact-Item-Tabelle ohne ADR + Freigabe.
- **Kein** neuer Crawler, kein Member-Feature, kein Editorial-UI-Umbau.

---

## 9. Offene Entscheidungen (für Jean)

1. **source_health:** Option A (neue Tabelle) oder B (Spalten auf indicators)?
2. **Impact-Item-Struktur:** bestehende Tabellen weiternutzen (empfohlen) oder zentrale `impact_items`-Tabelle einführen?
3. **germany_relevance/systembereiche:** typisierte Validierung (Enum/Check) gegen den 10er-Kanon — wann und wo (Pydantic + DB-Check)?
4. **`source_stand`-Fix** (real statt synthetisch): jetzt als kleiner Einzel-Fix oder mit der Plausibilitäts-Welle bündeln?

---

## 10. Vorgeschlagene nächste Wellen (Reihenfolge)

- **W3 (Doku, dieses Dokument):** Fact-to-Impact-Mapping + Policies dokumentiert. ✅
- **W4:** `source-health-plan.md` + ADR für `source_health`-Tabelle (Doku/ADR, keine Migration ohne Freigabe).
- **W5:** Fact-to-Impact-Draft-**Validierung** (Pydantic/Enum-Check gegen Kanon) — kleiner Code + Tests.
- **W6:** Plausibilitäts-Gate-Logik (Schwellen, Anomalie, Review-Draft) — eigene, explizit freizugebende Welle.
- **W7:** Public-UI-Vollständigkeit (nur vollständige published Items) + Source-Health-Badges.
- **W8:** Member-Readiness (nur published Items).

**Nächster kleinster Schritt:** `source-health-plan.md` als reine Doku/ADR — oder W5-Validierung, je nach Jeans Priorität.
