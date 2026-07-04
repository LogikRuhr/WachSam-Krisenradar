# Radar-Produktschicht Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die vier Produkt-Deltas aus `projects/wachsam-produkt-v1/PRODUKTPLAN.md` in v02 umsetzen: Themenkanäle mit 4-stufiger Warnlogik (/radar), Bundesland-Filter, €-Modellrechnung, Wochenübersicht (/woche) — plus NINA-Adapter und PWA-Manifest. Deploy auf wachsam.ruhrlogik.de.

**Architecture:** Reine Ableitungsschicht über vorhandenen Daten: Themenkanal-Stufen werden zur Render-Zeit deterministisch aus publizierten Indikatoren berechnet (keine neue Persistenz für Stufen). Einzige Schema-Erweiterung: `regional_warnings` (DWD-Warnungen je Bundesland). Ingestion-Erweiterungen folgen exakt dem bestehenden Adapter-Muster.

**Tech Stack:** Next.js 15 App Router (Server Components, kein Tailwind — globals.css-Klassen), Drizzle/PostgreSQL, Python-Ingestion (`v02/intelligence`, pydantic + requests + pytest).

## Global Constraints

- Sprache UI: Deutsch, ehrliche Leerzustände, keine Mockdaten (AGENTS.md).
- Public-Reads filtern IMMER `editorial_status = 'published'` (Muster `PUBLISHED` in `web/lib/public-data.ts:7`).
- DB: NUR `drizzle-kit generate` (offline). NIEMALS `migrate`/`push`/`seed`/`psql` — das führt ausschließlich Jean aus (Deny-Policy).
- Severity-Enum-Werte sind ASCII (`"erhoeht"`, nicht „erhöht") — gilt für DB/TS. Python `severity_suggestion` nutzt dagegen den Kanon aus `intelligence/src/validation.py:23` (mit Umlauten).
- Alle neuen Web-Seiten: `export const dynamic = "force-dynamic"` (Muster aller bestehenden Seiten).
- Python-Tests: `python -m pytest` in `v02/intelligence` (Live-Tests sind per `addopts = "-m 'not live'"` ausgeschlossen).
- Web-Gate: `pnpm verify` in `v02/` (tsc + eslint + build + drizzle generate + seed dry-run + Unit-Tests).
- Unit-Test-Harness Web: VOR dem Schreiben eines Tests eine bestehende Datei lesen (z. B. `web/lib/sparkline.test.ts`) und deren Muster exakt übernehmen (Runner ist `tsx` via `pnpm test:unit`).
- Commits klein und konventionell (`feat:`, `fix:`, `test:`), auf Feature-Branch `feature/radar-produktschicht`.
- €-Angaben sind IMMER als Modellrechnung mit sichtbaren Annahmen gekennzeichnet, niemals als Vorhersage.

## Vorbedingung (einmalig)

- [ ] Branch anlegen: `cd v02 && git checkout -b feature/radar-produktschicht`

---

### Task 1: Themenkanal-Konfiguration + Stufenlogik (pure TS)

**Files:**
- Create: `v02/web/lib/themes.ts`
- Test: `v02/web/lib/themes.test.ts`

**Interfaces:**
- Consumes: nichts (pure Funktionen).
- Produces:
  - `type ThemeState = "normal" | "beobachten" | "erhoeht" | "hoch"`
  - `type ThemeIndicatorInput = { id: string; zone: "uncritical" | "elevated" | "critical" | "pending"; label: string }`
  - `type ThemeStateResult = { state: ThemeState; drivers: ThemeIndicatorInput[]; reason: string }`
  - `THEME_CHANNELS: ThemeChannel[]` mit `type ThemeChannel = { key: string; title: string; question: string; indicatorIds: string[]; leadText: Record<ThemeState, string> }`
  - `computeThemeState(inputs: ThemeIndicatorInput[]): ThemeStateResult`
  - `computeWarnlageState(maxLevel: number): ThemeState`
  - `THEME_STATE_LABEL: Record<ThemeState, string>` (`normal→"Normal"`, `beobachten→"Beobachten"`, `erhoeht→"Erhöht"`, `hoch→"Hoch"`)

- [ ] **Step 1: Failing Test schreiben** — zuerst `web/lib/sparkline.test.ts` lesen und Harness-Muster übernehmen. Testfälle (Korroborations-Regel):

```ts
// v02/web/lib/themes.test.ts — Harness-Kopf an bestehende *.test.ts anpassen!
import assert from "node:assert/strict";
import { computeThemeState, computeWarnlageState, THEME_CHANNELS } from "./themes";

const mk = (id: string, zone: "uncritical" | "elevated" | "critical" | "pending") =>
  ({ id, zone, label: id });

// 0 auffällige → normal
assert.equal(computeThemeState([mk("a", "uncritical"), mk("b", "uncritical")]).state, "normal");
// genau 1 elevated → beobachten (Korroboration fehlt)
assert.equal(computeThemeState([mk("a", "elevated"), mk("b", "uncritical")]).state, "beobachten");
// genau 1 critical → beobachten reicht NICHT: einzelnes critical → erhoeht
assert.equal(computeThemeState([mk("a", "critical"), mk("b", "uncritical")]).state, "erhoeht");
// ≥2 elevated → erhoeht
assert.equal(computeThemeState([mk("a", "elevated"), mk("b", "elevated")]).state, "erhoeht");
// ≥1 critical + ≥1 weiteres auffälliges → hoch
assert.equal(computeThemeState([mk("a", "critical"), mk("b", "elevated")]).state, "hoch");
// pending zählt nicht als auffällig
assert.equal(computeThemeState([mk("a", "pending"), mk("b", "pending")]).state, "normal");
// leere Liste → normal mit erklärendem reason
assert.equal(computeThemeState([]).state, "normal");
// drivers enthält nur auffällige Indikatoren
assert.deepEqual(
  computeThemeState([mk("a", "critical"), mk("b", "uncritical")]).drivers.map((d) => d.id),
  ["a"],
);
// Amtliche Warnlage: DWD max_level Passthrough
assert.equal(computeWarnlageState(0), "normal");
assert.equal(computeWarnlageState(2), "beobachten");
assert.equal(computeWarnlageState(3), "erhoeht");
assert.equal(computeWarnlageState(5), "hoch");
// Jede Kanal-Konfig referenziert ≥1 Indikator und hat alle 4 leadTexts
for (const ch of THEME_CHANNELS) {
  assert.ok(ch.indicatorIds.length >= 1, ch.key);
  for (const s of ["normal", "beobachten", "erhoeht", "hoch"] as const) assert.ok(ch.leadText[s]);
}
console.log("themes.test.ts ok");
```

- [ ] **Step 2: Test läuft und schlägt fehl** — Run: `cd v02 && pnpm exec tsx web/lib/themes.test.ts` — Expected: FAIL (`Cannot find module './themes'`).

- [ ] **Step 3: Implementierung**

```ts
// v02/web/lib/themes.ts
// Themenkanäle: deterministische 4-stufige Bewertungslogik (Wirkungsachse).
// Schwellen-/Regeländerungen sind Commits, keine DB-Einträge (PRODUKTPLAN §5).

export type ThemeState = "normal" | "beobachten" | "erhoeht" | "hoch";
export type ThemeZone = "uncritical" | "elevated" | "critical" | "pending";
export type ThemeIndicatorInput = { id: string; zone: ThemeZone; label: string };
export type ThemeStateResult = { state: ThemeState; drivers: ThemeIndicatorInput[]; reason: string };

export const THEME_STATE_LABEL: Record<ThemeState, string> = {
  normal: "Normal",
  beobachten: "Beobachten",
  erhoeht: "Erhöht",
  hoch: "Hoch",
};

export type ThemeChannel = {
  key: string;
  title: string;
  question: string;
  indicatorIds: string[];
  leadText: Record<ThemeState, string>;
};

// Kuratierte Kanäle — Indikator-IDs aus db/seed/source-data/warning-indicators.json.
export const THEME_CHANNELS: ThemeChannel[] = [
  {
    key: "mobilitaet",
    title: "Mobilitätskosten",
    question: "Wird Fahren teurer?",
    indicatorIds: [
      "wi-kraftstoffpreis-diesel",
      "wi-kraftstoffpreis-super-e5",
      "wi-kraftstoffpreis-super-e10",
      "wi-oel-brent",
    ],
    leadText: {
      normal: "Kraftstoff- und Ölpreise bewegen sich im normalen Band.",
      beobachten: "Ein Preissignal fällt auf — noch ohne Bestätigung durch weitere Quellen.",
      erhoeht: "Mehrere Preissignale ziehen an. Pendler sollten die Kostenentwicklung beobachten.",
      hoch: "Kraftstoffkosten steigen deutlich und breit abgestützt.",
    },
  },
  {
    key: "heizen-energie",
    title: "Heiz- & Stromkosten",
    question: "Wird Heizen und Strom teurer?",
    indicatorIds: [
      "wi-gaspreis-europa",
      "wi-gaspreis-haushalt-efh",
      "wi-strompreis-haushalt",
      "wi-gasspeicher-fuellstand",
    ],
    leadText: {
      normal: "Gas- und Strompreise sowie Speicherstände sind unauffällig.",
      beobachten: "Ein Energiesignal fällt auf — Entwicklung unklar.",
      erhoeht: "Mehrere Energiesignale zeigen in dieselbe Richtung. Abschläge prüfen lohnt sich.",
      hoch: "Energiekosten-Signale sind breit im kritischen Bereich.",
    },
  },
  {
    key: "lebensmittel",
    title: "Lebensmittelpreise",
    question: "Wird der Einkauf teurer?",
    indicatorIds: ["wi-fao-food-price-index", "wi-duengemittel-preis", "wi-inflation-vpi-de"],
    leadText: {
      normal: "Vorlauf-Indikatoren für Lebensmittelpreise sind unauffällig.",
      beobachten: "Ein Vorlauf-Signal fällt auf — wirkt, wenn überhaupt, mit Monaten Verzögerung.",
      erhoeht: "Mehrere Vorlauf-Signale steigen. Preisdruck im Supermarkt wird wahrscheinlicher.",
      hoch: "Deutlicher, breit abgestützter Preisdruck in der Lebensmittelkette.",
    },
  },
  {
    key: "geld-zinsen",
    title: "Geld & Zinsen",
    question: "Was passiert mit Kaufkraft und Krediten?",
    indicatorIds: ["wi-ezb-leitzins", "wi-inflation-vpi-de"],
    leadText: {
      normal: "Inflation und Leitzins bewegen sich im erwartbaren Rahmen.",
      beobachten: "Ein Geldwert-Signal fällt auf.",
      erhoeht: "Inflations- und Zinssignale sind gemeinsam auffällig — Kredit- und Sparentscheidungen betroffen.",
      hoch: "Deutliche Anspannung bei Geldwert und Finanzierung.",
    },
  },
  {
    key: "arbeit-wirtschaft",
    title: "Arbeit & Wirtschaft",
    question: "Wie stabil sind Jobs und Betriebe?",
    indicatorIds: ["wi-arbeitslosigkeit-de", "wi-insolvenzen-de", "wi-bip-wachstum-de"],
    leadText: {
      normal: "Arbeitsmarkt- und Konjunktursignale sind unauffällig.",
      beobachten: "Ein Konjunktursignal fällt auf.",
      erhoeht: "Mehrere Signale zeigen wirtschaftliche Abkühlung — mittelbar relevant für Jobs und Aufträge.",
      hoch: "Breite wirtschaftliche Anspannung über mehrere Indikatoren.",
    },
  },
  {
    key: "staat-vertrauen",
    title: "Staat & Sicherheit",
    question: "Wie belastbar sind Staat und digitale Infrastruktur?",
    indicatorIds: ["wi-bsi-cyberbedrohung", "wi-staatsschuldenquote-de", "wi-vertrauen-politik"],
    leadText: {
      normal: "Cyber-, Schulden- und Vertrauenssignale sind unauffällig.",
      beobachten: "Ein Signal in diesem Bereich fällt auf.",
      erhoeht: "Mehrere Belastungssignale gleichzeitig — Entwicklung beobachten.",
      hoch: "Breite Anspannung bei staatlicher Belastbarkeit.",
    },
  },
];

// Amtliche Warnlage ist ein Sonderkanal: DWD/NINA umgehen das Scoring (PRODUKTPLAN §5.2).
export const WARNLAGE_CHANNEL = {
  key: "warnlage",
  title: "Akute Warnlage (amtlich)",
  question: "Gibt es amtliche Warnungen?",
  indicatorId: "wi-dwd-warnings-de",
} as const;

const NOTEWORTHY: ReadonlySet<ThemeZone> = new Set(["elevated", "critical"]);

export function computeThemeState(inputs: ThemeIndicatorInput[]): ThemeStateResult {
  const drivers = inputs.filter((i) => NOTEWORTHY.has(i.zone));
  const critical = drivers.filter((i) => i.zone === "critical").length;
  const noteworthy = drivers.length;

  let state: ThemeState = "normal";
  if (critical >= 1 && noteworthy >= 2) state = "hoch";
  else if (critical >= 1 || noteworthy >= 2) state = "erhoeht";
  else if (noteworthy === 1) state = "beobachten";

  const reason =
    inputs.length === 0
      ? "Keine Indikatordaten verfügbar."
      : `${noteworthy} von ${inputs.length} Indikatoren auffällig (davon ${critical} kritisch).`;
  return { state, drivers, reason };
}

// DWD max_level (0–5) → Kanalstufe, amtliche Logik unverändert durchgereicht.
export function computeWarnlageState(maxLevel: number): ThemeState {
  if (maxLevel >= 4) return "hoch";
  if (maxLevel >= 3) return "erhoeht";
  if (maxLevel >= 1) return "beobachten";
  return "normal";
}
```

- [ ] **Step 4: Test grün** — Run: `pnpm exec tsx web/lib/themes.test.ts` — Expected: `themes.test.ts ok`. Zusätzlich prüfen, dass `pnpm test:unit` die neue Datei aufnimmt (Glob prüfen; falls Dateiliste hart kodiert ist, dort ergänzen).

- [ ] **Step 5: Commit** — `git add web/lib/themes.ts web/lib/themes.test.ts && git commit -m "feat: theme channels with 4-level corroboration logic"`

---

### Task 2: Radar-Datenschicht

**Files:**
- Create: `v02/web/lib/radar-data.ts`
- Modify (nur lesen als Referenz): `v02/web/lib/public-data.ts`, `v02/web/lib/indicator-zones.ts`

**Interfaces:**
- Consumes: `getIndicators()` aus `public-data.ts` (published-Filter!), `computeZone`/`indicatorVitals` aus `indicator-zones.ts` (Signatur VOR Implementierung lesen — Drizzle liefert numeric-Spalten als string), `computeThemeState`/`computeWarnlageState`/`THEME_CHANNELS` aus Task 1.
- Produces:
  - `type RadarTheme = { key: string; title: string; question: string; state: ThemeState; lead: string; reason: string; drivers: { id: string; label: string; zone: ThemeZone; currentValue: string | null; unit: string | null }[]; sinceDate: string | null }`
  - `getRadarThemes(): Promise<{ themes: RadarTheme[]; warnlage: RadarTheme; connected: boolean }>`

- [ ] **Step 1:** `public-data.ts` (Getter-Muster, `safe()`) und `indicator-zones.ts` (exakte `computeZone`-Signatur) lesen.
- [ ] **Step 2:** `radar-data.ts` implementieren: alle published Indicators laden, pro `THEME_CHANNELS`-Kanal die konfigurierten IDs herausfiltern, je Indikator Zone via `computeZone`/`indicatorVitals` berechnen (fehlender `currentValue` → `"pending"`), `computeThemeState` aufrufen, `lead = channel.leadText[state]`. Warnlage-Kanal separat: Indikator `wi-dwd-warnings-de`, `computeWarnlageState(Number(currentValue ?? 0))`, `sinceDate = currentValueDate`. DB-Fehler → `connected: false` (Muster `safe()`). Sortierung der Themes: Stufe absteigend (`hoch→normal`), dann Kanal-Reihenfolge.
- [ ] **Step 3:** Typecheck — Run: `pnpm --filter web typecheck` — Expected: PASS.
- [ ] **Step 4: Commit** — `git commit -am "feat: radar data layer deriving theme states from indicators"`

---

### Task 3: /radar-Seite + ThemeCard + Nav

**Files:**
- Create: `v02/web/app/radar/page.tsx`, `v02/web/components/ThemeCard.tsx`, `v02/web/components/ThemeStateBadge.tsx`
- Modify: `v02/web/components/TopNav.tsx` (Link „Radar"), `v02/web/app/globals.css` (Klassen `.theme-card`, `.theme-state-{normal|beobachten|erhoeht|hoch}` — Farben an vorhandene Tokens koppeln: normal→`--success`, beobachten→`--info`, erhoeht→`--warning`, hoch→`--critical`)
- Test: `v02/tests/e2e/public-smoke.spec.ts` (Route ergänzen)

**Interfaces:**
- Consumes: `getRadarThemes()` (Task 2), `THEME_STATE_LABEL` (Task 1), bestehende Komponenten `SourcePill`, `SeverityBadge`-CSS-Muster als Vorbild.
- Produces: Route `/radar`; `ThemeCard({ theme }: { theme: RadarTheme })`; `ThemeStateBadge({ state }: { state: ThemeState })`.

- [ ] **Step 1:** Bestehende Seite `app/lagebild/page.tsx` + `components/SignalChain.tsx` lesen (Struktur-/Klassen-Vorbild).
- [ ] **Step 2:** `ThemeStateBadge` (span mit `theme-state-*`-Klasse + `THEME_STATE_LABEL`) und `ThemeCard` bauen: Titel, Frage, Badge, Lead-Text, `reason` (kleine „Warum sehe ich das?"-Zeile), Treiber-Liste (Label + Wert + Einheit + Zonen-Punkt), Stand-Datum. Ehrlicher Leerzustand: `connected === false` oder alle Kanäle ohne Daten → ruhiger Hinweis („Aktuell keine Datenverbindung / keine erhöhten Themen"), kein Fake.
- [ ] **Step 3:** `app/radar/page.tsx` (`force-dynamic`, async Server Component): Warnlage-Karte zuerst (amtlich markiert), dann Themen-Grid sortiert. H1 „WachSam Radar", Untertitel mit Stand.
- [ ] **Step 4:** TopNav-Eintrag „Radar" (vor „Lage"). Smoke-Test in `tests/e2e/public-smoke.spec.ts` um `/radar` ergänzen (Muster der bestehenden Route-Checks kopieren; erwartet H1 sichtbar, keine Console-Errors).
- [ ] **Step 5:** Run: `pnpm --filter web typecheck && pnpm --filter web lint && pnpm smoke:ui` — Expected: PASS (Leerzustand-Modus des Playwright-webServer).
- [ ] **Step 6: Commit** — `git commit -am "feat: /radar page with theme cards and 4-level badges"`

---

### Task 4: Schema `regional_warnings` + Migration (generate only)

**Files:**
- Modify: `v02/db/schema/index.ts`
- Create (generiert): `v02/db/migrations/00XX_*.sql`

**Interfaces:**
- Produces: Tabelle `regional_warnings` — `regionCode text NOT NULL` (DWD `stateShort`), `source text NOT NULL DEFAULT 'dwd'`, `warningCount integer NOT NULL`, `maxLevel integer NOT NULL`, `updatedAt timestamptz NOT NULL DEFAULT now()`, Composite PK `[regionCode, source]`. Export `regionalWarnings`.

- [ ] **Step 1:** Schema-Zusatz am Ende von `db/schema/index.ts` (Muster `indicator_observations` Z.408 für Composite PK):

```ts
export const regionalWarnings = pgTable(
  "regional_warnings",
  {
    regionCode: text("region_code").notNull(),
    source: text("source").notNull().default("dwd"),
    warningCount: integer("warning_count").notNull(),
    maxLevel: integer("max_level").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.regionCode, table.source] })],
);
```

- [ ] **Step 2:** Run: `cd v02 && pnpm db:generate` — Expected: neue SQL-Datei in `db/migrations/` mit `CREATE TABLE "regional_warnings"`. SQL-Datei lesen und prüfen. NIEMALS `db:migrate` ausführen.
- [ ] **Step 3:** Run: `pnpm db:migrate:check` — Expected: PASS.
- [ ] **Step 4: Commit** — `git add db/ && git commit -m "feat: regional_warnings table for per-state warning counts"`
- [ ] **HUMAN GATE (Jean):** Vor Deploy `pnpm db:migrate` auf Prod ausführen (Migration vor Rebuild).

---

### Task 5: DWD-Adapter — Bundesland-Aufschlüsselung + Persistenz

**Files:**
- Modify: `v02/intelligence/src/adapters/dwd.py`, `v02/intelligence/src/db.py`, `v02/intelligence/src/main.py`
- Test: `v02/intelligence/tests/test_adapters.py` (ergänzen)

**Interfaces:**
- Consumes: bestehendes `summarize_warnings(payload)` (nutzt bereits `stateShort`), `db.get_connection()/is_dry_run()`-Muster aus `upsert_source_health`.
- Produces:
  - `dwd.summarize_by_state(payload) -> list[dict]` — `[{"region_code": "NRW", "warning_count": 3, "max_level": 2}, ...]`
  - `DWDAdapter.regional_records: list[dict]` (nach `fetch_latest` gefüllt)
  - `db.upsert_regional_warnings(records: list[dict]) -> int`
  - `main.run_ingestion()` persistiert `getattr(adapter, "regional_records", [])` nach dem Fetch.

- [ ] **Step 1: Failing Tests** (Muster `test_bnetza_adapter_parses_gie_data_envelope` + `_mock_tankerkoenig` in `tests/test_adapters.py` lesen und übernehmen):

```python
def test_dwd_summarize_by_state_counts_and_max_level():
    payload = {
        "time": 1751600000000,
        "warnings": {
            "r1": [
                {"level": 2, "event": "WINDBÖEN", "stateShort": "NRW"},
                {"level": 3, "event": "GEWITTER", "stateShort": "NRW"},
            ],
            "r2": [{"level": 1, "event": "NEBEL", "stateShort": "BY"}],
        },
    }
    from src.adapters.dwd import summarize_by_state

    records = {r["region_code"]: r for r in summarize_by_state(payload)}
    assert records["NRW"]["warning_count"] == 2
    assert records["NRW"]["max_level"] == 3
    assert records["BY"]["warning_count"] == 1


def test_dwd_adapter_fills_regional_records(monkeypatch):
    from src.adapters.dwd import DWDAdapter

    response = MagicMock()
    response.status_code = 200
    response.text = (
        'warnWetter.loadWarnings({"time": 1751600000000, "warnings": '
        '{"r1": [{"level": 2, "event": "STURM", "stateShort": "NRW"}]}});'
    )
    response.raise_for_status = lambda: None
    monkeypatch.setattr("src.adapters.dwd.requests.get", lambda *a, **k: response)

    adapter = DWDAdapter()
    items = adapter.fetch_latest()
    assert len(items) == 1
    assert adapter.regional_records == [
        {"region_code": "NRW", "warning_count": 1, "max_level": 2, "source": "dwd"}
    ]
```

- [ ] **Step 2:** Run: `cd v02/intelligence && python -m pytest tests/test_adapters.py -k dwd -v` — Expected: FAIL (`summarize_by_state` nicht definiert / kein Attribut `regional_records`).
- [ ] **Step 3: Implementierung** — in `dwd.py`:

```python
def summarize_by_state(payload: dict) -> list[dict]:
    warnings_by_region = payload.get("warnings") or {}
    by_state: dict[str, dict] = {}
    for region in warnings_by_region.values():
        for warning in region:
            state = str(warning.get("stateShort") or warning.get("state") or "unknown")
            level = int(warning.get("level") or 0)
            entry = by_state.setdefault(
                state, {"region_code": state, "warning_count": 0, "max_level": 0, "source": "dwd"}
            )
            entry["warning_count"] += 1
            entry["max_level"] = max(entry["max_level"], level)
    return sorted(by_state.values(), key=lambda e: e["region_code"])
```

In `DWDAdapter.__init__`: `self.regional_records: list[dict] = []`. In `fetch_latest` nach `summary = summarize_warnings(payload)`: `self.regional_records = summarize_by_state(payload)`; im `except`-Zweig `self.regional_records = []` NICHT setzen (Stale-on-error: alte DB-Werte bleiben stehen, es wird schlicht nichts upserted).

In `db.py` (Muster `upsert_source_health` übernehmen — Dry-Run-Guard, Verbindung, Commit):

```python
def upsert_regional_warnings(records: list[dict]) -> int:
    if is_dry_run() or not records:
        return 0
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            for r in records:
                cur.execute(
                    """
                    INSERT INTO regional_warnings (region_code, source, warning_count, max_level, updated_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON CONFLICT (region_code, source) DO UPDATE SET
                        warning_count = EXCLUDED.warning_count,
                        max_level = EXCLUDED.max_level,
                        updated_at = NOW()
                    """,
                    (r["region_code"], r.get("source", "dwd"), r["warning_count"], r["max_level"]),
                )
        conn.commit()
        return len(records)
    finally:
        conn.close()
```

In `main.py` `run_ingestion()`, direkt nach dem Einsammeln der Items eines Adapters: `regional = getattr(adapter, "regional_records", [])` → `db.upsert_regional_warnings(regional)` (in try/except mit Log, damit ein DB-Fehler den Lauf nicht stoppt).

- [ ] **Step 4:** Run: `python -m pytest tests/ -v` — Expected: alle PASS (inkl. Bestand).
- [ ] **Step 5: Verifikation gegen Live-Daten** (Fakten-Treue, read-only): `python -c "import requests; from src.adapters.dwd import decode_warnwetter_response, summarize_by_state; p=decode_warnwetter_response(requests.get('https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json', headers={'User-Agent':'WachSam/1.0'}, timeout=20).text); print(summarize_by_state(p)[:5])"` — Expected: Liste mit echten `stateShort`-Codes. **Die gefundenen Codes notieren** — sie sind die Wahrheit für Task 6 (Bundesland-Mapping).
- [ ] **Step 6: Commit** — `git commit -am "feat: DWD adapter regional per-state warning records"`

---

### Task 6: Bundesland-Filter (Cookie) + Warnlage-Regionalisierung

**Files:**
- Create: `v02/web/components/RegionSwitcher.tsx` (Client Component), `v02/web/lib/regions.ts`
- Modify: `v02/web/lib/radar-data.ts` (Region-Parameter), `v02/web/app/radar/page.tsx`
- Test: `v02/web/lib/regions.test.ts`

**Interfaces:**
- Consumes: Tabelle `regionalWarnings` (Task 4) via Drizzle, Cookie `ws-region` (Wert = DWD-`stateShort`-Code oder leer = bundesweit), Live-Codes aus Task 5 Step 5.
- Produces:
  - `regions.ts`: `BUNDESLAENDER: { code: string; name: string }[]` (16 Einträge, Codes exakt wie von DWD geliefert — aus Task 5 Step 5 übernehmen, NICHT raten), `regionName(code: string | null): string` („Bundesweit" bei null/unbekannt), `REGION_COOKIE = "ws-region"`.
  - `RegionSwitcher` — `<select>`, schreibt Cookie via `document.cookie` (Pfad `/`, maxAge 1 Jahr, SameSite=Lax) und `router.refresh()`.
  - `getRadarThemes(regionCode?: string | null)` — Warnlage-Karte nutzt bei gesetzter Region den `regional_warnings`-Eintrag (count + maxLevel) statt des Bundeswerts; Titelzusatz „in {regionName}". Kein Eintrag für Region → warning_count 0/normal mit Hinweis „keine aktiven Warnungen für {Region} im Datensatz".
- Keine PII: Cookie enthält nur ein Bundesland-Kürzel, DSGVO-unkritisch; in `datenschutz`-Seite als funktionaler Cookie ergänzen (ein Satz).

- [ ] **Step 1:** `regions.test.ts`: 16 Länder, eindeutige Codes, `regionName(null) === "Bundesweit"`. Run → FAIL.
- [ ] **Step 2:** `regions.ts` implementieren (Codes aus Task 5 Step 5 verifiziert). Test grün.
- [ ] **Step 3:** `RegionSwitcher` bauen (Muster Client-Komponente: `components/ModusSwitcher.tsx` lesen). In `radar/page.tsx`: `const region = (await cookies()).get("ws-region")?.value ?? null` (Next 15: `cookies()` ist async), an `getRadarThemes(region)` durchreichen, Switcher über dem Grid rendern.
- [ ] **Step 4:** `radar-data.ts`: Query auf `regionalWarnings` (nur wenn Region gesetzt), `safe()`-Muster.
- [ ] **Step 5:** Run: `pnpm --filter web typecheck && pnpm smoke:ui` — Expected: PASS.
- [ ] **Step 6:** Datenschutz-Seite: Absatz „Funktionale Einstellung (Cookie ws-region, nur Bundesland-Kürzel, keine Personenbeziehbarkeit)" ergänzen.
- [ ] **Step 7: Commit** — `git commit -am "feat: Bundesland filter via cookie with regional warnlage"`

---

### Task 7: €-Modellrechnung (cost-model)

**Files:**
- Create: `v02/web/lib/cost-model.ts`
- Test: `v02/web/lib/cost-model.test.ts`
- Modify: `v02/web/components/ThemeCard.tsx` (Anzeige), `v02/web/lib/radar-data.ts` (Observations für Modell-Kanäle laden via `getIndicatorObservations`)

**Interfaces:**
- Consumes: `getIndicatorObservations(id, limit)` aus `public-data.ts` (Zeitreihe `{observedAt, value}`; numeric kommt als string).
- Produces:
  - `type CostEstimate = { monthlyDeltaEur: number; window: string; assumptions: string; basis: string }`
  - `estimateMobilityDelta(obs: { observedAt: Date; value: string }[]): CostEstimate | null` — Δ Diesel-€/l zwischen jüngstem Wert und dem jüngsten Wert ≥28 Tage davor; Annahme 15.000 km/Jahr, 6,5 l/100 km ⇒ 81,25 l/Monat; `monthlyDeltaEur = delta * 81.25`, gerundet auf 1 €.
  - `estimateHeatingDelta(obs, unit: string | null): CostEstimate | null` — Δ `wi-gaspreis-haushalt-efh`; VOR Implementierung Einheit des Indikators aus der DB-Seed-Datei `warning-indicators.json` ablesen (ct/kWh vs. €/kWh) und Faktor entsprechend setzen; Annahme 18.000 kWh/Jahr ⇒ 1.500 kWh/Monat.
  - Rückgabe `null` wenn <2 verwertbare Punkte oder Fenster <21 Tage (ehrlich: dann keine €-Zeile).
  - `assumptions` enthält die Annahmen ausgeschrieben; UI zeigt sie als Fußzeile „Modellrechnung, keine Vorhersage — Annahmen: …".

- [ ] **Step 1: Failing Test:** Fixture-Zeitreihe (35 Tage, Diesel 1.70→1.80) ⇒ `monthlyDeltaEur === 8` (0.10 × 81.25 ≈ 8.13 → 8); zu kurzes Fenster ⇒ `null`; leere Liste ⇒ `null`. Run: `pnpm exec tsx web/lib/cost-model.test.ts` → FAIL.
- [ ] **Step 2:** Implementieren (pure Funktionen, keine DB). Test grün.
- [ ] **Step 3:** `radar-data.ts`: für Kanäle `mobilitaet`/`heizen-energie` Observations des Leitindikators laden und `costEstimate` ans `RadarTheme` hängen; `ThemeCard` rendert €-Zeile nur wenn vorhanden, immer mit Annahmen-Fußzeile.
- [ ] **Step 4:** Run: `pnpm --filter web typecheck && pnpm test:unit` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: transparent cost model estimates on radar cards"`

---

### Task 8: Wochenübersicht /woche

**Files:**
- Create: `v02/web/lib/weekly.ts`, `v02/web/app/woche/page.tsx`
- Test: `v02/web/lib/weekly.test.ts`
- Modify: `v02/web/components/TopNav.tsx` (Link „Woche"), `v02/tests/e2e/public-smoke.spec.ts` (Route)

**Interfaces:**
- Consumes: `computeThemeState`/`THEME_CHANNELS` (Task 1), `computeZone`-Logik (Task 2-Muster), `getIndicators()` + `getIndicatorObservations()`.
- Produces:
  - `valueAt(obs: { observedAt: Date; value: string }[], at: Date): string | null` — jüngster Wert mit `observedAt <= at` (pure, testbar).
  - `type WeeklyChannel = { key: string; title: string; stateNow: ThemeState; stateWeekAgo: ThemeState | null; changed: boolean; topMover: { label: string; deltaPercent: number } | null }`
  - `getWeeklyOverview(): Promise<{ channels: WeeklyChannel[]; generatedFor: string; connected: boolean }>` — Stufe heute vs. Stufe vor 7 Tagen (Zonen aus historischen Werten mit HEUTIGEN Schwellen — als methodische Einschränkung auf der Seite ausweisen), `stateWeekAgo: null` wenn Historie fehlt (ehrlich anzeigen: „keine ausreichende Historie").
- Seite: „Die Woche im Überblick" — Liste je Kanal (Badge alt → neu, Pfeil bei Änderung), größte Bewegungen, Abschnitt „Ehrlichkeit": Zahl der Hochstufungen der Woche + Hinweis auf Methodik. Keine neue Tabelle (abgeleitet aus `indicator_observations`).

- [ ] **Step 1: Failing Test** für `valueAt` (drei Punkte, Stichtag zwischen 2. und 3. → 2. Wert; Stichtag vor allen → null). Run → FAIL.
- [ ] **Step 2:** `weekly.ts` implementieren; Test grün.
- [ ] **Step 3:** Seite bauen (`force-dynamic`, Leerzustand-fest), TopNav + Smoke-Route ergänzen.
- [ ] **Step 4:** Run: `pnpm --filter web typecheck && pnpm test:unit && pnpm smoke:ui` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: /woche weekly overview with state changes"`

---

### Task 9: NINA/BBK-Adapter (bundesweiter Zivilschutz-Indikator)

**Files:**
- Create: `v02/intelligence/src/adapters/nina.py`
- Modify: `v02/intelligence/src/main.py` (Import + `adapters`-Liste), `v02/intelligence/source_registry.yaml` (Eintrag, `adapter: src.adapters.nina.NINAAdapter`, Klassenname minus `Adapter` = `NINA` = Konstruktor-Name), `v02/intelligence/src/plausibility_rules.py` (`wi-nina-zivilschutz-de`: min 0, max 2000, max_delta_percent None), `v02/db/seed/source-data/warning-indicators.json` (neue Indikator-Zeile)
- Test: `v02/intelligence/tests/test_adapters.py`

**Interfaces:**
- Consumes: `BaseAdapter`, `IngestionItem`, Muster `dwd.py`.
- Produces: Indikator `wi-nina-zivilschutz-de` — Anzahl aktiver MoWaS-Zivilschutzmeldungen bundesweit. Quelle: `https://warnung.bund.de/api31/mowas/mapData.json` (JSON-Array; Felder pro Eintrag u. a. `severity` ∈ {"Minor","Moderate","Severe","Extreme"}, `type`).

- [ ] **Step 0: API-Verifikation (Fakten-Treue, VOR dem Code):** `curl -s https://warnung.bund.de/api31/mowas/mapData.json | head -c 2000` — Struktur und Feldnamen bestätigen. Weicht die Struktur ab → Adapter an die echte Struktur anpassen, nicht an diesen Plan.
- [ ] **Step 1: Failing Test** (Muster DWD-Test):

```python
def test_nina_adapter_counts_active_warnings(monkeypatch):
    from src.adapters.nina import NINAAdapter

    response = MagicMock()
    response.status_code = 200
    response.json.return_value = [
        {"severity": "Severe", "type": "Alert"},
        {"severity": "Minor", "type": "Alert"},
    ]
    response.raise_for_status = lambda: None
    monkeypatch.setattr("src.adapters.nina.requests.get", lambda *a, **k: response)

    adapter = NINAAdapter()
    items = adapter.fetch_latest()
    assert len(items) == 1
    assert items[0].indicator_id == "wi-nina-zivilschutz-de"
    assert items[0].current_value == 2.0
```

- [ ] **Step 2:** Run: `python -m pytest tests/test_adapters.py -k nina -v` — Expected: FAIL.
- [ ] **Step 3: Implementierung** — `nina.py` nach dem Gerüst von `dwd.py`: `source_class="behoerde"`, `requires_api_key=False`, `output_target="indicators"`, `super().__init__("NINA")`. `fetch_latest`: GET mit Timeout 20 + User-Agent, `count = len(data)`, Severity-Verteilung in die Beschreibung, `current_value=float(count)`, `current_value_date=utcnow().isoformat()`, `source_period_type="datetime"`, `germany_relevance` (direct, systems `["gesellschaft","infrastruktur"]`, `time_to_impact="kurzfristig"`), `severity_suggestion` aus max-Severity (Extreme→"kritisch", Severe→"erhöht", sonst "beobachten"; Kanon aus `validation.py` prüfen). Fehlerpfad: `record_source_error("wi-nina-zivilschutz-de", ..., keep_previous=True)`.
- [ ] **Step 4:** `main.py`-Liste, Registry-Eintrag (Freshness z. B. `daily`), Plausibility-Rule, Seed-Zeile in `warning-indicators.json` (Form einer bestehenden Zeile kopieren: name „NINA Zivilschutzmeldungen (aktiv)", unit „Meldungen", `threshold_warn: 25`, `threshold_critical: 100` **[ANNAHME, konservativ — im Review nachschärfen]**, `scale_direction: "higher_is_worse"`, kein `headline_tier`).
- [ ] **Step 4b (Befund aus Task-1-Review):** `wi-dwd-warnings-de` hat KEINE Seed-Zeile (Adapter schreibt heute ins Leere, rowcount 0). Zweite Seed-Zeile ergänzen: name „DWD Warnlage (höchste aktive Stufe)", unit „Warnstufe (0–5)", `threshold_warn: 3`, `threshold_critical: 4`, `scale_direction: "higher_is_worse"`, kein `headline_tier`. Plausibility-Rule `wi-dwd-warnings-de`: min 0, max 5, max_delta_percent None.
- [ ] **Step 5:** Run: `python -m pytest tests/ -v` — Expected: alle PASS. Danach `cd v02 && pnpm verify` (seed dry-run validiert die neue JSON-Zeile).
- [ ] **Step 6: Commit** — `git commit -am "feat: NINA MoWaS adapter for civil protection warnings"`
- [ ] **HUMAN GATE (Jean):** `pnpm db:seed` auf Prod, damit die Indikator-Zeile existiert (sonst skippt `insert_draft` das UPDATE mit rowcount 0).

---

### Task 10: PWA-Manifest + Startseiten-Teaser

**Files:**
- Create: `v02/web/app/manifest.ts`, `v02/web/public/icon.svg`
- Modify: `v02/web/app/layout.tsx` (themeColor via `viewport`-Export, falls nicht vorhanden), `v02/web/app/page.tsx` (Radar-Teaser-Link)

**Interfaces:**
- Produces: `manifest.ts` als `MetadataRoute.Manifest`: name „WachSam Krisenradar", short_name „WachSam", `start_url: "/radar"`, `display: "standalone"`, `background_color: "#0D0D0D"`, `theme_color: "#0D0D0D"`, icons: `{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }` (PNG-Icons später; SVG reicht für Chrome/Android-Installierbarkeit — iOS-Homescreen nutzt `apple-touch-icon`, als Folgeaufgabe notieren).

- [ ] **Step 1:** `icon.svg` erstellen: 512×512, dunkler Hintergrund `#0D0D0D`, Radar-Kreis + Punkt in `#D4540A` (einfaches, sauberes SVG von Hand — 10 Zeilen).
- [ ] **Step 2:** `manifest.ts` + ggf. `viewport`-Export in `layout.tsx`. Auf der Startseite nach dem `Verdict`-Block einen Teaser: Karte „Neu: Das WachSam-Radar — alle Themen mit Warnstufe auf einen Blick" → Link `/radar` (bestehende Karten-Klassen wiederverwenden).
- [ ] **Step 3:** Run: `pnpm --filter web build` — Expected: PASS; `/manifest.webmanifest` erscheint im Build-Output.
- [ ] **Step 4: Commit** — `git commit -am "feat: PWA manifest, app icon and radar teaser on home"`

---

### Task 11: Gesamt-Gate + PR

- [ ] **Step 1:** Run: `cd v02 && pnpm verify` — Expected: PASS (tsc, eslint, build, drizzle generate, seed dry-run, Unit-Tests).
- [ ] **Step 2:** Run: `cd v02/intelligence && python -m pytest` — Expected: PASS.
- [ ] **Step 3:** Run: `cd v02 && pnpm smoke:ui` — Expected: PASS (desktop + mobile Projekte).
- [ ] **Step 4:** Security-Check: `git diff main --stat` reviewen; keine Secrets, `.env` unangetastet.
- [ ] **Step 5:** Push + PR gegen `main` mit Zusammenfassung (Deltas, HUMAN GATES: Migration + Seed vor Rebuild). `gh pr create`.

---

### Task 12: Deploy + Live-Verifikation

- [ ] **Step 1 (HUMAN GATE, Jean):** PR-Review + Merge; auf Prod: Migration (`regional_warnings`) und Seed (NINA-Indikator) anwenden — Reihenfolge: Migration → Seed → Rebuild (VPS-Deploy-Pfad: Live-Stack `/opt/wachsam/docker-compose.v02.yml`, Build-Context `/opt/wachsam/v02`).
- [ ] **Step 2:** Deploy auslösen (Deploy-Workflow, wie bei bisherigen Releases).
- [ ] **Step 3: Live-Smoke** (wachsam-browser-smoke-tester): `https://wachsam.ruhrlogik.de/radar` — Themenkarten mit echten Stufen sichtbar, keine Console-Errors, RegionSwitcher setzt Cookie und regionalisiert Warnlage; `/woche` lädt; Manifest erreichbar (`/manifest.webmanifest`); Mobile-Viewport geprüft.
- [ ] **Step 4:** Nach nächstem Scheduler-Lauf (06:00/18:00 UTC) prüfen: `regional_warnings` gefüllt, NINA-Indikator hat `current_value` (Quellenansicht /status bzw. /quellen).
- [ ] **Erst danach** gilt irgendetwas als „live/erledigt".

---

## Self-Review (durchgeführt)

- Spec-Abdeckung: Delta 1 → Tasks 1–3; Delta 2 → Tasks 4–6; Delta 4 (€) → Task 7; Delta 3 (Woche) → Task 8; NINA → Task 9; PWA → Task 10; Deploy → 11–12. GIE entfällt (bereits vorhanden als `bnetza.py`).
- Bewusste Nicht-Ziele (YAGNI): keine automatische Themen-Clusterung, keine Push-Benachrichtigungen, kein Accounts-Ausbau, keine neue Severity-Persistenz, keine PLZ-genaue Region.
- Typkonsistenz: `ThemeState`/`ThemeZone`/`RadarTheme` in Tasks 1–3/6–8 identisch benannt; Python-Records `region_code/warning_count/max_level/source` in Tasks 4/5 deckungsgleich mit SQL-Spalten.
- Bekannte Unschärfen, absichtlich als Verifikationsschritte kodiert (kein Raten): exakte `computeZone`-Signatur (Task 2 Step 1), DWD-`stateShort`-Codes (Task 5 Step 5 → Task 6), NINA-API-Struktur (Task 9 Step 0), Einheit Gaspreis-Indikator (Task 7).
