# Bericht: „Silent Documentary"-Datenmethodik angewandt auf WachSam

**Datum:** 2026-06-02 · **Fokus:** Datentechnik, nicht Video · **Status:** Recherche + IST-Analyse + Umsetzungsvorschlag

---

## 0. Kernbefund (TL;DR)

Die „Silent Documentary"-Strategie ist videoseitig irrelevant für WachSam — **aber ihr datentechnischer Kern ist exakt das, was WachSam sein will:** quantifizierte Kausalitätsketten („The Invisible Chain": Trigger → Latenz → Preistreiber → Konsequenz), belegt aus eigenen Zeitreihen.

**Die gute Nachricht:** WachSam hat den Unterbau bereits — `cascades` (mit `trigger`, `steps`, `time_to_impact`), explizite `causal_links` (`mitigates`/`context`), `indicators` mit Referenzwerten, und die `bereich`-verkettete Signal→Auswirkung→Maßnahme-Logik.

**Die ehrliche Lücke:** WachSams Kausalketten sind heute **redaktionell behauptet, nicht datengemessen.** Konkret fehlen drei Dinge, ohne die „Invisible Chain" nur Narrativ bleibt:
1. **Echte Zeitreihen-Historie** — Adapter überschreiben `current_value`/`previous_value`, es gibt **kein** Zeitreihen-Archiv. Ohne Historie keine messbaren Lags.
2. **Gemessene Latenz** statt behaupteter (`time_to_impact: "wochen"` ist Freitext, kein empirischer Lag).
3. **Vorprodukt-Datenquellen** für die mittleren Kettenglieder (Dünger, Gaspreis Europa, Handelsflüsse).

Alle drei sind mit **kostenlosen, lizenzfreien Quellen** und WachSams bestehendem Schema schließbar. Eine Kaskade (Energie→Dünger→Lebensmittel) ist **sofort voll datengetrieben** umsetzbar und wird unten als Flaggschiff ausgearbeitet.

**Ehrliche Abgrenzung:** Nicht jede Kaskade aus dem Strategiepapier ist datentauglich. Die AMOC/Aerosol-Kaskade gehört **nicht** in ein Haushalts-Krisenradar (Lag = Jahre–Dekaden, wissenschaftlich umstritten). Details in §5/§10.

---

## 1. Die Übertragung: Was die Methodik datentechnisch *wirklich* ist

Streicht man Video, B-Roll und Veo, bleibt vom Strategiepapier ein einziger verwertbarer Kern:

> **Eine Engine, die aus eigenen Zeitreihen physische Ursache-Wirkungs-Ketten rekonstruiert und die Zeitverzögerung zwischen Auslöser und Haushaltswirkung *misst* statt behauptet.**

Das „Faceless / keine Meinung"-Prinzip ist datentechnisch übersetzt: **Jede Aussage hat eine Quelle und einen messbaren Beleg.** Genau das hebt WachSam von Newslettern und Meinungs-Kanälen ab — und genau das ist WachSams DSGVO-konforme Stärke (nur aggregierte Marktdaten + anonymisierte Scores, keine PII).

| „Invisible Chain"-Stufe | Datentechnische Entsprechung in WachSam |
|---|---|
| **1. Trigger** | Schwellwert-Überschreitung / Event in einer *Upstream*-Zeitreihe (z. B. Erdgas Europa > Referenzband) |
| **2. Latenz** | Empirisch **gemessener** Lag zwischen Upstream- und Downstream-Indikator (Cross-Correlation / Granger / Distributed-Lag) |
| **3. Preistreiber** | Die *mittleren* Indikatoren der Kette = Vorprodukte (Ammoniak, Harnstoff, DAP) als eigene Zeitreihen |
| **4. Konsequenz** | Endverbraucher-Indikator (VPI, Spritpreis, FAO FPI) = WachSams `haushaltswirkung` |

WachSam besitzt bereits die `bereich`-Dimension (energie, lebensmittel, mobilitaet, industrie, logistik, finanzen …) und das `steps`-JSONB in `cascades` — die Kette ist heute **narrativ** da. Sie muss nur an **gemessene Kanten** zwischen Indikatoren gebunden werden.

---

## 2. IST-Gap-Analyse (WachSam v02, verifiziert am Code)

| Baustein | IST-Zustand | Lücke für „Invisible Chain" |
|---|---|---|
| `cascades.trigger` | Freitext | OK als Label, aber nicht an Daten-Event gebunden |
| `cascades.steps` (JSONB) | Narrative 4-Schritt-Kette, betroffene Systeme als Strings | Kein Schritt ist an einen Indikator/Lag gebunden |
| `cascades.germany_relevance.time_to_impact` | Freitext („wochen") | **Behauptete** Latenz, nicht gemessen, nicht querybar |
| `causal_links` (cost/supply/action) | Echte Relationen `{targetType, targetId, relation}` | Nur redaktionell, Relation = `mitigates`/`context`, keine Stärke/Lag |
| `indicators` | `current_value` + `previous_value` + Referenzwerte (baseline/crisis/recent) | **Nur 2 Zeitpunkte.** Kein Zeitreihen-Archiv → Lag-Messung unmöglich |
| Ingestion-Adapter (7×) | Überschreiben current/previous bei jedem Lauf (06:00/18:00 UTC) | **Historie geht verloren** — der zentrale Blocker |
| `item_sources` | Quelle + Stand pro Item | **Bereits vorhanden** — ideal für Quelltransparenz pro Kante |
| Editorial-Gate (0005) | draft → approved → published, Audit-Log | **Bereits vorhanden** — gemessene Lags werden Vorschläge, Redaktion approved |

**Fazit:** WachSam ist architektonisch ~70 % am Ziel. Der fehlende 30 %-Block ist mechanisch klar: *Zeitreihe speichern → Lag messen → Kante als Daten ablegen → an Kaskaden-Step binden.*

---

## 3. Die Methodik als Datenpipeline

### 3.1 Latenz messen (das Herzstück)

Aus der Recherche (siehe Quellen) gelten methodisch belastbar:

1. **Nicht auf Rohpreisen rechnen** — Preiszeitreihen sind nicht-stationär. Stattdessen **Log-Returns** (`ln(p_t / p_{t-1})`), die näherungsweise stationär sind. Erst dann ist Cross-Correlation aussagekräftig.
2. **Cross-Correlation Function (CCF)** zwischen Upstream- und Downstream-Log-Returns: Das Maximum bei einem **positiven Lag k** zeigt „Upstream läuft Downstream um k Perioden voraus". → Das ist die gemessene Latenz.
3. **Granger-Kausalität** als zusätzlicher Filter: testet, ob die Upstream-Reihe die Downstream-Reihe *prädiktiv verbessert*. Wichtig: Granger ≠ physische Kausalität — es ist **prädiktive Vorlauf-Beziehung**. Genau so muss WachSam es labeln (nie „verursacht", sondern „läuft voraus / Frühindikator").
4. **Distributed-Lag / ADL-Modelle** für die Stärke der Weitergabe (Pass-Through-Quote: Wie viel % einer Upstream-Bewegung kommt unten an?).

**Output pro Kante:** `measured_lag`, `strength` (Korrelation/Pass-Through), `method`, `p_value`, `n_observations`, `last_estimated_at` → daraus ein **Confidence-Tier** (niedrig/mittel/hoch), das WachSams bestehendes `confidence`-Enum füllt.

### 3.2 Das Trigger-Event

Ein „Trigger" ist datentechnisch eine Überschreitung des bestehenden Referenzbands (`threshold_warn`/`threshold_critical`, schon im `indicators`-Schema!) in einer Upstream-Reihe. WachSam hat die Schwellen bereits — sie müssen nur als Ketten-Auslöser interpretiert werden.

### 3.3 Vorhersage statt nur Beobachtung

Sobald ein gemessener Lag k existiert, wird WachSam **prädiktiv**: „Erdgas Europa hat vor 6 Wochen ein Trigger-Event gehabt; der gemessene Lag zu Lebensmittel-VPI beträgt ~8 Wochen → erhöhte Wahrscheinlichkeit einer Lebensmittel-Belastung in den nächsten ~2 Wochen." Das ist der eigentliche Produktsprung: von „was ist" zu „was kommt, mit Beleg".

---

## 4. Datenquellen-Erweiterung (verifiziert, kostenlos)

| Quelle | Was | Zugang / Auth | Cadence | Lizenz | Schließt Kettenglied |
|---|---|---|---|---|---|
| **World Bank „Pink Sheet" (CMO)** | Erdgas Europa, **Harnstoff, DAP, Phosphatgestein, Kalium**, Lebensmittel, Brent | Monatliches **Excel (XLS)**, stabile URL; kein API, CC-Lizenz | monatlich | CC | **Dünger/Vorprodukte** (heute komplett fehlend) |
| **FRED API (St. Louis Fed)** | 800k+ Reihen, u. a. **`PNGASEUUSDM` (Erdgas EU-Preis)**, PPI-Subindizes, viele Rohstoffe | **Free API-Key** (sofort), REST v2 | tägl./monatl. | frei | **Gaspreis Europa** (WachSam hat nur GIE-Füllstand %, keinen Preis); Industrie-PPI |
| **UN Comtrade API** | Handelsflüsse Export/Import, ~200 Länder, HS-Codes | Free Key: 100k Rec./Query, 500 Calls/Tag | monatlich (seit 2000) | frei | **Export-Stopp-Signale** (Düngemittel-/Agrarexporte) |
| **Eurostat Dissemination API** | HICP, PRODCOM (Industrieproduktion), Energie | kein Key | monatlich | frei | **Eurostat-Stub fertigstellen** (Code liegt schon, TODO) |
| **Copernicus EDO (CDI)** | Combined Drought Indicator, Agrar-Dürre EU | freier Download (Raster, 10-tägig, ab 2012) | 10-tägig | frei | **Agrar-Stress** (kurzer Lag zu Ernte/Preis) |
| **ENTSO-E Transparency** | Strom: Last, Erzeugung, grenzüberschr. Flüsse | Free Token (Registrierung) | stündl./tägl. | frei | **Strom/Versorgung** (ergänzt GIE-Gas) |

**Bereits aktiv in WachSam:** EIA (Brent), GIE/AGSI+ (Gas-Füllstand), TankerKönig (E10/Diesel), Destatis (VPI), FAO (FPI). → Die Erweiterung dockt sauber an.

**Wichtigster Quick-Win:** Pink Sheet (Dünger) + FRED `PNGASEUUSDM` (Gaspreis) — beide kostenlos/monatlich, sie schließen die mittleren Glieder der Flaggschiff-Kaskade.

---

## 5. Konkrete Kaskaden für WachSam — nach Datentauglichkeit gestaffelt

### Tier A — voll datengetrieben, jetzt machbar

**A1 · Energie → Mobilität (Pilot, Daten schon da)**
`Brent (EIA, täglich) → E10/Diesel (TankerKönig)`. WachSam hat beide Reihen — sobald Historie gespeichert wird, ist der Brent→Sprit-Lag (typisch ~1–2 Wochen) sofort messbar. **Idealer Proof-of-Concept** für die Lag-Engine.

**A2 · Stickstoff/Dünger-Kaskade (Flaggschiff der „Invisible Chain")**
```
Erdgas Europa (FRED PNGASEUUSDM)        ── Trigger ──
   → Harnstoff / DAP (World Bank Pink Sheet)   ── Preistreiber, Lag messbar ──
      → FAO Food Price Index (schon aktiv)     ── Preistreiber ──
         → VPI Lebensmittel (Destatis, schon aktiv)  ── Konsequenz/Haushalt ──
```
Alle vier Glieder aus **kostenlosen, monatlichen** Quellen. Jeder Pfeil = eine messbare Kante mit Lag + Pass-Through. Das ist die erste Kaskade, die WachSam **nicht behauptet, sondern beweist** — physisch (Erdgas ist Haber-Bosch-Feedstock) und statistisch.

### Tier B — teilweise, Proxy nötig, niedrigere Confidence

**B1 · Industrie/Petrochemie → Spezialchemie → Elektronik/Chip**
Öffentliche Endpreis-Zeitreihen für Spezialchemie/Chips sind dünn. Machbar nur über **Proxies**: PPI-Subindizes (FRED/Eurostat PRODCOM) + Comtrade-Handelsvolumina. Lags verrauscht. → In WachSam als Kaskade mit `confidence: niedrig` und klarem „Proxy-Kausalität"-Label führen, **nicht** als harte Vorhersage.

### Tier C — NICHT für ein Haushalts-Krisenradar (ehrliche Streichung)

**C1 · AMOC / Aerosol-Reduktion → Wetteranomalie → Agrar-Kollaps**
Wissenschaftlich umstritten, Lag = **Jahre bis Dekaden**, kein belastbares Near-Term-Signal für Haushalte. Eine solche Kette als „Kausalität" auszuspielen würde WachSams Seriositäts-Anspruch („keine Meinung") direkt verletzen.
**Stattdessen verwertbar:** Copernicus EDO liefert *aktuelle* Agrar-Dürre (CDI) mit **kurzem** Lag zu Ernteausfall→Preis. Das ist ein legitimer Frühindikator — **ohne** den spekulativen AMOC-Überbau. So holt WachSam den nutzbaren Daten-Kern und lässt die Hype-Kausalität weg.

---

## 6. Architektur-Vorschlag (auf WachSams Schema)

### 6.1 Neue Zeitreihen-Tabelle (der fehlende Block)
```sql
-- Append-only Beobachtungsarchiv (heute existiert nur current/previous)
CREATE TABLE indicator_observations (
  indicator_id  TEXT REFERENCES indicators(id),
  observed_at   TIMESTAMP NOT NULL,   -- Datum des Messwerts (nicht Abrufzeit)
  value         NUMERIC  NOT NULL,
  source_stand  TEXT,
  ingested_at   TIMESTAMP DEFAULT now(),
  PRIMARY KEY (indicator_id, observed_at)
);
```
→ **Adapter-Änderung:** statt `current_value` zu überschreiben, zusätzlich `INSERT … ON CONFLICT DO NOTHING` in `indicator_observations`. Ab Tag 1 wächst die Historie. (Pink Sheet/FRED liefern rückwirkende Historie sofort mit → kein Kaltstart-Jahr.)

### 6.2 Gemessene Kausal-Kanten
```sql
CREATE TABLE causal_edges (
  id                TEXT PRIMARY KEY,
  from_indicator    TEXT REFERENCES indicators(id),
  to_indicator      TEXT REFERENCES indicators(id),
  measured_lag_days INTEGER,         -- aus CCF
  strength          NUMERIC,         -- max. Korrelation / Pass-Through
  method            TEXT,            -- 'ccf' | 'granger' | 'adl'
  p_value           NUMERIC,
  n_observations    INTEGER,
  confidence        confidence,      -- bestehendes Enum, abgeleitet
  cascade_id        TEXT REFERENCES cascades(id),
  step_index        INTEGER,         -- bindet an cascades.steps[i]
  last_estimated_at TIMESTAMP,
  editorial_status  editorial_status -- bestehender Gate-Flow
);
```
→ Jeder narrative `cascades.steps[i]` bekommt damit einen **gemessenen Beleg**. `germany_relevance.time_to_impact` wird vom Freitext zum berechneten Wert.

### 6.3 Lag-Engine (im bestehenden `intelligence/`-Service)
Python-Modul, das nach jeder Ingestion läuft:
1. Lädt Beobachtungspaare (from/to) aus `indicator_observations`.
2. Log-Returns → CCF → bester Lag; optional Granger-Test; ADL für Pass-Through.
3. Schreibt/aktualisiert `causal_edges` als **draft** → Editorial-Gate approved.
Bibliotheken: `statsmodels` (Granger, ADL), `numpy`/`pandas` (CCF). Passt in den bestehenden APScheduler-Lauf.

### 6.4 DSGVO / Compliance
Alles aggregierte **Marktdaten** — keine PII, keine personenbezogenen Scores. Deckt sich mit der Hausregel „nur anonymisierte Scores". Confidence-Tiers statt Behauptungen. Quelltransparenz via bestehendes `item_sources`.

---

## 7. Methodische Leitplanken (die „keine Meinung"-Disziplin)

1. **Log-Returns, nicht Rohpreise** — sonst Scheinkorrelation durch Nicht-Stationarität.
2. **Granger = Vorlauf, nicht Beweis** — UI-Sprache: „Frühindikator / läuft voraus", nie „verursacht". Physische Plausibilität (Erdgas→Ammoniak) muss redaktionell danebenstehen.
3. **Multiple-Testing/Spurious** — Mindest-`n`, p-Schwelle, Out-of-Sample-Check; sonst findet man Lags im Rauschen.
4. **Scheinpräzision vermeiden** — Lags als Bänder („6–9 Wochen"), nicht als „57 Tage".
5. **Quelle + Stand pro Kante** — WachSam hat `item_sources` schon; konsequent nutzen.

---

## 8. Roadmap (an WachSams Next-Steps angedockt)

1. **`indicator_observations` + Adapter auf Append** — ohne Historie kein Lag. Pink Sheet/FRED liefern Rück-Historie → sofort nutzbar. *(Migration 0009, Adapter-Patch)*
2. **FRED-Adapter (`PNGASEUUSDM`) + Pink-Sheet-Adapter (Harnstoff/DAP)** — schließt die mittleren Glieder. *(2 neue Adapter analog zu eia.py)*
3. **Lag-Engine MVP an Brent→E10** — Daten schon da, schnellster Proof.
4. **Stickstoff-Kaskade (A2) als erste voll-datengetriebene „Invisible Chain"** — Flaggschiff, end-to-end belegt.
5. **Eurostat-Stub fertig + Comtrade** für Export-Stopp-Signale; EDO-Dürre als Agrar-Frühindikator (ohne AMOC).

Jeder Schritt ist isoliert lieferbar und nutzt WachSams bestehendes Editorial-Gate + Schema.

---

## 9. Owned-Assets / Monetarisierung (datenseitig, kurz)

Das Strategiepapier setzt auf „Owned Assets" (Newsletter, Deep-Dive-Reports, B2B). Datentechnisch ist WachSams Äquivalent stark: **kausal belegte Kaskaden-Reports** (z. B. „Stickstoff-Kaskade: gemessener Lag Erdgas→Lebensmittel-VPI, Stand Juni 2026") sind ein verkaufbares B2B-Asset für Entscheidungsträger/Fachkräfte — weil sie *belegt* statt *gemeint* sind. Das ist Ableitung aus der Daten-Engine, kein Zusatzaufwand.

---

## 10. Kritische Würdigung (was schiefgehen kann)

- **Garbage-in:** Dünne/lückenhafte Historie → instabile Lags. Gegenmittel: Rück-Historie aus Pink Sheet/FRED, Mindest-`n`.
- **Overfitting der Lags:** Bei vielen Indikatorpaaren findet man immer *irgendeinen* signifikanten Lag. Gegenmittel: nur physisch plausible Paare testen (Theorie-getrieben, nicht Brute-Force), Out-of-Sample.
- **Scheinpräzision/Autoritäts-Falle:** Eine Zahl wirkt seriös, auch wenn sie Rauschen ist. Gegenmittel: Confidence-Tiers, Bänder, p-Werte sichtbar.
- **Der AMOC-Trap:** Die spektakulärste Kaskade des Papiers ist die datentechnisch unseriöseste. Wer sie ausspielt, riskiert den ganzen Seriositäts-USP. → Streichen, nur den EDO-Dürre-Kern behalten.
- **Aufwand vs. Nutzen:** Die Lag-Engine ist überschaubar (statsmodels), aber die *Daten-Disziplin* (Append-Historie, Quellpflege) ist Daueraufwand. Sie ist aber genau WachSams Burggraben.

---

## Quellen

- [World Bank Commodity Markets — Pink Sheet (Monatsdaten, XLS)](https://www.worldbank.org/en/research/commodity-markets)
- [World Bank Commodities Price Data (Pink Sheet) — Dokumentenportal](https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/world-bank-commodities-price-data-the-pink-sheet)
- [FRED API — St. Louis Fed (v2, free key)](https://fred.stlouisfed.org/docs/api/fred/)
- [FRED — Global price of Natural gas, EU (PNGASEUUSDM)](https://fred.stlouisfed.org/series/PNGASEUUSDM)
- [FRED — Producer Price Index by Commodity: All Commodities (PPIACO)](https://fred.stlouisfed.org/series/PPIACO)
- [UN Comtrade — Datenbank & API](https://comtrade.un.org/)
- [UN Comtrade — Python-Client (comtradeapicall)](https://github.com/uncomtrade/comtradeapicall)
- [Copernicus European Drought Observatory — Indikator-Download](https://drought.emergency.copernicus.eu/tumbo/edo/download/)
- [Copernicus EDO — Combined Drought Indicator Factsheet](https://drought.emergency.copernicus.eu/data/factsheets/factsheet_combinedDroughtIndicator_v4.pdf)
- [Granger causality — Übersicht (Wikipedia)](https://en.wikipedia.org/wiki/Granger_causality)
- [Lead-Lag & Granger Causality — methodische Einordnung (Log-Returns/Stationarität)](https://quantjourney.substack.com/p/moving-beyond-correlation-hunting)
- [Lag Relationships and Nonlinear Granger Causality (MDPI Entropy)](https://www.mdpi.com/1099-4300/24/3/378)

*Hinweis: Mengen-/Lizenzangaben der Quellen Stand Juni 2026; vor Produktivnutzung jeweils Terms-of-Use prüfen (insb. Comtrade-Limits, Pink-Sheet-Attribution).*
