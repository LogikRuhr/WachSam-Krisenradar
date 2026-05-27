# UI Standard — WachSam v0.2 + v0.3-Layout

> Component-Patterns für die Multi-Tab-App. Single source für Code: `v01/src/components/` und `v01/src/pages/`.
>
> Aktive UI-Erweiterung ab v0.3: v0.3-Sektion am Ende dieser Datei (Hybrid-Navigation, Editorial-Patterns, Auth-Routen für `v02/`).

## App-Shell und Layout

- Maximalbreite: `max-w-5xl` (1024 px) zentriert.
- Grundflächen folgen den v0.2-Dark-Tokens aus `docs/brand.md` (`--color-page` `#0D0D0D`, `--color-shell` `#111318`, `--color-surface` `#1A1A1A`, `--color-panel` `#141414`).
- Sektion-Padding: `px-4 py-10 sm:px-6 sm:py-12`.
- Grid für Listen: `grid gap-4 sm:grid-cols-2` (Lagebild, Versorgung, Maßnahmen, Governance, Frühwarnindikatoren). Kostenradar und Kaskaden bleiben einspaltig wegen Textlänge.

## App-Struktur

Persistent gerendert über alle Routen (außerhalb des Routers):

1. `SeedBanner` — Banner mit Seed-Marker und Stand
2. `AppShell` — Brand-Header mit Marke „WachSam", Strich-Marker, Stand-Datum
3. `TabNav` — Section-Tabs (8 Bereiche) mit aktiver Rost-Border via `NavLink`
4. `<main><Routes /></main>` — Page-Container
5. `<footer>` — Footer mit ADR-Verweis

Routen (siehe `v01/src/App.tsx`):

| Route | Component | Beschreibung |
|---|---|---|
| `/` | `OverviewPage` | Hero + TodayRelevantSection + Legend als Synthese-Einstieg |
| `/lagebild` | `LagebildSection` | 10 Systembereiche |
| `/kosten` | `CostRadarSection` | Mehrkosten-Items |
| `/versorgung` | `SupplyRiskSection` | Versorgungsrisiken |
| `/kaskaden` | `CascadesSection` | 12 Kaskaden A–L |
| `/kaskaden/:id` | `CascadeDetailPage` | Wirkungskette mit Schritten + Germany-Relevance + Quellen |
| `/massnahmen` | `ActionsSection` | Bürgermaßnahmen |
| `/quellen` | `SourcesFooter` | Quellen- und Methodikpanel |
| `/governance` | `GovernanceSection` | 11 Governance-Fälle |
| `/governance/:id` | `GovernanceDetailPage` | Versprechen-vs-Realität-Detail |
| `/indikatoren` | `WarningIndicatorsSection` | 8 Frühwarnindikatoren |
| `/indikatoren/:id` | `WarningIndicatorDetailPage` | Schwellenwert-Detail |
| `/deutschland-relevanz/:id` | `HotspotDetailPage` | Globales-Signal-zu-DE-Wirkung-Detail |
| `*` | `<Navigate to="/" />` | Fallback |

IONOS-Static-Deploy unterstützt SPA-Fallback bereits via `try_files $uri $uri/ /index.html;` in `infra/ionos/nginx.conf`. Direct-URL-Refresh funktioniert.

## Heute-Relevant-Pattern

Component: `TodayRelevantSection.tsx`. Semantik: `<section aria-labelledby="today-relevant-heading">`. Platz: direkt zwischen `Hero` und `Legend`.

Aufbau:

- Section-Header mit Strich-Marker, Mono-Label „Lesehilfe", H2 „Heute relevant für Haushalte" und einem kurzen Satz zur Leseführung.
- Drei kompakte Entscheidungskarten, mobil einspaltig und ab großer Breite dreispaltig.
- Jede Karte zeigt:
  - eine konkrete Haushaltswirkung,
  - eine kurze Begründung, warum WachSam die zugrunde liegenden Items verbindet,
  - eine Evidenzspur mit Quelle/Stand,
  - den Wirkungspfad `So liest WachSam die Wirkung` mit Signal, Deutschland-Relevanz, Systemstress, Haushaltsauswirkung und Evidenzstärke,
  - sekundäre Audit-Referenzen für bestehende Causal Links,
  - Confidence-Badge,
  - Source-Pills,
  - ruhige Weiterlesen-Anker in bestehende Sections.

Regeln:

- Keine neuen Daten, keine neuen URLs und kein eigener Dashboard- oder Live-Feed-Frame.
- Die Karten dürfen nur bestehende Seed-Items, Quellen, Confidence-Werte und Causal Links zusammenführen.
- Source-Pills müssen mobil umbrechen; horizontales Overflow ist ein Bug.
- `TodayRelevantSection` ersetzt nicht die Detail-Sections und zählt nicht zu den nummerierten Bereichen 1–6.

## Methodology-Visibility- / Wirkungspfad-Pattern

Component: `EffectPath.tsx`. Einsatz: alle UI-Stellen, die bestehende `causalLinks` als Lesehilfe zeigen (`TodayRelevantSection`, `CostRadarSection`, `SupplyRiskSection`, `CascadesSection`). Ziel: Bürger lesen zuerst die Wirkung, nicht technische Link-Metadaten.

Aufbau:

- Container mit Mono-Label `So liest WachSam die Wirkung`.
- Mobile-first vertikale `<ol>`; jeder Schritt nutzt Border-left, kurze Label und umbruchfähigen Text.
- Reihenfolge der Bedeutung:
  1. `Signal / Beobachtung`
  2. `Deutschland-Relevanz`
  3. `Systembereich / Systemstress`
  4. `Haushaltsauswirkung`
  5. `Unsicherheit / Evidenzstärke` mit `ConfidenceBadge` und Hinweis `redaktionelle Einordnung, kein Automatismus.`
- Bestehende `causalLinks` bleiben als sekundäre `Audit-Referenzen` in einem `<details>` sichtbar; dort stehen stabile Link-IDs, Target-Referenz und Relation nur als technische Auditspur, nicht als primäre Lesefläche.

Regeln:

- Keine neuen Datenfelder, URLs, Scores oder Skalen einführen; Texte müssen aus vorhandenen Item-Titeln, Beschreibungen, Bereichen, Unsicherheiten, Confidence und vorhandenen Links ableitbar sein.
- Raw `targetType`, `targetId`, `relation` und Link-IDs dürfen nicht die primäre Bürger-Lesehilfe sein. Sie sind höchstens sekundär und unaufdringlich für Auditierbarkeit.
- Wording bleibt probabilistisch: `kann`, `möglich`, `Kontext`, `kein Automatismus`, `redaktionelle Einordnung`. Keine sicheren Kausalbehauptungen, keine Live- oder Prognose-Sprache.
- Source-Pills, Confidence-Badges, Unsicherheitstexte, Provenance-Footer und bestehende Section-Semantik bleiben neben dem Wirkungspfad sichtbar.
- Mobile ist einspaltig; Labels und Audit-IDs müssen umbrechen (`break-words` / kein `nowrap`).

## Section-Header-Pattern

```tsx
<header className="mb-8">
  <div aria-hidden="true" className="mb-3 h-[3px] w-10 bg-[var(--color-accent)]" />
  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
    Bereich {n}
  </p>
  <h2 className="mt-1 font-display text-4xl tracking-wide text-[var(--color-ink)]">
    {Titel}
  </h2>
  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">
    {kurze Sektions-Erklärung}
  </p>
</header>
```

Der 40 × 3 px Rost-Strich-Marker vor jedem Section-Header ist Pflicht — er ist die strukturelle Klammer aus der RuhrLogik-DNA (siehe `docs/brand.md`). Pro Section genau einer.

## Skalen-Legende-Pattern

Component: `Legend.tsx`. Semantik: `<aside aria-label="Skalen-Legende">`. Platz: direkt zwischen `TodayRelevantSection` und `TableOfContents`, ausserhalb von `<main>`.

Aufbau:

- Eigener Container `max-w-5xl px-6 py-8`.
- Strich-Marker (`h-[3px] w-10 bg-[var(--color-accent)]`) + Mono-Label „Skalen-Legende" als Klammer.
- Darunter zweispaltiges Grid (`sm:grid-cols-2`):
  - Linke Spalte: Mono-Label „Severity", die vier `SeverityBadge` (`stabil`, `beobachten`, `erhoeht`, `kritisch`), darunter ein Sans-Satz, was Severity bedeutet.
  - Rechte Spalte: Mono-Label „Confidence", die drei `ConfidenceBadge` (`niedrig`, `mittel`, `hoch`), darunter ein Sans-Satz, was Confidence bedeutet.

Regeln:

- Genau eine Instanz pro Seite.
- Section-Subleads dürfen Severity und Confidence nicht zusätzlich erklären — die Legende ist die einzige Stelle, an der die Skalen-Definition steht.
- Keine zusätzlichen Skalen-Tokens in der Legende (z.B. keine Trend- oder Zeithorizont-Skala) — diese tragen die Karten-Metazeilen.

## Tab-Navigation-Pattern

Component: `TabNav.tsx`. Semantik: `<nav aria-label="Sektionen">`. Platz: direkt unter `AppShell`, persistent über alle Routen.

Aufbau:

- Container `max-w-5xl px-4 sm:px-6`.
- Acht `NavLink`-Einträge (react-router) als horizontale Tabs.
- Pro Tab: zweistellige Nummer (`text-[var(--color-muted)]`) + Label (`text-[var(--color-ink)]`).
- Aktiver Tab nutzt Rost-Border via `border-b-2 border-[var(--color-accent)]`.
- Inaktiver Tab nutzt `border-transparent`, Hover wechselt auf `text-[var(--color-ink)]`.
- Mono-Schrift, uppercase, tracking-wide.

Tab-Reihenfolge entspricht den nummerierten Bereichen 01–08 in den Section-Headern und der Reihenfolge der Routes in `App.tsx`:

| Nr. | Label | Route | Section-Component |
|---|---|---|---|
| 01 | Lagebild | `/lagebild` | `LagebildSection` |
| 02 | Kosten | `/kosten` | `CostRadarSection` |
| 03 | Versorgung | `/versorgung` | `SupplyRiskSection` |
| 04 | Ketten | `/kaskaden` | `CascadesSection` |
| 05 | Maßnahmen | `/massnahmen` | `ActionsSection` |
| 06 | Quellen | `/quellen` | `SourcesFooter` |
| 07 | Governance | `/governance` | `GovernanceSection` |
| 08 | Indikatoren | `/indikatoren` | `WarningIndicatorsSection` |

Regeln:

- Genau eine Instanz pro App (in `App.tsx`).
- Bei Section-Order-Verschiebung müssen `TabNav.tsx`, die Bereichs-Nummern in den Section-Headern und die Routen-Definition gemeinsam aktualisiert werden — sonst entsteht Drift zwischen Tab-Nummer und Route.

## Karten-Pattern

```tsx
<li className="flex flex-col gap-3 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
  {/* Header-Zeile: Bereichslabel + Severity-Badge oder Zeithorizont */}
  {/* Titel in font-sans text-lg font-semibold (Bebas Neue ist Display-only) */}
  {/* Beschreibungs-Absatz */}
  {/* Primärindikator-Block bzw. Unsicherheits-Hinweis (eingerückte Hervorhebung) */}
  {/* Metazeile: Trend / Zeithorizont · Confidence-Badge */}
  {/* Quellen-Pills */}
  {/* Provenance-Footer (sobald das Item-Schema retrieved_at führt) */}
</li>
```

## Bürgermaßnahmen-Karten-Pattern

Component: `ActionsSection.tsx`. Die Karten formulieren vorhandene `CitizenAction`-Daten als ruhige Prüf- und Orientierungsschritte, nicht als individuelle Notfall-, medizinische, rechtliche oder finanzielle Beratung.

Aufbau pro Karte:

- Kopfzeile mit `Aufwand`-Chip und `Bereich`-Chip; beide dürfen umbrechen.
- Titel aus `action.titel`.
- Block `Nächster Prüfschritt` mit unveränderter `action.beschreibung`.
- Block `Wann relevant` mit den bestehenden Bereichen aus `action.bezugZuBereich`.
- Block `Grenze / Einordnung` mit ruhigem Non-Advice-Hinweis.
- Block `Wirkungsbezug` mit bestehenden `causalLinks`, vorsichtigem Möglichkeits-Wording und sichtbarer Signal-/Deutschland-/Haushalts-Spur.
- Source-Pills aus `action.sources` am Kartenende; sie bleiben klickbar, sichtbar und umbrechend.

Regeln:

- Keine neuen Empfehlungen, URLs, Datenfelder oder abgeleiteten Fakten in der UI erfinden.
- `action.beschreibung`, `action.titel`, `action.aufwand`, `action.bezugZuBereich`, `action.causalLinks` und `action.sources` bleiben sichtbar.
- Wirkungsbezug darf keine sichere Vorhersage behaupten; Labels wie „möglich", „bezogen" und „Prüfschritt" sind dem Advice- oder Kausalitäts-Overclaim vorzuziehen.
- Mobil bleibt die Karte einspaltig; innere Zusatzspalten dürfen erst ab `md` zweispaltig werden und müssen ohne `nowrap` auskommen.
- Source-Pills stehen nach dem Wirkungsbezug und behalten `flex flex-wrap`.

## Provenance-Footer-Pattern

Sobald ein Item-Schema das Pflichtfeld `retrieved_at` (ISO-Datum) führt, rendert die Karte am unteren Rand eine kleine Mono-Meta-Zeile mit dem Stand der redaktionellen Prüfung. Single source für die Daten: das jeweilige JSON in `v01/data/`.

```tsx
<p className="pt-1 font-mono text-xs text-[var(--color-muted)]">
  Letzte redaktionelle Prüfung:{' '}
  <time dateTime={item.retrieved_at}>{formatRetrievedAt(item.retrieved_at)}</time>
</p>
```

Regeln:

- Platz: letzte Zeile innerhalb des `<li>`, **nach** den Quellen-Pills. Spacing `pt-1` zur ruhigen Trennung.
- Stil: `font-mono text-xs text-[var(--color-muted)]` — kein neues Token, gleiche Mono-Meta-Anmutung wie die Bereichs-Labels.
- Wording: **„Letzte redaktionelle Prüfung: {Datum}"** als kanonische Phrase. Klar abgegrenzt von `sources[].stand`, das in den Source-Pills lebt und den Stand der Quelle selbst beschreibt — nicht den der WachSam-Redaktion.
- Datum: deutsches Tagesformat (`d. MMMM yyyy`, z.B. „13. Mai 2026") über `Intl.DateTimeFormat('de-DE')`. Bewusst tagesgenau, damit der Footer-Stand und der Quellen-Stand visuell nicht verwechselt werden.
- Semantik: `<time dateTime={iso}>…</time>` trägt das unveränderte ISO-Datum für Screen-Reader und maschinelle Verarbeitung.
- Komponenten-Disziplin: solange nur ein Dataset (Lagebild) das Feld führt, lebt der Formatter als Inline-Const in der jeweiligen Section. Mit der nächsten JSON-Migration wird er nach `v01/src/lib/` extrahiert — vorher nicht.

Aktuell aktiv in: `LagebildSection`. Andere Sections folgen, sobald ihr Dataset auf JSON migriert ist und `retrieved_at` führt.

## Trust-Layer-Pattern

Wave 2 macht die vorhandene Auditierbarkeit lesbarer, ohne neue Quellen, Datenfelder oder Frischeversprechen einzuführen.

- **Quelle:** sichtbarer externer Beleg oder Kontext (`sources[].name` + Link). Die Quelle belegt den verwendeten Kontext; die Einordnung als Haushaltswirkung ist die WachSam-Übersetzung.
- **Stand der Quelle:** sichtbarer Stand aus `sources[].stand`. Dieser Stand gehört zur Quelle selbst und ist nicht identisch mit einer WachSam-Prüfung.
- **Letzte redaktionelle Prüfung:** sichtbares WachSam-Prüfdatum nur dort, wo das jeweilige Item-Schema `retrieved_at` führt. Kein Ersatzdatum erfinden.
- **Evidenzstärke:** `ConfidenceBadge` zeigt die Evidenzlage der WachSam-Einschätzung (`niedrig`, `mittel`, `hoch`). Sie ist keine Eintrittswahrscheinlichkeit, keine Sicherheit und keine Vorhersagegarantie.
- **Offen / unsicher:** markiert Punkte, die trotz vorhandener Hinweise nicht abschließend bewertet sind. Unsicherheit ist ein Inhaltssignal, kein Darstellungsfehler.

Regeln:

- Source-Pills und Quellenlisten zeigen sichtbar `Quelle:` und `Stand:` und bleiben klickbare externe Links mit Pfeil-Indikator.
- Labels dürfen umbrechen; keine langen `nowrap`-Zeilen in Karten oder Quellenlisten.
- `SourcesFooter` enthält die zentrale Trust-Erklärung und trennt Quelle, Quellenstand, redaktionelle Prüfung, Evidenzstärke und Unsicherheit.

## Pflichtbestandteile pro Item

Jedes Item auf der Seite zeigt mindestens:

1. **Bereichs-Label** (uppercase, muted) — einer der zehn Systembereiche
2. **Severity oder Zeithorizont** sichtbar im Kopf der Karte
3. **Titel** in Sans semibold (Bebas Neue ist Display-only, nicht für lange Item-Titel)
4. **Beschreibung** in Sans, max. drei bis vier Sätze
5. **Confidence-Badge** als Evidenzstärke, nicht als Sicherheits- oder Vorhersageversprechen
6. **Mindestens eine Quelle** als SourcePill (`Quelle:` + Name, `Stand:` + Stand, Pfeil-Indikator)

Fehlt eine dieser sechs Angaben, gehört das Item nicht in den Seed-Datensatz.

Zusätzlich Pflicht, sobald das Item-Schema `retrieved_at` führt (aktuell: Lagebild):

7. **Provenance-Footer** mit Mono-Meta-Zeile „Letzte redaktionelle Prüfung: {Datum}" am Karten-Ende (siehe Provenance-Footer-Pattern oben).

## Detail-Routes-Pattern

Die vier Detail-Pages (`v01/src/pages/`) folgen einem gemeinsamen Layout-Vertrag:

```tsx
<section className="bg-[var(--color-page)]">
  <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
    <Link to="/<parent>" className="…uppercase tracking-[0.18em] text-[var(--color-muted)]">
      ← Zurück zur Liste
    </Link>
    <header className="mt-4 mb-6 sm:mb-8">
      <div aria-hidden="true" className="mb-3 h-[3px] w-10 bg-[var(--color-accent)]" />
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">{Kontext}</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">{Titel}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">{Severity}{Confidence}{Meta}</div>
    </header>
    {/* Layout-spezifischer Inhalt */}
  </div>
</section>
```

Regeln:

- Pflicht: Back-Link via `react-router-dom` `Link`, niemals `<a href=…>` für interne Routen.
- Header nutzt `font-display text-4xl tracking-wide` für den Titel.
- Bei nicht existierender ID: `<Navigate to="/<parent>" replace />` Fallback, nie 404-Hard-Crash.
- Aside-Boxen mit `border border-[var(--color-line)] bg-[var(--color-surface)] p-4`.
- Cross-Links zu anderen Detail-Routes (z.B. Cascade → Hotspot) als `font-mono uppercase tracking-wide text-[var(--color-accent)]`.

Konkret implementiert:

| Page | Quelldatei | Hauptpattern |
|---|---|---|
| `CascadeDetailPage` | `CASCADES[id]` | 3-Spalten-Grid: Wirkungsketten-Liste links (2/3), Aside mit Germany-Relevance + Quellen + linked_items rechts (1/3) |
| `GovernanceDetailPage` | `GOVERNANCE_ITEMS[id]` | Versprechen-vs-Realität (2-Spalten) + Haushaltswirkung-Block + Quellen + Cascade-Link |
| `WarningIndicatorDetailPage` | `WARNING_INDICATORS[id]` | 2-Spalten-DL für Warn-/Kritisch-Schwellen + Germany-Relevance + Quelle + Cascade-Link + „kein Live-Wert"-Hinweis |
| `HotspotDetailPage` | `CASCADES[id]` (germany_relevance-Sicht) | 3-Spalten: Globales Signal / Deutschland-Wirkung / Haushaltswirkung + Systeme + Weiterlesen-Nav |

## Heute-Relevant-Pattern (Anpassung Wave 8.2)

`TodayRelevantSection` lebt jetzt nur noch in `OverviewPage` (Route `/`), nicht mehr als persistente Section auf jeder Seite. Inhalt und Card-Aufbau unverändert (Synthese-Karten mit Evidenzspur, Wirkungspfad, Source-Pills, Weiterlesen-Anker). Weiterlesen-Anker zeigen jetzt auf Routes (`/lagebild`, `/kosten`, `/kaskaden`) statt auf Anker (`#lagebild` etc.); falls noch Anker im Code stehen, mit Router-`Link` und absoluter Route ersetzen.

## Wiederverwendbare Components

In `v01/src/components/` und `v01/src/pages/`:

- `SeedBanner` — Banner ganz oben, persistent über alle Routen
- `AppShell` — Brand-Header mit „WachSam"-Marke, Strich-Marker, Stand-Datum, persistent
- `TabNav` — Section-Tabs (8 NavLinks), persistent direkt unter AppShell
- `OverviewPage` — Default-Route `/`, kombiniert Hero + TodayRelevantSection + Legend
- `Hero` — Strich-Marker, Mono-Label, Bebas-Display-H1, Sans-Subhead. Lebt in OverviewPage.
- `TodayRelevantSection` — drei Haushalts-Entscheidungskarten, lebt in OverviewPage.
- `Legend` — Skalen-Legende für Severity und Confidence, lebt in OverviewPage.
- `LagebildSection`, `CostRadarSection`, `SupplyRiskSection`, `CascadesSection`, `ActionsSection`, `SourcesFooter`, `GovernanceSection`, `WarningIndicatorsSection` — acht Section-Components, jeweils eigene Route.
- `CascadeDetailPage`, `GovernanceDetailPage`, `WarningIndicatorDetailPage`, `HotspotDetailPage` — vier Detail-Pages mit Route-Params.
- `SeverityBadge` — fünf Stufen (stabil, beobachten, erhöht, kritisch, eskalierend) mit v0.2-Dark-Tokens.
- `ConfidenceBadge` — drei Stufen (niedrig, mittel, hoch) als Evidenzstärke.
- `SourcePill` — klickbarer Quellen-Tag mit `Quelle:`-/`Stand:`-Label und externem Pfeil.
- `EffectPath` — Wirkungspfad-Component für `causalLinks`, Audit-Referenzen optional.

## Tailwind v4

- Single source für Farben und Fonts: `@theme`-Block in `v01/src/index.css`.
- Kein `tailwind.config.ts` und kein `postcss.config.*` im v0.2-Projekt.
- Custom-Tokens werden mit `bg-[var(--color-…)]`-Schreibweise referenziert.
- PostCSS-Auto-Discovery wird in `v01/vite.config.ts` deaktiviert (`css.postcss.plugins: []`), damit Vite keine PostCSS-Konfiguration aus übergeordneten Verzeichnissen lädt.

## Accessibility-Mindeststandard

- Klickbare Quellen-Links: `rel="noopener noreferrer"`, sichtbarer Pfeil-Indikator, beschriftendes `title`.
- Externes Linkziel: alle Quellen öffnen in neuem Tab.
- Interne Routen-Links: `react-router-dom` `Link` oder `NavLink` — niemals `<a href>` mit interner Route.
- Listen sind als `<ul>` oder `<ol>` strukturiert, nicht als Divs.
- Headings folgen der Hierarchie h1 → h2 → h3, kein Sprung. Detail-Pages haben ein h1, Section-Pages ein h2 (h1 ist der Brand-Marker in AppShell).
- Kontraste der v0.2-Dark-Palette erfüllen mindestens WCAG AA für Body-Text.

## Was die UI in v0.2 NICHT enthält

- Keine Tooltips, Modals oder Hover-Karten als Layout-Mechanik
- Kein Theme-Switch — nur Dark-Theme (v0.2 ist Dark-First; v0.1-Light ist historisch).
- Keine State-Library — Datei-Imports und URL-Params reichen
- Keine User-Auth, Member-Funktionen oder Live-Daten in Public-v0.2 (siehe `docs/DESIGN.md` §Produktstruktur).
- Keine Animations-Loops, pulsierende Alarme oder Dauerpuls.

## Was vor jedem UI-Edit zu prüfen ist

1. Folgt das Pattern dem Karten-, Section- oder Detail-Routes-Schema oben?
2. Sind alle Brand-Farben aus Tokens, nicht hartcodiert?
3. Hat das neue Element Confidence und mindestens eine Quelle, falls es ein Item ist?
4. Bleibt die Seite einspaltig in Mobile-Breite (`sm` Breakpoint)?
5. Wenn neuer interner Link: `<Link to="/...">` statt `<a href>`?
6. `bash scripts/verify.sh` PASS?

## v0.3-Layout — Backend-Anbindung, Lage-Headline, Hybrid-Nav (2026-05-22)

v0.3 verlagert die Produktrunntime nach `v02/` (Next.js 15 + Postgres 16 + Drizzle + Auth.js + Resend, dokumentiert in ADR-034). `v01/` bleibt für Referenz und Hard-Cutover stehen. Dieser Abschnitt definiert die UI-Patterns, die v0.3 zusätzlich zu den v0.2-Patterns oben einführt. Brand-DNA und Section-Header-, Karten-, Trust-Layer-, Provenance-Footer-, Detail-Routes- und Accessibility-Regeln aus v0.2 bleiben gültig.

### Default-Screen 00: Lage-Headline

Neue Default-Route in v0.3 ist `/` mit `LageHeadlinePage`. Inhalt:

- **Strich-Marker** (40 × 3 px Rost) wie alle Section-Header.
- **Mono-Label** „Heute im Fokus" — kanonische Phrase, persona-frei, ruhig. Niemals „Heute brennt", „Akute Lage" oder „Aktuelle Krise".
- **Headline** in Bebas Neue, ein Satz, der die aktuell führende Wirkungskette in Bürger-Sprache benennt (Beispiel: „Energiekosten verstärken Lebensmittelpreise").
- **Sub-Lead** in Plex Sans, zwei bis drei Sätze, mit Verweis auf die zugrundeliegende Kaskade und das Zeitfenster.
- **Primärer CTA** „Ganze Kette lesen" als Router-Link auf `/v02/kaskaden/:id`. Mono, uppercase, tracking-wide, Rost-Akzent — kein gefüllter Button.
- **Sekundärer Block: Pfad-Hub** direkt unter der Headline (siehe unten).

Regeln:

- Eine Headline pro Render, niemals Liste.
- Quelle der Headline-Auswahl: redaktioneller Pin in der Datenschicht (`featured_cascade_id` oder gleichwertig). Kein Auto-Ranking, kein Severity-Sort. Welche Kette „im Fokus" steht, ist eine redaktionelle Entscheidung mit Audit-Spur.
- Headline ist keine Schlagzeile, keine Push-Notification, kein Eilmeldungs-Banner. Sie ist eine ruhige Lesehilfe.
- Editorial-Status-Indikator (`live` / `stale` / `error`) erscheint klein neben der Headline-Quelle, niemals als großflächiger Alarm.

### Pfad-Hub und Hybrid-Navigation

v0.3 löst das v0.2-Acht-Tab-Layout durch eine zweischichtige Navigation ab:

**Primär: 4 Pfade.** Unter der Lage-Headline auf `/` sowie als persistente Top-Bar auf allen Routen:

| Pfad | Route | Funktion |
|---|---|---|
| 01 Lage | `/lagebild` | Lagebild Deutschland + Übersicht der zehn Systembereiche |
| 02 Haushalt | `/kosten` | Kostenradar als primärer Haushaltswirkungs-Pfad; Versorgung bleibt sekundäres Werkzeug |
| 03 Wirkungsketten | `/kaskaden` | 12 Kaskaden mit Detail-Routen |
| 04 Maßnahmen | `/massnahmen` | Bürgermaßnahmen |

Pfade sind die primäre Lesestruktur — sie folgen der Haushalts-Logik (Was läuft? → Was kostet mich das? → Warum? → Was tun?), nicht der Datenschicht-Logik.

**Sekundär: ☰-Werkzeuge-Menü.** Ein ruhiges Drawer-Icon in der Top-Bar öffnet ein Off-Canvas-Menü mit den verbleibenden Werkzeug-Tabs:

| Werkzeug | Route |
|---|---|
| Versorgung | `/versorgung` |
| Quellen & Methodik | `/quellen` |
| Governance & Vertrauenslage | `/governance` |
| Frühwarnindikatoren | `/indikatoren` |

Werkzeuge sind Audit- und Vertiefungs-Routen. Sie konkurrieren nicht mit den vier Haushalts-Pfaden um Aufmerksamkeit.

Regeln:

- Pfade haben Rost-Border (`border-b-2`) im aktiven Zustand, Mono-Schrift, uppercase, tracking-wide.
- Pfad-Nummern (01–04) stehen sichtbar vor dem Label.
- Drawer-Icon ist klein, muted, neben dem Brand-Marker. Kein blinkender Badge, kein Counter, kein „Neu"-Indikator.
- Mobile: Pfade als horizontaler Scroll-Strip oder als kompakter Tab-Bar; Drawer öffnet Full-Screen.
- Direct-URL-Refresh auf alle vier Pfade und alle Werkzeug-Routen muss funktionieren — Next.js App Router liefert das nativ.

Die v0.2-Acht-Tab-`TabNav` lebt nur noch in `v01/` für Referenz. `v02/` rendert sie nicht.

### Haushalts-Modus-Switcher

v0.3 führt einen globalen Haushalts-Modus-Switcher ein. Komponente lebt in der App-Shell, sichtbar über alle Routen.

Vier Modi:

- Single
- Familie
- Selbstständig
- Rentner

Modi sind ein **persistentes Profil** (Postgres-User-Row via Auth.js), kein localStorage-Wert. Default ohne Login: kein Modus aktiv, die App spricht modus-frei wie v0.2.

Was der Modus tut:

- Priorisiert Beispiele in Karten (z.B. „Familie": Kindergeld-Pufferung, Schul-Verpflegung; „Rentner": Renten-Anpassung, Apothekenversorgung).
- Reiht Kostenbereiche um (z.B. „Selbstständig": Versicherungen, Liquidität zuerst).
- Aktiviert Modus-spezifische Bürgermaßnahmen.

Was der Modus **nicht** tut:

- Er ändert keine Daten, keine Quellen, keine Confidence-Werte, keine Severity-Stufen.
- Er ändert nicht den Ton — die App bleibt ruhig, persona-frei, sachlich.
- Er ist keine Personalisierungs-Engine, kein Tracking, kein Profiling.

UI-Pattern: kompakter Dropdown oder Drawer in der Top-Bar, mono-uppercase-Label „Modus: Familie" oder „Modus: nicht gewählt". Wechsel ohne Page-Reload (Server Component re-render). Modus-Wechsel triggert keine Animation, keine Toast-Bestätigung, keinen Sound.

### Editorial-Status-Badges pro Item

v0.3 ergänzt das v0.2-Karten-Pattern um einen Editorial-Status-Badge. Drei Stufen:

| Stufe | Bedeutung | Token |
|---|---|---|
| `live` | Quelle aktiv abgefragt, Daten frisch | `--color-verified` |
| `stale` | Stand außerhalb des erwarteten Refresh-Fensters | `--color-watch` |
| `error` | Quelle temporär nicht erreichbar, letzter gültiger Stand wird gezeigt | `--color-critical` |

Badge-Platz: in der Karten-Metazeile neben dem `ConfidenceBadge`, oder am Source-Pill direkt. Mono, klein, uppercase. Kein Pulsieren, kein Hintergrund-Fill — nur eine 1px-Border in der Token-Farbe und ein farbiger Punkt davor.

Regeln:

- Badge zeigt **nicht** den Vorhersagestatus oder die Severity. Er zeigt nur den technischen Stand der Ingestion.
- `error` ist kein Alarm — er ist eine Transparenz-Markierung. Die Karte bleibt sichtbar, der letzte Stand wird genutzt.
- Pro Item maximal ein Badge. Wenn mehrere Sources im Item, gilt der Badge der primären Source.

### Stitch-User-ZIP als Screen-Quelle

Die verbindliche Screen-Quelle für v0.3-Layouts ist das Stitch-User-Paket unter `.superpowers/user-stitch-zip-2026-05-22/stitch_wachsam_krisenradar/`. Inventar, Routen-Zuordnung, Wellen-Mapping und Hinweise zu Brand-Adaption stehen in `outputs/2026-05-22-user-stitch-zip-mapping.md`.

Bei Konflikt zwischen Stitch-Screen und dieser Datei gilt: `ui-standard.md` führt das Component-Pattern (Karten-, Section-, Detail-Routes-Vertrag), Stitch liefert das Layout-Skelett und die Inhalts-Struktur. Stitch-Code ist niemals 1:1-Kopiervorlage — er ist Skizze.

Verweis auf ADR-034 für die Datenschicht-Verträge und auf `outputs/2026-05-22-user-stitch-zip-mapping.md` für das vollständige Screen-Inventar.
