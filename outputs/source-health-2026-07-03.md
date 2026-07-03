# Source Health Report — 2026-07-03

## Scope

- Doku gelesen: `docs/product-current.md`, `docs/methodology.md`, `docs/verification.md`, `docs/testing.md`
- `.remember/next-session-brief.md` fehlt in diesem Worktree
- Intelligence-Checks:
  - `cd v02/intelligence && python -m pytest tests/ -q`
  - `cd v02/intelligence && python -m src.main --dry-run --allow-fetch`

## Verify

- `python -m pytest tests/ -q` → `215 passed, 3 skipped, 11 deselected`
- Read-only Live-Probe lief ohne DB-Writes; `WACHSAM_SOURCE_HEALTH_PATH` auf temporäre JSONL gesetzt

## Reproduzierbare Befunde

- `DestatisAdapter` (`wi-inflation-vpi-de`) meldete am 2026-07-03 `GENESIS HTTP 401`; Fallback-Item wurde erzeugt, Source Health `degraded`, `freshness_status=source-error`.
- `ArbeitslosigkeitAdapter` (`wi-arbeitslosigkeit-de`) meldete am 2026-07-03 `HTTP 401`; Fallback-Item wurde erzeugt, Source Health `degraded`, `freshness_status=source-error`.
- `BNetzAAdapter` (`wi-gasspeicher-fuellstand`) lieferte am 2026-07-03 eine `200`-Antwort mit unerwarteter Payload-Form; zuvor wurde das im Source Health fälschlich als gesund gezählt. Patch vorbereitet: Fehler wird jetzt als `unexpected_payload_shape` erfasst und der Health-Record korrekt als `degraded` geschrieben.
- `EIA`, `FRED`, `Tankerkoenig` waren in diesem Lauf ohne API-Keys nur read-only eingeschränkt nutzbar. Befunde: `api_key_missing`, keine erfundenen Daten, letzter guter Wert bleibt maßgeblich.
- `FAO` war erreichbar, aber Stand `2026-05`; Registry klassifiziert das am 2026-07-03 als `stale`.
- `BIP` lieferte `2026-Q1`; Registry klassifiziert das am 2026-07-03 als `stale`.
- `EZBLeitzins` lieferte Stand `2026-06-17`; Registry klassifiziert das am 2026-07-03 als `stale`.
- `Pegelonline` und `DWD` waren erreichbar und `fresh`.
- `Insolvenzen` war erreichbar und `acceptable-lag`.
- RSS-Probe: Tagesschau `10 Items`, Handelsblatt `0 Items`, LLM-Extraktion übersprungen weil `GOOGLE_CLOUD_PROJECT` nicht gesetzt.

## Patch-Status

- Vorbereitet, nicht committed:
  - `v02/intelligence/src/adapters/bnetza.py`
  - `v02/intelligence/tests/test_source_errors.py`
  - `v02/intelligence/tests/test_main.py`

