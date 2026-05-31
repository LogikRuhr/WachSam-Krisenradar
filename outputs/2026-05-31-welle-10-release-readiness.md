# WachSam Welle 10 — Release/Cutover-Readiness

Stand: 2026-05-31. Repo: `LogikRuhr/WachSam-Krisenradar`. Branch: `main`.
Bezug: `outputs/2026-05-30-next-steps-ui-ux-integration-plan.md` (10-Wellen-Plan).

## Zusammenfassung

v02 wurde auf Release-Readiness gebracht: CI prüft jetzt den echten Produktstand, ein adversarial verifiziertes Multi-Dimensionen-Audit hat 3 Blocker + 10 Major-Findings aufgedeckt, alle wurden behoben. Die Code-Basis ist freigabefähig. Verbleibend sind **operative Schritte, die nur der Betreiber ausführen kann** (Produktions-Deploy, Live-DB-Smoke, Secret-Setup) — diese sind keine Code-Mängel.

## 1. Foundation (Welle 1) — CI grün

- `.github/workflows/verify.yml`: jetzt drei Jobs — `source-gate` (`scripts/verify.sh`), `app-verify` (Node 22 + pnpm + `pnpm run verify`), `intelligence-verify` (Python 3.12 + `pytest`).
- `.github/workflows/deploy.yml`: `pnpm run verify` als Vorbedingung vor dem VPS-Deploy ergänzt (Welle 9: „Kein Deploy ohne pnpm verify").
- Lokal grün: `pnpm run verify` (tsc · eslint · next build · drizzle generate · seed dry-run · audit-invariants) und `pytest` (33 passed, 5 skipped).
- **Behobener Regressions-Bug:** `intelligence/tests/test_main.py` mockte den neuen `TankerkoenigAdapter` nicht → der Test machte einen echten API-Call und schlug fehl. Adapter jetzt wie alle anderen gemockt.

## 2. Release-Readiness-Audit

7 Dimensionen (DSGVO, Security, Accessibility, Alarmismus/Sprache, Daten-Logik, Story/Brand, Responsive), je Finding adversarial gegengeprüft. 24 Agents. Ergebnis: **3 Blocker, 10 Major, 16 Minor, 1 widerlegt**.

### Blocker (3/3 behoben)

| # | Dimension | Befund | Fix |
|---|---|---|---|
| B1 | DSGVO | Datenschutz behauptete „keine Drittlandübermittlung", obwohl Resend (US) die E-Mail-Adresse verarbeitet | Abschnitt 6 neu: Resend als Auftragsverarbeiter (Art. 28), AVV, Drittlandtransfer USA via EU-US DPF/SCC (Art. 46); pauschale Falschaussage entfernt |
| B2 | DSGVO/DDG | Impressum ohne ladungsfähige Postanschrift (nur JSX-Kommentar-Platzhalter) | Echte Anschrift aus den autoritativen Rechtsdokumenten eingetragen (Jean Schütz, RuhrLogik, Kantstraße 27, 46240 Bottrop) — Impressum + Datenschutz-Verantwortlicher |
| B3 | Security | `getSourceTrustLayer`/`getItemSources` leakten Quellen unveröffentlichter Drafts über `/quellen` + Detailrouten | `keepPublishedSources()` filtert `item_sources` gegen den `editorial_status` des Parent-Items (nur `published`) |

### Major (10/10 behoben)

- **a11y:** `aria-labelledby="page-title"` ohne Ziel-ID → `id="page-title"` auf SectionHeader-h1 ergänzt (war auf 5 Public-Seiten tot).
- **Alarmismus:** „Live"/„Live-Preis" aus den Kraftstoff-Indikatoren (`warning-indicators.json`, quelle + germany_relevance) entfernt — brand.md verbietet „Live" im sichtbaren UI.
- **Story/Brand:**
  - Lage-Headline zeigte den Markennamen statt der führenden Wirkungskette → speist jetzt aus `linkedCascade.title` (Bürger-Sprache).
  - PfadHub wich von den 4 kanonischen v0.3-Pfaden ab → auf Lage / Haushalt / Wirkungsketten / Maßnahmen ausgerichtet.
  - ModusSwitcher war nirgends gerendert → in die App-Shell (`TopNav`) eingebunden.
  - DbNotice zeigte Docker/pnpm-Befehle in der Bürger-UI → ruhige Bürger-Meldung; technische Details nur außerhalb Produktion.
  - `.mono-label` war in Rost → auf muted (`--on-surface-variant`); Rost bleibt dem Strich-Marker vorbehalten.
  - SourcePill ohne „Quelle:"-Label/Pfeil → Trust-Layer-Pattern „Quelle: + Name · Stand: + Datum ↗" mit `title`.
  - EffectPath-Label „DE-Relevanz" → „Deutschland-Relevanz".

### Minor — behoben (8)

AUTH_SECRET fail-fast (`assertAuthRuntimeReady`), Strich-Marker `aria-hidden`, kanonisches Label „Aktueller Wert"/„Stand des Werts", Nullish-Check statt Truthiness bei numerischen Live-Werten, EffectPath „Systemstress" → „Systembereich", Logo „RUHRLOGIK" → „WachSam", Datenschutz-Verantwortlicher mit echter Anschrift.

### Minor — bewusst verschoben (dokumentiert, kein Blocker)

| Befund | Datei | Warum verschoben |
|---|---|---|
| Kein Self-Service-Löschen (Art. 17/20) | `profil/profile-form.tsx` | Feature, nicht Code-Mangel; Anfrage per E-Mail ist zulässig |
| Drawer-Backdrop klickbares `<div>` ohne Tastatur | `WerkzeugeDrawer.tsx` | ESC/Button schließt bereits; a11y-Politur |
| Kein Empty-State „verbunden, keine Zeilen" | Listen-Pages | DbNotice deckt den Disconnect-Fall; Edge-Case |
| Kaskaden-Badge UUID-Fallback bei >26 Einträgen | `kaskaden/page.tsx` | Greift erst >26 Kaskaden (aktuell 12) |
| `focus-title` in Bebas | `globals.css` | Headline trägt nun die Display-Schrift; Hero-Titel-Umstellung separat |
| Threshold-Label-Overflow an den Bar-Rändern | `globals.css` | Browser-Verifikation nötig (kein lokaler DB-Stand) |
| Breakpoint 820px statt 768px | `globals.css` | 820 stapelt vor der Tablet-Grenze — bewusst konservativ belassen |
| Rost-Kleintext-Kontrast (`.cross-link`, `.path-tab`) | `globals.css` | Widerlegt als Blocker; mono-label-Fix entschärft den Hauptfall, Rest als Folge-Politur |

## 3. Welle-10-Checkliste

| Checkpunkt | Status | Anmerkung |
|---|---|---|
| CI grün | ✅ | verify.yml erweitert; lokal grün |
| UI Desktop/Mobile geprüft | ⚠️ teilweise | Build + statisches Audit grün; Browser-Smoke gegen Live-DB steht aus (kein lokaler DB-Zugriff) |
| Live-Daten-Spur sichtbar & nicht alarmistisch | ✅ | „Live"-Wording entfernt; kanonische Labels; nicht-alarmistisch verifiziert |
| Editorial-Gate dokumentiert | ✅ | `docs/editorial-gate.md` (Draft→Approve→Publish, Authz, Audit-Log, kein Auto-Publish) |
| DSGVO- & Security-Review (Auth/Profil/Notifications) | ✅ | Audit durchgeführt; Blocker behoben; Magic-Link/Resend dokumentiert |
| Session-Briefs aktualisiert | ✅ | `.remember/next-session-brief.md` |

## 4. Verbleibt — nur durch Betreiber/extern

- **Produktions-Deploy + Public-Smoke** (`https://wachsam.ruhrlogik.de`): erfordert VPS-Secrets; `deploy.yml` ist vorbereitet.
- **Live-DB-Smoke**: DB-Läufe sind dem Betreiber vorbehalten (kein direkter Prod-Zugriff durch den Agenten).
- **Secret-Setup in Prod**: `DATABASE_URL`, `RESEND_API_KEY`, `AUTH_SECRET` — `assertAuthRuntimeReady()` schlägt jetzt fehl, wenn sie fehlen.
- **Rechtliche Prüfung der Legal-Pages**: Impressum/Datenschutz wurden gegen die autoritativen Dokumente und den realen v02-Stack (IONOS-Hosting EU, Resend, Vertex AI europe-west3, Magic-Link statt Google-Login, kein reCAPTCHA/OSM) angeglichen. Sobald Welle 6 (Deutschland-Karte → ggf. OpenStreetMap) live geht, sind die entsprechenden Abschnitte aus der autoritativen Datenschutzerklärung zu ergänzen. Eine anwaltliche Endabnahme wird empfohlen.
- **AVV mit Resend** unterschrieben halten (in Datenschutz Abschnitt 6 zugesichert).

## 5. Verify-Evidenz

- `cd v02 && pnpm run verify` → PASS (tsc, eslint, next build 28 Routen, drizzle generate „no schema changes", seed dry-run „Validierung erfolgreich", audit invariants ok).
- `cd v02/intelligence && python -m pytest tests/` → 33 passed, 5 skipped (Postgres-Integrationstests sauber übersprungen).
- `bash scripts/verify.sh` → PASS (Secret-/Artefakt-Gate).
