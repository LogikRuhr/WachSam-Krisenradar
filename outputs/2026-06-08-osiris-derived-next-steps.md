# WachSam — Osiris-inspirierte nächste Schritte (2026-06-08)

Referenz: `https://github.com/simplifaisoul/osiris`

Geprüft per `gh repo view` und Kurz-Clone: Osiris ist ein MIT-lizenziertes Open-Source-OSINT-Dashboard mit Next.js/TypeScript/MapLibre, Live-Layern, API-Routen, Layer-Zählungen, Recon-Toolkit, News-/CCTV-/Fires-/Weather-/Seismic-/Telegram-/Sanctions-/Crypto-Layern. Lizenz ist deutlich offener als Worldmonitor (MIT statt AGPL), aber WachSam übernimmt trotzdem keine 1:1-UI, keine fremde Produktidentität und keine unpassende Recon-/Cyber-Dramatik.

## Ableitbare Muster für WachSam

### Geeignet

1. **Layer-Katalog statt Kartenlisten**
   - WachSam braucht kuratierte Layer: Energie, Wetter, Wasser, Gesundheit, Arbeitsmarkt, Versorgung, Preise.
   - Nicht als globale Spielzeugkarte, sondern als Deutschland-/Haushaltsfilter.

2. **Progressives Laden pro Layer**
   - Daten nur abrufen, wenn der Layer gebraucht wird.
   - Passt zu DWD/Pegelonline/BA/Bundesbank/SMARD.

3. **Entity-/Signal-Counts pro Layer**
   - Jede Rubrik zeigt Anzahl aktiver Signale, Quellen, Datenstand.
   - Macht App-Zustand sichtbarer.

4. **API-Routen als Adapter-Fassade**
   - Externe Quellen werden nicht direkt im UI benutzt.
   - Next/Python-Adapter liefern normalisierte, redaktionell gatebare Daten.

5. **Quellen-/Freshness-Monitor**
   - Quelle erreichbar, letzter Abruf, letzter Datenstand, Adapterstatus.
   - Passt direkt zu Welle 12.

### Nicht geeignet / bewusst weglassen

- Port Scanner, WHOIS, Crypto-Tracing, Recon-Toolkit.
- Globale Kriegs-/Alarmkarte als Hauptprodukt.
- 60fps-WebGL als Selbstzweck.
- CCTV-/Telegram-Scraping ohne klare DSGVO-/Ethik-/Quellenleitplanke.
- Dramatische OSINT-/Palantir-Ästhetik.

## Konkreter Plan

## Welle 13 — Source Registry + Layer-Katalog

**Ziel:** Aus dem Source-Gap-Audit wird eine WachSam-eigene Registry: Quelle → Layer → Status → Adapterfähigkeit → Haushaltsnutzen.

**Files:**

- ADD: `docs/source-expansion.md`
- ADD: `v02/intelligence/source_registry.yaml`
- CHANGE: `.remember/next-session-brief.md`

**Tasks:**

1. Registry-Schema definieren:
   - `id`
   - `name`
   - `layer`
   - `source_url`
   - `status`: `adapter-ready | research-needed | editorial-only | blocked-until-docs | unsuitable`
   - `format`
   - `auth_required`
   - `freshness_expectation`
   - `household_relevance`
   - `risk_notes`

2. Quellen aus `outputs/2026-06-08-source-gap-audit.md` eintragen:
   - DWD Open Data
   - Pegelonline
   - Dashboard Deutschland/Destatis
   - SMARD
   - ENTSO-E
   - BfArM
   - BA Statistik
   - Bundesbank
   - RKI
   - BDEW

3. Layer-Katalog dokumentieren:
   - Energie
   - Wetter/Extremwetter
   - Wasser/Hochwasser
   - Gesundheit/Versorgung
   - Arbeitsmarkt/Industrie
   - Preise/Finanzen
   - Infrastruktur/Logistik

4. Verify:
   - `python - <<'PY'` YAML laden und Pflichtfelder prüfen
   - `bash scripts/verify.sh`
   - `git diff --check`

**Commit:**

```bash
git add docs/source-expansion.md v02/intelligence/source_registry.yaml
git commit -m "docs: define WachSam source registry"
```

## Welle 14 — Erster echter Adapter: Pegelonline

**Ziel:** Ein kleiner, echter, testbarer Adapter statt breit angelegtem Datenmonster.

**Warum Pegelonline zuerst:**

- REST-Doku war erreichbar.
- Deutschland-Relevanz klar.
- Haushaltswirkung verständlich: Hochwasser, Mobilität, Versorgung, regionale Lage.
- Kein API-Key als erster Kandidat wahrscheinlich einfacher als ENTSO-E/SMARD.

**Files:**

- ADD: `v02/intelligence/adapters/pegelonline.py`
- ADD: `v02/intelligence/tests/test_pegelonline_adapter.py`
- CHANGE: `v02/intelligence/source_registry.yaml`
- Optional ADD: `outputs/2026-06-08-pegelonline-adapter-notes.md`

**Tasks:**

1. Minimalmodell definieren:
   - station id/name
   - water body
   - location
   - current level
   - timestamp
   - freshness status

2. Adapter nur für eine kleine Station-/Region-Auswahl bauen.

3. Tests zuerst:
   - HTTP-Response-Fixture oder monkeypatch für `requests`/`httpx`
   - Normalisierungstest
   - Freshness-Test
   - Fehlerfall-Test

4. Produktlogik bewusst klein halten:
   - noch keine Live-DB-Ingestion
   - noch kein UI-Layer
   - nur normalisierte Adapter-Ausgabe + Tests

5. Verify:
   - `cd v02/intelligence && python -m pytest tests/test_pegelonline_adapter.py -q`
   - `bash scripts/verify.sh`
   - keine Mockdaten als Produktdaten committen

**Commit:**

```bash
git add v02/intelligence/adapters/pegelonline.py v02/intelligence/tests/test_pegelonline_adapter.py v02/intelligence/source_registry.yaml
git commit -m "feat(intelligence): add Pegelonline adapter"
```

## Welle 15 — Source/Freshness-Monitor im Admin

**Ziel:** Osiris-Muster „Layer health / counts / freshness" als ruhiger WachSam-Admin-Monitor.

**Files:**

- CHANGE: `v02/web/app/admin/page.tsx` oder ADD `v02/web/app/admin/sources/page.tsx`
- ADD: `v02/web/components/admin/SourceHealthTable.tsx`
- CHANGE: `v02/web/app/globals.css`

**Tasks:**

1. Source Registry serverseitig lesbar machen.
2. Admin-Tabelle anzeigen:
   - Quelle
   - Layer
   - Status
   - Auth nötig
   - Freshness-Erwartung
   - nächster Schritt
3. Keine Live-Abrufe aus dem Admin heraus.
4. Verify:
   - `cd v02/web && pnpm run typecheck && pnpm run lint && pnpm run build`
   - Browser-Smoke `/admin` oder neue Admin-Route, sofern Auth/Runtime erreichbar.

**Commit:**

```bash
git add v02/web/app/admin v02/web/components/admin v02/web/app/globals.css
git commit -m "feat(web): add source health admin view"
```

## Welle 16 — App-Layer UX auf Public-Seiten

**Ziel:** Nutzer sehen nicht nur Karten, sondern aktive Daten-Layer mit Counts und Stand.

**Files:**

- CHANGE: `v02/web/app/lagebild/page.tsx`
- ADD: `v02/web/components/LayerStatusPanel.tsx`
- CHANGE: `v02/web/app/globals.css`

**Tasks:**

1. `LayerStatusPanel` bauen:
   - Layername
   - Anzahl Signale
   - Quellenanzahl
   - letzter Datenstand
   - Status: aktiv / in Prüfung / editorial-only

2. Auf `/lagebild` oberhalb der Karten anzeigen.

3. Keine interaktive Karte in dieser Welle.

4. Verify:
   - `cd v02/web && pnpm run typecheck && pnpm run lint && pnpm run build`
   - Mobile-Smoke: kein horizontaler Overflow.

**Commit:**

```bash
git add v02/web/app/lagebild/page.tsx v02/web/components/LayerStatusPanel.tsx v02/web/app/globals.css
git commit -m "feat(web): add layer status panel"
```

## Reihenfolge

1. Welle 13: Registry/Layers als Fundament.
2. Welle 14: Pegelonline Adapter als erster echter Datenbeweis.
3. Welle 15: Source/Freshness-Monitor im Admin.
4. Welle 16: Public Layer Status im Lagebild.

## Entscheidungspunkt nach Welle 14

Wenn Pegelonline sauber läuft, DWD als zweiter Adapter. Wenn Pegelonline unerwartet hakelig ist, DWD-Produkt auswählen und dort weitermachen. SMARD/ENTSO-E erst nach Doku/Auth-Klärung.
