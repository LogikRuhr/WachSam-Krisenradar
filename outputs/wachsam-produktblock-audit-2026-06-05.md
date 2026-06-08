# WachSam Produktblock — Audit, Offene-Punkte-Register & PR-Plan (2026-06-05)

Stand `main` = `267956b` · Audit read-only · PR A bereits implementiert (Branch `feat/public-ux-clarity`, Commit `28092d8`, **nicht gemergt/gepusht**).

---

## 1. Gesamtstatus

WachSam ist **technisch lauffähig und produktiv** (v02 live auf wachsam.ruhrlogik.de): Next.js-15-Public-App
+ Editorial-CMS + Auth (Magic Link) + Python-Intelligence mit 6 aktiven Adaptern. Die öffentliche Story ist
**stark und brand-konform** (ruhig, deutsch, nicht alarmistisch, 10-Sekunden-Verständnis erfüllt). Die größten
Hebel liegen jetzt nicht in „funktioniert es", sondern in **Nutzwert-Tiefe**: Member-Bereich, persönliche
Relevanz, visuelle Erklärbarkeit und Datenquellen-Härtung.

**Reife je Bereich:** Public-Story 🟢 · UI-Sprache 🟢 (Slug-Leaks via PR A geschlossen) · Auth/Profil 🟢 ·
Personalisierung 🟡 (aktiv, aber flach; PLZ ungenutzt) · Member-Dashboard 🔴 (nur `/profil`-Form) ·
Editorial-Flow 🟢 (draft→approved→published + Audit, kein Auto-Publish) · Datenquellen 🟡 (6 aktiv, 2 Lücken) ·
Visualisierung 🟡 · CI 🟡 (Live-API-Flakes).

---

## 2. Datenquellen-Statusmatrix

| Quelle | Adapter | Indikator(en) | Zustand | Fehlerursache | previous_value | Prio |
|---|---|---|---|---|---|---|
| Destatis GENESIS | `destatis.py` | wi-inflation-vpi-de | aktiv, Fallback bei Fehler | HTTP 401? (Credentials-Header) | ✅ | hoch |
| GIE AGSI+ | `bnetza.py` | wi-gasspeicher-fuellstand | aktiv (live-verifiziert) | Fallback liefert immer Item | ✅ | hoch |
| EIA OpenData | `eia.py` | wi-oel-brent | aktiv | **kein Key-Guard** → unnötige 403 | ✅ | hoch |
| FRED | `fred.py` | wi-gaspreis-europa | aktiv | HTTP 400? (Fallback robust) | ✅ | hoch |
| FAO | `fao.py` | wi-fao-food-price-index | aktiv | URL-Fragilität, User-Agent-Spoofing | ✅ | mittel |
| Tankerkönig | `tankerkoenig.py` | wi-kraftstoffpreis-super-e10 / -diesel | aktiv (live 06/01) | `no_valid_stations` möglich | ❌ **None hardcoded** | hoch |
| Eurostat HICP | `eurostat.py` | — (Stub) | API gerufen, Response verworfen | `TODO` (pass) | n/a | deaktiviert lassen |
| WarningIndicators | `warning_indicators.py` | — (redundant) | doppelt zu EIA | Redundanz | n/a | konsolidieren |

**Bestätigt:** Plausibilitäts-Gate (C1–C4) ist **rein Shadow** — keine DB-Writes, kein Block-Pfad, nur JSON-Logs.
C4-Quellfehler-Sichtbarkeit (W6a.1) vollständig. **Beobachtbarkeitslücken vor W6b:** C3 im Dry-Run nicht prüfbar
(DB-Schwellen=None); C2 für Tankerkönig nicht prüfbar (kein previous_value); C1/C2 ohne echte Ausreißer noch unbelegt.

**Editorial/CI:** draft→approved→published + reject(reason) + unpublish + `editorial_audit_log` vollständig,
**kein Auto-Publish**. CI = `verify.yml` (source-gate · app-verify · intelligence-verify) + manuelles `deploy.yml`.
`intelligence-verify` ruft echte APIs (Destatis/BNetzA/FAO/Eurostat-Live) → **flaky**. Playwright-Smoke **nicht** in CI.
**Architektur-Hinweis (R1):** Indikator-Zahlenwerte gehen ohne Editorial-Review direkt public (mit `source_stand`);
das ist by-design, aber genau der Pfad, den W6b später absichern soll.

---

## 3. Offene-Punkte-Register

P0 = blockiert Produktklarheit/Datenqualität/Testnutzerfähigkeit · P1 = hoher Nutzwert, kein harter Blocker ·
P2 = sinnvoll später · P3 = Idee/beobachten.

| # | Offener Punkt | Bereich | Status | Risiko | Nutzerwert | Aufwand | Abhängigkeit | Entscheidung nötig | PR-Block | Prio |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `aufwand`-Slug roh in UI | UX | **erledigt (PR A)** | — | mittel | S | — | nein | A | P0→done |
| 2 | doppelte `systemLabels`-Maps | UX/Code | **erledigt (PR A)** | — | niedrig | S | — | nein | A | P1→done |
| 3 | redundanter „Profil"-Nav-Tab | UX | **erledigt (PR A)** | — | niedrig | S | — | nein | A | P1→done |
| 4 | Member-Dashboard fehlt (nur `/profil`-Form) | Member | offen | niedrig | hoch | M | — | nein | B | **P0** |
| 5 | Personalisierung flach; PLZ gespeichert, ungenutzt | Personalisierung | offen | niedrig | hoch | M | — | teilweise (PLZ-Nutzung) | B/C | P1 |
| 6 | Methodik-Popover „Wie entsteht dieser Wert?" | Erklärbarkeit | offen | niedrig | hoch | M | — | nein | A/E | **P0** |
| 7 | Confidence-/Quellen-Chip (Quellenzahl + verbale Sicherheit) | Transparenz | offen | niedrig | hoch | M | — | nein | A/F | **P0** |
| 8 | „Stand"-Datum konsistent an jedem Wert | Transparenz | teilweise | niedrig | mittel | S | — | nein | A/D | P1 |
| 9 | Wirkungsketten-Explorer (Haushalt-zentriert) | Visualisierung | offen | mittel | hoch | L | Datenmodell | **ja** (ggf. DB-Felder) | E/B | P1 |
| 10 | Tankerkönig ohne previous_value (C2 blind) | Datenquellen | offen | mittel | mittel | M | API-Polling/Historie | nein (read-only Härtung) | D | **P0 vor W6b** |
| 11 | C3 im Dry-Run nicht beobachtbar (Schwellen=None) | Datenquellen | offen | mittel | niedrig | M | DB-Schwellen | **ja** | D | P1 vor W6b |
| 12 | Destatis(401/404)/FRED(400) API-Status klären | Datenquellen | offen | mittel | mittel | M | Live-Prüfung | nein | D | P1 |
| 13 | EIA Key-Guard fehlt (unnötige 403) | Datenquellen | offen | niedrig | niedrig | S | — | nein | D | P1 |
| 14 | Eurostat Stub / WarningIndicators redundant | Datenquellen | offen | niedrig | niedrig | S | — | nein | D | P2 |
| 15 | Live-API-Tests in CI (flaky) | CI | offen | mittel | niedrig | M | — | nein | G | P1 |
| 16 | Playwright-Smoke nicht in CI | CI | offen | niedrig | niedrig | M | — | nein | G | P2 |
| 17 | validation_errors im Admin sichtbarer | Editorial | offen | niedrig | mittel | M | — | nein | F | P2 |
| 18 | verwaiste Branches (lokal+remote) | Repo-Hygiene | offen | niedrig | — | S | Merge-Status klären | nein | 0 | P1 |
| 19 | unmergte UX-Arbeit `feat/eingangstuer-…` reconcilen | Repo | offen | mittel | mittel | M | Inhalt prüfen | nein | 0 | P1 |
| 20 | Lag-Engine-Arbeit `feat/data-methodik-…` reconcilen | Datenmethodik | offen | mittel | mittel | M | Diff-Prüfung | nein | 0/D | P1 |
| 21 | W6b Active Gate | Datenqualität | **gesperrt** | hoch | mittel | L | #10,#11 + Shadow-Audit | **ja (explizit)** | — | gesperrt |
| 22 | source_health-Tabelle/Badge | Datenqualität | später | mittel | mittel | L | W6b | **ja** | — | gesperrt |
| 23 | UI-Anomaly-Badge | UX | später | mittel | niedrig | M | source_health | **ja** | — | gesperrt |
| 24 | Hyperpersonalisierung (Planungsmodule) | Member | konzipiert | niedrig | hoch | L | B-Grundgerüst | teilweise | C | P1 |

---

## 4. PR-Plan (Phase 7)

Schnitt nach **Produktnutzen** und **ohne Scope-Mix**. Reihenfolge = Priorität.

### PR A — Public UX / Sprach- & Navigations-Klarheit · ✅ implementiert
- **Ziel:** roher Slug raus, eine Label-Quelle, Navigation entrümpeln.
- **Dateien:** `lib/personalization.ts`(+test), `app/massnahmen/page.tsx`, `components/SignalChain.tsx`,
  `components/CascadeCausalityMap.tsx`, `app/kaskaden/[id]/page.tsx`, `components/TopNav.tsx`.
- **Akzeptanz:** keine rohen Slugs in Public-UI; `pnpm run verify` grün; keine Designänderung.
- **Risiko:** minimal. **Freigabe/Migration/Deploy:** nein/nein/nein. **Merge:** Empfehlung ja (nach Review).

### PR E (Teil 1) — Erklärbarkeit: Methodik-Popover + Confidence/Quellen-Chip + Stand-Datum
- **Ziel:** Vertrauen & Verständnis ohne neue Datenquellen (P0-Hebel aus Worldmonitor-Analyse).
- **Scope:** wiederverwendbares „Wie entsteht dieser Wert?"-Popover; Confidence-Chip mit Quellenzahl + verbaler
  Sicherheit; konsistentes „Stand TT.MM."-Pattern. **Nur vorhandene Felder** (confidence, sources, source_stand).
- **Dateien (grob):** neue `components/MethodikPopover.tsx`, `components/ConfidenceSourceChip.tsx`; Einbau in
  Indikator-/Kaskaden-/Signal-Karten; CSS-Tokens in `globals.css` (Industrial Dark, kein Blink).
- **Akzeptanz:** Popover tastatur-/`prefers-reduced-motion`-konform; keine „Live"-Optik; verify grün.
- **Risiko:** niedrig. **Freigabe:** nein. **Migration/Deploy:** nein.

### PR B — Member-Bereich „Mein Bereich" Grundgerüst
- **Ziel:** angemeldeter Testnutzer bekommt eine eigene Übersicht — mit **vorhandenen** Feldern (modus/heizart/plz).
- **Scope:** `/profil` zu „Mein Bereich" ausbauen: Profilstatus-Karte (was ist gesetzt/fehlt, ruhig erklärt),
  persönliche Relevanz-Sicht („Was betrifft mich?" aus `personalNote` + Heizart/Modus), Cross-Links zu Maßnahmen;
  klare „Was WachSam nicht leistet"-Notiz. **Keine neuen Felder, keine neue Speicherung.**
- **Dateien (grob):** `app/profil/page.tsx` + neue Member-Komponenten; ggf. `lib/personalization.ts` (Relevanz-Sortierung).
- **Akzeptanz:** Login→Übersicht→Profil bearbeiten→persönliche Hinweise sichtbar; DSGVO-Text passt; verify grün.
- **Risiko:** niedrig. **Freigabe:** nein (solange keine neuen Felder). **Migration/Deploy:** nein.

### PR C — Hyperpersonalisierung Stufe 1 (erste persönliche Empfehlungen)
- **Ziel:** aus Profil konkrete, ruhige persönliche Prüf-To-dos ableiten (regelbasiert, kein ML).
- **Scope:** „Für deinen Haushalt relevant"-Liste (priorisierte Maßnahmen nach modus/heizart); optional PLZ **lokal**
  (localStorage) für Themen-Priorisierung. Server-seitige PLZ-Nutzung/Alerts = **Entscheidung nötig**.
- **Risiko:** niedrig (rein ableitend). **Freigabe:** ja, sobald neue Userdaten/Server-PLZ. **Migration/Deploy:** nein.

### PR D — Datenquellen-Statusmatrix + risikolose Adapter-Härtung
- **Scope:** EIA Key-Guard; Eurostat/WarningIndicators formal deaktivieren/markieren; bessere Fehlerklassifikation
  im Shadow-Kontext; `source-inventory.md` aktualisieren; Tankerkönig-previous_value **planen** (nicht bauen).
- **Risiko:** niedrig (keine API-Reparatur, kein Live-Pfad). **Freigabe:** nein. **Migration/Deploy:** nein.
- **Nicht enthalten:** neue Keys, kostenpflichtige Quellen, DB, Active Gate, source_health.

### PR E (Teil 2) — Visuelle Daten- & Kaskadendarstellung
- **Scope:** ruhige Schwellen-/Trendbalken, verbale Severity-Skala, Wirkungsketten-Explorer-MVP (Haushalt-zentriert).
- **Risiko:** mittel (Explorer ggf. Datenmodell → **Entscheidung nötig**). **Migration:** nur bei DB-Feldern → Freigabe.

### PR F — Editorial/Validation-Visibility
- **Scope:** `validation_errors`/Warnings im Admin sichtbar; Quellenstände in Editorial-Detail; öffentliche
  schlanke Methodik-Seiten. **Kein Auto-Publish, keine neue Veröffentlichungslogik.**
- **Risiko:** niedrig. **Freigabe:** nein. **Migration/Deploy:** nein.

### PR G — CI/Smoke/Live-API-Teststabilisierung
- **Scope:** Live-API-Adaptertests mocken oder als separate (nicht-blockierende) Suite markieren; Playwright-Smoke
  optional in CI (nur Public-Seiten, keine Writes); Flaky-Liste dokumentieren.
- **Risiko:** niedrig. **Freigabe:** nein. **Migration/Deploy:** nein.

---

## 5. Member-Bereich → Hyperpersonalisierung (Stufenplan)

1. **Stufe 0 (PR B):** Profil verstehen — Status-Karte, was gespeichert/fehlt, ruhig erklärt.
2. **Stufe 1 (PR B/C):** relevante Haushaltsauswirkungen + passende Maßnahmen nach Profil zeigen.
3. **Stufe 2 (PR C):** erste Planungsfunktion (z. B. persönliche Prüf-Checkliste / Merkliste, lokal).
4. **Stufe 3 (Entscheidung nötig):** Haushalts-/Einkaufs-/Vorsorge-Planer, Wochenbriefing — neue Felder/Versand
   → DSGVO-/DB-Freigabe.

Leitplanken: nur vorhandene/freigegebene Daten, keine PII, keine neue Speicherung ohne Freigabe, keine Prepper-Sprache.

---

## 6. Entscheidungen, die Jean treffen muss

1. **Merge PR A** nach Review (Push + PR-Erstellung brauchen deine Freigabe).
2. **Nächster PR-Block:** Reihenfolge B (Member) vs. E-Teil-1 (Erklärbarkeit-P0) — beide P0-nah.
3. **Tankerkönig-Historie (#10):** read-only previous_value-Lösung planen — Blocker vor W6b.
4. **C3-Beobachtbarkeit (#11):** DB-Schwellen setzen wäre Schema-/Datenfrage → Freigabe nötig.
5. **Wirkungsketten-Explorer (#9)** und **Hyperpersonalisierung Stufe 3:** sobald DB-Felder/Userdaten → Freigabe.
6. **W6b / source_health / UI-Anomaly-Badge:** bleiben gesperrt — keine Umsetzung ohne ausdrückliche Freigabe.

---

## 7. Bestätigung der Grenzen (für diesen Block eingehalten)

- ❌ Kein W6b · ❌ kein Active Gate · ❌ kein source_health · ❌ kein UI-Anomaly-Badge
- ❌ keine Migration · ❌ keine DB-Schema-Änderung · ❌ kein neues Userdatenfeld
- ❌ kein Merge nach main · ❌ kein Push · ❌ kein Deployment · ❌ kein Auto-Publish
- ❌ keine Secrets/API-Keys committet · ❌ keine echten Userdaten in Artefakten · ❌ keine erfundenen Quellen
