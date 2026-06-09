# WachSam Source Expansion

Stand: 2026-06-08

## Kurzbefund

Die Datenbasis ist **nicht vollständig stabil**. Es gibt einen funktionierenden Intelligence-Core mit Dry-Run, Editorial-Gate, Plausibilitäts-Shadow-Logs und mehreren getesteten Adaptern. Für einen belastbaren Krisenradar fehlen aber noch drei Fundamente:

1. eine explizite Source Registry,
2. persistente Source-Health-/Freshness-Sicht,
3. reparierte oder klar deaktivierte instabile Adapter/Endpoints.

Dieser Schritt baut bewusst **noch keinen neuen Adapter** und ändert keine Datenbank. Er normalisiert zuerst, welche Quellen WachSam kennt, welche Qualität sie haben und was als nächstes testbar ist.

## Realer Pipeline-Status

Verifiziert per read-only Dry-Run:

```bash
cd v02/intelligence
uv run --with-requirements requirements.txt python -m src.main --dry-run --allow-fetch
```

Ergebnis des Laufs:

- Dry-run schrieb nicht in die DB.
- 6 aktive Adapter im Plan: Destatis, BNetzA/GIE, EIA, FRED, FAO, Tankerkönig.
- RSS/LLM-Pfad lief read-only und erzeugte Draft-Pläne.
- Validierung fand bei allen Items fehlenden `source_stand` als Qualitätswarnung.
- Destatis VPI lieferte HTTP 401.
- BNetzA/GIE lief in einen Timeout und erzeugte Fallback.
- FRED fehlte ein API-Key und erzeugte Fallback.
- EIA, FAO und Tankerkönig lieferten verwertbare Werte.

## Bewertung

### Stabil genug

- Dry-Run-/Read-only-Schutz vorhanden.
- Public-UI filtert Content-Items auf `published`.
- Indikatorwerte haben Plausibilitäts-Shadow-Logs.
- Adapter-Tests decken mehrere Parser- und Fehlerfälle ab.
- EIA, FAO und Tankerkönig lieferten im Live-Dry-Run verwertbare Werte.

### Noch nicht stabil genug

- `source_health` existiert nur als ADR/Plan, nicht persistent.
- Source Registry war bisher nur als Doku-/Inventur-Tabelle vorhanden.
- `source_stand` ist oft unbekannt oder synthetisch.
- Einige wichtige Quellen sind instabil oder nicht geklärt: Destatis, GIE/BNetzA, FRED, SMARD, BfArM, RKI.
- Neue P0-Quellen aus dem Source-Gap-Audit sind noch keine Adapter: DWD, Pegelonline.
- `pyproject.toml` und `requirements.txt` waren nicht deckungsgleich: `apscheduler` stand nur in `requirements.txt`, obwohl `src/main.py` es importiert.

## Layer-Katalog

| Layer | Zweck | Aktive Quellen | Kandidaten | Status |
|---|---|---|---|---|
| Energie | Strom/Gas/Öl, Energiepreisdruck | GIE/AGSI, EIA, FRED | SMARD, ENTSO-E, BDEW | teilweise stabil |
| Preise/Finanzen | Inflation, Kaufkraft, Zinsen | Destatis VPI, FAO, Bundesbank-Kandidat | Dashboard Deutschland, Bundesbank | teilweise stabil |
| Mobilität | Kraftstoffpreise, Logistikdruck | Tankerkönig, EIA | Pegelonline/WSV für Wasserstraßen | stabil für Sprit |
| Wetter/Wasser | Hitze, Starkregen, Pegel, Hochwasser | — | DWD, Pegelonline | offen, P0 |
| Gesundheit/Versorgung | Arzneimittel, Infektionslage | RSS/Editorial | BfArM, RKI | research-needed |
| Arbeit/Industrie | Arbeitsmarkt, Industriebelastung | RSS/Editorial | BA Statistik, Dashboard Deutschland | research-needed |
| Gesellschaft/Infrastruktur | Lage-/Kaskadensignale | RSS/LLM + Editorial | DWD, Pegelonline, öffentliche Lagequellen | editorial-first |

## Nächste konkrete technische Schritte

### 1. Registry validieren

`v02/intelligence/source_registry.yaml` ist die maschinenlesbare Quelle für Adapterstatus, Layer, Auth, Format, Frische und Risiken. Tests müssen sicherstellen, dass Pflichtfelder vorhanden sind und Statuswerte aus dem Kanon stammen.

### 2. Source Health noch nicht migrieren

ADR-040 ist accepted, aber die Migration bleibt eine eigene Freigabe. Bis dahin liefert die Registry den statischen Soll-/Ist-Zustand; Laufzeit-Health bleibt Shadow-Log/Dry-Run.

### 3. Adapter-Reihenfolge

1. Bestehende instabile aktive Adapter klären: Destatis, GIE/BNetzA, FRED.
2. Danach erster neuer P0-Adapter: Pegelonline oder DWD.
3. SMARD/ENTSO-E erst nach Doku/Auth-/Nutzungsbedingungen.

## Entscheidung

Die Basis ist **brauchbar für Frontend-/Editorial-Transparenz**, aber **noch nicht stabil genug für großflächige neue Datenpipeline-Expansion**. Deshalb geht es zuerst mit Registry/Quality-Gates weiter, nicht mit blinder Adapter-Masse.
