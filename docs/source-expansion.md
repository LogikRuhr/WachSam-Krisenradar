# WachSam Source Expansion

Stand: 2026-06-09

## Kurzbefund

Die Datenbasis ist **teilstabil**. Der Intelligence-Core hat Dry-Run, Editorial-Gate, Plausibilitäts-Shadow-Logs, mehrere getestete Adapter und eine maschinenlesbare Source Registry. Für einen belastbaren Krisenradar fehlen aber noch zwei Fundamente:

1. persistente Source-Health-/Freshness-Sicht,
2. robuste Retry-/Stale-on-error-Logik für transiente Quellenfehler.

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
- Alle sechs aktiven Indikatoradapter lieferten verwertbare Werte: Destatis, BNetzA/GIE, EIA, FRED, FAO, Tankerkönig.
- Destatis GENESIS liefert DATENCSV als ZIP; der Adapter dekodiert das ZIP und parst Jahr/Monat-Zeilen.
- Aktive Indikatoradapter setzen `source_stand_date`, `source_stand_label` und `source_period_type`.
- RSS/LLM bleibt Editorial-Draft-Pfad; Vertex meldete zeitweise 429-Quota, ohne den Indikatorpfad zu blockieren.

## Bewertung

### Stabil genug

- Dry-Run-/Read-only-Schutz vorhanden.
- Public-UI filtert Content-Items auf `published`.
- Indikatorwerte haben Plausibilitäts-Shadow-Logs.
- Adapter-Tests decken mehrere Parser- und Fehlerfälle ab.
- Destatis, GIE/BNetzA, EIA, FRED, FAO und Tankerkönig lieferten im Live-Dry-Run verwertbare Werte.
- Aktive Indikatoren tragen fachlichen Quellenstand statt nur technischem Abrufzeitpunkt.

### Noch nicht stabil genug

- `source_health` existiert nur als ADR/Plan, nicht persistent.
- Source Registry ist vorhanden, aber noch keine Laufzeit-/DB-Registry.
- `source_health`/Stale-on-error ist noch nicht persistent.
- Einige wichtige Quellen sind noch nicht geklärt: SMARD, BfArM, RKI; GIE/BNetzA braucht Retry-/Timeout-Härtung.
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

1. GIE/BNetzA mit Retry-/Timeout-Härtung und später Source-Health absichern.
2. Danach erster neuer P0-Adapter: Pegelonline oder DWD.
3. SMARD/ENTSO-E erst nach Doku/Auth-/Nutzungsbedingungen.

## Entscheidung

Die Basis ist **teilstabil**: gut genug für den nächsten eng begrenzten Adapter-Schritt (Pegelonline oder DWD) und Frontend-/Editorial-Transparenz, aber noch nicht gut genug für großflächige Adapter-Masse ohne Source-Health.
