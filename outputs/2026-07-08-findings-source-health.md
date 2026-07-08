# Source Health 2026-07-08

- Scope: `v02/intelligence` Source-Health, Adapter, Evidence-/Editorial-Gates, read-only.
- Missing context: `.remember/next-session-brief.md` fehlt im aktuellen Worktree.

## Checks

- `cd v02/intelligence && python -m pytest tests/ -q`
  - Result: `230 passed, 3 skipped, 11 deselected`
- `cd v02/intelligence && python -m pytest tests/ -m live -q`
  - Result: `9 passed, 2 skipped, 233 deselected`
- `cd v02/intelligence && python -m src.main --dry-run --allow-fetch`
  - Result: read-only Live-Dry-Run ohne DB-Writes erfolgreich

## Aktive Pfade

- Adapter: `v02/intelligence/src/adapters/*.py`
- Source Health: `v02/intelligence/src/source_health.py`
- Freshness/Registry: `v02/intelligence/src/freshness.py`, `v02/intelligence/source_registry.yaml`
- Evidence/Fetch: `v02/intelligence/src/evidence.py`, `v02/intelligence/src/fetchers/article_fetcher.py`
- Gates: `v02/intelligence/src/gate.py`, `v02/intelligence/src/relevance_gate.py`, `v02/intelligence/src/validation.py`

## Reproduzierbare Befunde

1. Destatis VPI degraded.
   - Dry-Run log: `VPI fetch failed: GENESIS HTTP 401`
   - Effekt: Fallback-Draft `"Verbraucherpreisindex (VPI) — Datenquelle prüfen"` statt frischem Messwert.

2. Arbeitslosigkeit degraded.
   - Dry-Run log: `Arbeitslosigkeit fetch: HTTP 401`
   - Effekt: Fallback-Draft `"Registrierte Arbeitslose Deutschland — Datenquelle prüfen"`.

3. GIE/AGSI degraded.
   - Dry-Run log: `GIE API: Status 200`
   - Effekt: Adapter liefert Shadow/C4 `parsing_error`, letzter gültiger Wert bleibt erhalten.
   - Hinweis: Symptom spricht für Response-Body-/Auth-Problem trotz HTTP 200.

4. API-key-gebundene Adapter lokal nicht prüfbar.
   - Dry-Run logs: `EIA_API_KEY nicht gesetzt`, `FRED_API_KEY nicht gesetzt`, `TANKERKOENIG_API_KEY nicht gesetzt`
   - Effekt: EIA/FRED erzeugen nur `Datenquelle prüfen`-Fallbacks, Tankerkönig liefert `0 Items`.

5. RSS/LLM nur teilweise verifiziert.
   - Dry-Run logs: `Tagesschau: 10 Items`, `Handelsblatt: 0 Items`, `GOOGLE_CLOUD_PROJECT nicht gesetzt — Skip`
   - Effekt: Crawl ok für Tagesschau, Handelsblatt weiterhin faktisch inaktiv, LLM-Evidence-Pfad lokal ohne GCP-Projekt nicht ausführbar.

6. Threshold-/Source-Health-Abdeckung bleibt lückenhaft.
   - Mehrere akzeptierte Indikatoren loggen `keine DB-Schwellen ... — C3 übersprungen`.
   - Betroffen im Dry-Run u.a. FAO, Pegelonline, DWD, NINA, BIP, EZB, Staatsschulden, Insolvenzen.

## Positive Signale

- Pegelonline, DWD, NINA, BIP, EZB, Staatsschulden, Insolvenzen lieferten im heutigen Dry-Run valide Datensätze.
- Test-Suite für Source-Health-/Registry-/Gate-Pfade ist vollständig grün.

## Nächste Schritte

- Destatis-/Arbeitslosigkeit-401 gegen aktuelle GENESIS-Zugriffspfade oder Credential-Anforderungen prüfen.
- GIE/AGSI-Response-Body bei HTTP 200 auf Auth-/Payload-Fehler verifizieren.
- Lokale Secrets für `EIA_API_KEY`, `FRED_API_KEY`, `TANKERKOENIG_API_KEY`, `GOOGLE_CLOUD_PROJECT` nur in untracked Env bereitstellen, wenn echte Live-Prüfung gewünscht ist.
- Fehlende Schwellen für produktive Indikatoren priorisieren, damit C3/C4 nicht nur advisory bleibt.
