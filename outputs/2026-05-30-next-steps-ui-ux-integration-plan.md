# Überholt — nur historischer Planungsstand

> Der aktive Einstieg ist das Haushalts-Cockpit. Maßgeblich sind `docs/product-current.md` und `docs/ui-standard.md`; dieses Dokument darf keine neue UI-Entscheidung begründen.

# WachSam Next Steps — App Roadmap und UI/UX Integration

Stand: 2026-05-30. Repo: `LogikRuhr/WachSam-Krisenradar`. HEAD: `a60660f`.

## Ziel

Die naechsten Wellen stellen zuerst technische Verlaesslichkeit her und integrieren danach v02 sichtbar gegen Brand, Stitch-Screens, Live-Daten und Editorial-Trust-Layer. Jede Welle bleibt ein eigener kleiner Scope.

## Welle 1 — Foundation: Verify und CI

Ziel: CI prueft nicht nur das Root-Secret-Gate, sondern den echten v02-Produktstand.

Scope:

- CHANGE `.github/workflows/verify.yml`
- optional CHANGE `docs/verification.md`

Akzeptanz:

- GitHub Actions laufen `bash scripts/verify.sh`.
- GitHub Actions installieren Node/pnpm und laufen `cd v02 && pnpm run verify`.
- CI prueft TypeScript, ESLint, Next Build, Drizzle Generate, Seed Dry-Run und Audit-Invariants.

Verify lokal:

- `bash scripts/verify.sh`
- `cd v02 && pnpm run verify`

## Welle 2 — Stitch-First UI/UX Integration

Ziel: v02-Routen gegen die vorhandenen Stitch-Screens, `docs/brand.md` und `docs/ui-standard.md` ausrichten. Stitch ist Layout-Skelett, nicht 1:1-Codequelle.

Stitch-Quelle:

- `.superpowers/stitch-2026-05-22/design-system-industrial-intelligence-ui.md`
- `.superpowers/stitch-2026-05-22/complete-webapp-design-system-v03.html`
- `.superpowers/stitch-2026-05-22/screen-manifest.json`

Route-Mapping:

| v02 Route | Stitch-Anker | Fokus |
|---|---|---|
| `/` | `lagebild-synthese.html`, `lagebild-aufklaerung-first.html`, `uxa-v4-ruhrlogik-synthesis.html` | Lage-Headline, Pfad-Hub, ruhige Synthese |
| `/lagebild` | `01-lagebild-deutschland.html`, `lagebild-editorial-industrial.html` | Zehn Systembereiche, Kartenstruktur, Trust-Footer |
| `/kosten` | `02-kostenradar.html` | Haushaltskosten, Live-Indikator-Verweise |
| `/versorgung` | `03-versorgungsradar.html` | Versorgungsrisiken, Werkzeug-Route |
| `/kaskaden` | `04-wirkungsketten-methodik.html` | Kettenuebersicht, Methodik-Lesehilfe |
| `/kaskaden/[id]` | `04-wirkungskette-detail-v2.html` | Wirkungskette Detail, Quellen, Deutschland-Bezug |
| `/massnahmen` | `05-buergermassnahmen.html` | ruhige Pruefschritte, keine Beratung |
| `/quellen` | `06-quellen-methodik.html`, `06-quellen-transparenz.html` | Quellen- und Methodiktransparenz |
| `/governance` | `07-governance.html` | Governance-Liste |
| `/governance/[id]` | `07-governance-detail.html` | Versprechen vs. Realitaet |
| `/indikatoren` | `08-fruehwarn-doku.html` | Live-Werte, Schwellen, Zonen |
| `/indikatoren/[id]` | `08-indikator-detail.html` | Detail, Schwellen, Live-Wert-Spur |
| `/deutschland-relevanz/[id]` | `deutschland-relevanz-detail.html`, `global-signals-to-germany-map-v03.html` | Signal zu Deutschland-Auswirkung |
| spaeter `/karte` | `deutschland-infrastruktur.html`, `global-hotspot-karte.html` | Deutschland-Karte nach eigener Spec |

Erster UI-Code-Scope:

- CHANGE `v02/web/app/page.tsx`
- CHANGE `v02/web/app/lagebild/page.tsx`
- CHANGE `v02/web/app/indikatoren/page.tsx`
- CHANGE `v02/web/app/kaskaden/page.tsx`
- CHANGE shared components nur bei wiederholtem Pattern-Bedarf

Verify:

- `cd v02 && pnpm run verify`
- Browser-Smoke Desktop und Mobile
- `bash scripts/verify.sh`

## Welle 3 — Live-Daten sichtbar machen

Ziel: vorhandene Live-Werte als ruhige Frische- und Schwellenwertspur sichtbar machen, ohne Realtime- oder Alarm-Versprechen.

Live-Daten-Matrix:

| Quelle/Adapter | Indicator | UI-Ort | Anzeige |
|---|---|---|---|
| BNetzA / GIE AGSI+ | Gasfuellstand | `/indikatoren`, `/lagebild` Energie-Bezug | Wert, Stand, letzte Abfrage, Zone |
| Destatis VPI | Inflation/VPI | `/indikatoren`, `/kosten`, optional Lagebild | YoY-Wert, Monat, Schwelle 3/5 Prozent |
| EIA Brent | Rohölpreis | `/indikatoren`, `/kosten` Mobilitaet/Energie | USD/Barrel, Datum, Zone |
| FAO Food Price Index | Lebensmittelpreise | `/indikatoren`, `/kosten`, Lagebild Lebensmittel | Indexwert, Monat, Zone |
| Tankerkoenig | Super E10, Diesel | `/indikatoren`, `/kosten` Mobilitaet | EUR/Liter, Datum, Baseline/Krisenreferenz |

UI-Regeln:

- Kanonische Labels: `Aktueller Wert`, `Stand des Werts`, `Letzte Abfrage`, `Quelle`.
- Keine Labels wie `Realtime`, `Live Feed`, `gerade eben`.
- `last_ingested_at` ist technische Abfragezeit, nicht Quellenstand.
- `current_value_date` ist Stand des Werts.
- `editorial_reviewed_at` ist redaktionelle Pruefung.

Akzeptanz:

- Jeder sichtbare Live-Wert zeigt Wert und Stand.
- Jede Live-Karte zeigt mindestens eine Quelle.
- Fehlende Werte zeigen eine ruhige Fallback-Zeile, keinen leeren Platz.

## Welle 4 — Trust und Editorial Layer

Ziel: Frische, Quelle und redaktionelle Verantwortung sichtbar trennen.

Scope:

- Source-Pills: Quellenname + Quellenstand.
- Kartenfooter: letzte redaktionelle Pruefung.
- Ingestion-Status: klein, mono, ruhig (`live`, `stale`, `error` als technische Statusbegriffe oder deutsch lokalisierte Pendants).
- Admin/Editorial: Publish/Review-Status nur auf Admin-Routen prominent.

Akzeptanz:

- Keine Karte vermischt Quellenstand und Abfragezeit.
- Fehlerstatus ist Transparenz, kein Alarmbanner.
- Mobile Umbrueche bleiben stabil.

## Welle 5 — Haushaltsprofil und Modus

Ziel: Modus-Switcher gegen persistentes Profil absichern.

Scope:

- Pruefen: `v02/web/components/ModusSwitcher.tsx`, `v02/web/app/profil/page.tsx`, `v02/web/lib/profile.ts`.
- Modus beeinflusst Sprache/Priorisierung, nicht Daten, Severity oder Quellen.
- Default ohne Login bleibt modusfrei.

DSGVO:

- Keine PII fuer oeffentliche Daten.
- Profil bleibt datensparsam: Haushaltsmodus/Settings, keine Namen in Public-Data.

Verify:

- `cd v02 && pnpm run verify`
- Auth-/Profil-Smoke, sobald vorhanden.

## Welle 6 — Deutschland-Karte

Ziel: Karte erst spezifizieren, dann bauen.

Offene Entscheidung:

- Bundeslaender-Detailkarte fuer Deutschland-Auswirkungen
- oder globale Signalpfade mit Deutschland-Fokus
- statisch oder interaktiv

Spec muss klaeren:

- Datenmodell: Region, Systembereich, Kaskade, Quelle, Stand.
- UI-Route: eigene `/karte` oder Integration in `/deutschland-relevanz/[id]`.
- Quelle der Kartengeometrie und Lizenz.
- Mobile-Fallback ohne horizontales Scroll-Chaos.

Stitch-Anker:

- `deutschland-infrastruktur.html`
- `global-hotspot-karte.html`
- `global-signals-to-germany-map-v03.html`
- `deutschland-relevanz-detail.html`

## Welle 7 — Benachrichtigungen

Ziel: Resend-Notifications erst nach Editorial-Gate.

Regeln:

- Opt-in.
- Frequenzgrenzen.
- Unsubscribe.
- Nur redaktionell gepruefte Veraenderungen.
- Keine Panik-Sprache.

Stitch-Anker:

- `blueprint-benachrichtigungen.html`
- `blueprint-member-dashboard.html`

## Welle 8 — Content Operations

Ziel: Betrieb der Quellen und redaktionellen Pruefung planbar machen.

Scope:

- Adapter-Laufplan.
- Stale-/Error-Fenster je Quelle.
- Redaktionelle Prueffristen.
- Admin-Audit fuer Publish/Reject.
- Keine automatische Veroeffentlichung aus Crawler-Output.

## Welle 9 — Deploy und Monitoring

Ziel: Produktionspfad beweisbar machen.

Scope:

- Deploy-Workflow pruefen.
- VPS-Smoke: `wachsam-web` up, `wachsam-postgres` healthy.
- Public Smoke: `https://wachsam.ruhrlogik.de`.
- DB-Sanity: wichtige Indicators vorhanden, Sources/Item-Sources plausibel.

Kein Deploy ohne:

- `bash scripts/verify.sh`
- `cd v02 && pnpm run verify`
- Produktions-Smoke nach Deploy

## Welle 10 — Release/Cutover-Readiness

Ziel: v02 als Produktstand freigabefaehig machen.

Checkliste:

- CI gruen.
- UI Desktop/Mobile geprueft.
- Live-Daten-Spur sichtbar und nicht alarmistisch.
- Editorial-Gate dokumentiert.
- DSGVO- und Security-Review fuer Auth/Profile/Notifications.
- Session-Briefs aktualisiert.

## Risiken

- `docs/brand.md` und `docs/ui-standard.md` enthalten noch v01-Referenzen; v0.3-Sektionen sind fuer v02 massgeblich.
- Stitch-Dateien liegen in `.superpowers/` und sind lokal/ignoriert; keine 1:1-Codeuebernahme.
- CI kann wegen Node/pnpm-Version oder fehlendem Lockfile-Setup scheitern; Root Cause vor Fix.
- UI darf keine Daten erfinden. Nur bestehende DB-/Seed-/Adapter-Felder nutzen.
