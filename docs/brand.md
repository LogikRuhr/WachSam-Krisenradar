# Brand — WachSam

> WachSam ist die Haushaltscheck-Auslegung der RuhrLogik-Identität: ruhig, robust, quellenbasiert und auf konkrete Alltagsentscheidungen in Deutschland ausgerichtet.

## Identität in einem Satz

Sachlich, robust, nachvollziehbar und haushaltsnah: WachSam nutzt die Industrial-Dark-DNA von RuhrLogik, damit Kostenrisiken, Versorgungsfragen, Wirkungsketten, Quellenstand und Unsicherheit wie ein ruhiger Prüfstand wirken — nicht wie ein Alarmraum.

## Verbindlichkeit

Diese Datei ist der Brand-Vertrag für die aktuelle WachSam-Richtung. Produktwahrheit führt `docs/product-current.md`; aktive Arbeitsbasis ist `v02/`. Ältere v0.1/v0.2-Abschnitte bleiben historische Brand- und UI-Herkunft, dürfen aber keine neue Arbeit gegen den Haushaltscheck-Fokus steuern. Bei Konflikt gilt: aktuelle Produktwahrheit vor dieser Brand-Datei, diese Brand-Datei vor älteren Design-/Output-Artefakten.

## Beziehung zu RuhrLogik

WachSam und RuhrLogik teilen ab v0.2 dieselbe Industrial-Dark-DNA. Die Differenzierung liegt nicht mehr im Theme (Light vs. Dark), sondern in der Funktion: RuhrLogik-Marketing kommuniziert Angebot und Identität, WachSam operationalisiert das Krisen-Lagebild für Bürger. Beide Oberflächen erkennen sich als dieselbe Marken-Welt.

Gemeinsame Atome:

- **Rost als primärer Akzent:** `#D4540A`, Hover `#E8682A`. Marke, nicht Alarm. Wird sparsam eingesetzt — niemals als Dauerfläche, niemals als Alarmblinker.
- **Schwarzgrund:** `#0D0D0D` als tiefste Ebene, `#111318` als Shell-Hauptfläche, `#141414`/`#1A1A1A` für Panels und Karten.
- **Display-Font:** Bebas Neue für Marke, große Lagezahlen und kurze Lagebegriffe.
- **UI-Font:** IBM Plex Sans für Body, Navigation, Karten, Fließtext.
- **Meta-Font:** IBM Plex Mono für Stand, Quelle, Confidence, Zeitfenster, IDs, kurze Datenwerte.
- **Strukturelle Klammer:** klare technische Raster, 1 px-Linien, 4 px-Radien, keine weichen Schatten.

WachSam ist eigenständig durch:

- konsequenten Deutschland- und Haushaltsfokus
- Kosten-/Versorgungsfragen als Einstieg statt abstrakter Krisenlage
- längere Wirkungsketten statt kurzer Schlagwortlogik
- Quellen- und Methodiktransparenz als Interface-Muster
- sichtbare Unsicherheit statt scheinbarer Gewissheit
- methodisches Vokabular (germany_relevance, methodology_tag) als Audit-Spur

## Farbpalette v0.2-Herkunft

Diese Palette beschreibt die Industrial-Dark-DNA, die aus v0.2 in die aktuelle Richtung übernommen wird. Vor Code-Änderungen ist die tatsächliche `v02/`-Implementierung zu prüfen; diese Tabelle allein ist keine Runtime-Quelle.

### Grundflächen

| Rolle | Hex | Verwendung |
|---|---:|---|
| Black | `#0D0D0D` | App-Hintergrund, tiefste Ebene |
| RuhrLogik Dark | `#111318` | Hauptfläche, Navigation, Shell |
| Coal | `#141414` | Panels, Sections |
| Graphite | `#1A1A1A` | Karten, Unterpanels |
| Steel | `#252525` | Linien, Trenner, Rahmen |

### Text

| Rolle | Hex | Verwendung |
|---|---:|---|
| Text | `#F5F5F5` | Primärtext |
| Muted | `#7A7A7A` | Sekundärtext, Meta-Labels, IDs |

### Akzente

| Rolle | Hex | Verwendung |
|---|---:|---|
| Ruhr Rust | `#D4540A` | Primärer Akzent, aktive Tabs, Strich-Marker, Fokus |
| Rust Hover | `#E8682A` | Hover-Border auf Quellen-Pills und Source-Listen |
| Data Cyan | `#4CD7F6` | optionale Datenverbindung, sparsam |

### Statuslagen

| Rolle | Hex | Verwendung |
|---|---:|---|
| Verified | `#22C55E` | bestätigte Quelle, positive Statuslage |
| Watch | `#EAB308` | Beobachten, unklare Lage, Warnhinweis |
| Critical | `#EF4444` | Kritisch, sparsam, nie als Dauerfläche |

### Severity-Skala (5-stufig ab v0.2)

| Token | Hex | Verwendung |
|---|---:|---|
| `--color-stable` | gedämpft, kontextuell | Severity „Stabil" |
| `--color-watch` | `#EAB308` | Severity „Beobachten" |
| `--color-elevated` | gedämpft, kontextuell | Severity „Erhöht" |
| `--color-critical` | `#EF4444` | Severity „Kritisch" |
| `--color-escalating` | `#7A2B2B` | Severity „Eskalierend" — für aktive Strukturkrisen reserviert (z.B. Kaskade L) |

Severity-Farben sind funktional, nicht atmosphärisch. „Kritisch" und „Eskalierend" werden sparsam eingesetzt, niemals als grundsätzliche Hintergrundfläche und nie animiert. Rost ist Marke, nicht Alarm. Rot ist Ausnahme, nicht Grundstimmung. Grün steht für Quellen- oder Datenstatus, nicht für Erfolgsgamification.

Keine Hex-Codes in TSX/JSX. Immer Token-Bezug via `bg-[var(--color-…)]` oder Tailwind-Theme-Klassen.

## Typografie

Diese Regeln beschreiben die gewünschte Markenwirkung. Vor Code-Änderungen ist die tatsächliche Font- und Token-Implementierung in `v02/` zu prüfen.

| Ebene | Font | Regel |
|---|---|---|
| Display | Bebas Neue | Marke, große Zahlen, kurze Lagebegriffe — keine langen Sätze |
| UI / Body | IBM Plex Sans (`--font-sans`) | Navigation, Karten, Abschnitte, Fließtext |
| Data / Meta | IBM Plex Mono (`--font-mono`) | Stand, Quelle, Confidence, Zeitfenster, IDs, kurze Datenwerte |
| Stitch-Fallback | Montserrat | nur in Stitch-Generierung wenn Bebas Neue nicht verfügbar |

Verwendungsregeln:

- Body und Beschreibungen: Plex Sans 400.
- Marken-Headlines und große Lagesignale: Bebas Neue.
- Meta-Mikrotext (uppercase Labels, Stand-Datum, IDs): Plex Mono 400.
- Body niemals in Mono. Mono niemals länger als ein paar Wörter pro Stelle.
- Keine Serif-Headlines in v0.2. Keine negative Letter-Spacing. Display-Schrift nicht für erklärende Ketten.

## Sprache in der UI

- Deutsch durchgängig, vollständige Sätze, sachlich.
- Ruhig, faktenbasiert, nicht alarmistisch.
- Severity- und Confidence-Begriffe ausgeschrieben („Hoch", „Mittel", „Niedrig", „Stabil", „Beobachten", „Erhöht", „Kritisch", „Eskalierend").
- Stand-Angaben mit Monat und Jahr direkt sichtbar.
- Persona-frei — keine erfundenen Test-Personas mit Namen.
- v0.3 ergänzt eine Lage-Headline am Seiteneinstieg. Wording bleibt ruhig: „Heute im Fokus" als kanonische Formel, niemals „Heute brennt", „Aktuelle Krise" oder „Akute Lage". Die Headline ist eine Lesehilfe, keine Schlagzeile.

Bevorzugte UI-Begriffe (vollständige Liste in `docs/DESIGN.md`):

- Deutschland-Relevanz · Deutschland-Auswirkung · Haushaltswirkung · Wirkungskette
- Kostenbereich · Versorgungsrisiko · Zeitfenster · Sicherheit der Einschätzung
- Quellenlage · Stand · Beobachten · Maßnahme · Einordnung

Nicht sichtbar in UI verwenden:

- `Notfallmodus`, `Systemstress`, `DE-Impact`, `Weltsignal`, `Command Center`
- `Controlled Seed` / `Kontrollierter Seed` als doppelte prominente Anzeige
- `Live`, `Realtime`, `gerade eben`, `automatisch aktualisiert` (v0.2 + v0.3-Welle-1 haben keine Live-Ingestion; Live-Ingestion erst ab v0.3-Welle 2 via Python-Scrapy-Container, ADR-038)

## Strukturelle Marker

**Strich-Marker:**

```tsx
<div aria-hidden="true" className="mb-3 h-[3px] w-10 bg-[var(--color-accent)]" />
```

40 × 3 px Rost-Balken vor jedem Section-Header und vor dem Hero-Label. Pro Sektion genau einer. Niemals dicker, nie breiter, nie animiert.

**Mono-Section-Label:**

```tsx
<p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
  Bereich {n}
</p>
```

Section-Labels und Item-Bereichs-Labels in Mono, uppercase, klein, muted. Nicht in Rost — Rost trägt der Strich-Marker.

**Hover-Akzent:**

Quellen-Pills und Source-Listen-Links wechseln beim Hover die Border-Color auf `--color-accent-hover`. Kein Background-Fill, keine Underline, keine Translate, nur eine 120–180 ms Color-Transition.

## Motion

Motion ist funktional, nicht atmosphärisch.

Erlaubt:

- 120 bis 180 ms Hover- und Focus-Transitions
- dezentes Expand/Collapse für Details
- reduzierte Tabellen- oder Ketten-Enthüllung nur bei Nutzerinteraktion

Nicht erlaubt:

- Dauerpuls, hektische Kartenanimation
- Fake-Live-Scanning, Alarm-Loops
- Bewegung ohne Informationsgewinn

`prefers-reduced-motion` ist Pflicht.

## Brand-Guardrails

Die Brand soll wie ein ruhiger Haushalts-Prüfstand wirken: dunkel, präzise, klar gegliedert, quellenbewusst und sparsam akzentuiert. Rost ist Marke und Orientierung, nicht Alarm. Rot bleibt Ausnahme für funktionale Severity, nie Dauerfläche.

Zu vermeiden sind Marketing-Landingpage-Optik, Trading-Terminal-Anmutung, Command-Center-Theater, Newsfeed-Schlagzeilen, Doomscrolling, Prepper-Ästhetik, Cyberpunk-Dekor, Rost-Flächen, pulsierende Alarme und Fake-Live-Scanning.

Auch mit aktuelleren Daten bleibt WachSam nicht alarmistisch. Mehr Datenstand erhöht Auditierbarkeit und Nutzwert, aber nicht die Dramatik: keine Live-Ticker, keine roten Banner für Routine-Ingestion-Events, keine Realtime-Behauptungen ohne gebaute und geprüfte Grundlage.

## Bildmaterial

v0.2 verzichtet auf Stockfotos und große Hero-Visuals. Hierarchie kommt aus Typografie, Whitespace und gedämpften Severity-Akzenten — nicht aus Bildern. Globale Karten sind nur erlaubt, wenn sie eine klare Deutschland-Auswirkung erklären (siehe `docs/DESIGN.md` §Globale Karte).

## v0.1 Light-Theme — Historisch (Wave 3.5C1 bis 8.1)

Zwischen Wave 3.5C1 und Wave 8.1 lief die App im Light-Theme: Off-White-Hintergrund `#f6f5f1`, Serif-Headlines, gedämpfte Erdton-Severity. Mit der UX-A-1-Migration (Wave 8.2-1) wurde der `@theme`-Block in `v01/src/index.css` auf die v0.2-Dark-Tokens oben umgestellt. UX-A-2 ersetzt die Serif-Display-Schrift durch Bebas Neue. UX-A-3 löst das Single-Page-Scroll-Layout durch Multi-Tab-Navigation mit Client-Router ab. UX-A-4 ergänzt Detail-Routes.

Die RuhrLogik-DNA (Rost, Plex Sans, Plex Mono, Strich-Marker, Mono-Labels) bleibt über alle Phasen erhalten.

## Code-Bezug

Aktive Arbeitsbasis ist `v02/`. Ältere `v01/`-Token-, Font- und Screen-Dokumentation beschreibt die Herkunft der Industrial-Dark-DNA, ist aber nicht mehr automatisch Single Source für neue Arbeit. Neue UI-Arbeit muss zuerst gegen `docs/product-current.md`, dann gegen diese Brand-Datei und anschließend gegen die aktuelle `v02/`-Code-Struktur geprüft werden.

## Änderungsregel

Jede Token-, Font- oder Strukturelement-Änderung erfordert:

1. Prüfung der aktuellen `v02/`-Implementierung.
2. Update dieser Datei, wenn die Brand-Regel betroffen ist.
3. Update der passenden UI-/Design-Doku, wenn das Pattern betroffen ist.
4. Begründung im Commit-Body.

Inline-Hex in TSX/JSX ist verboten. Wenn eine neue Farbe gebraucht wird: zuerst ein passender Token in der aktuellen `v02/`-Tokenquelle, dann `var(--color-…)` oder die etablierte Projektkonvention in der Komponente.

Token-Drift zwischen Code und Doku ist ein Merge-Blocker. Wenn er auftritt, wird vor anderen Arbeiten erst die Sync-Lücke geschlossen.

## v0.3 — Backend-Implikationen für UI (2026-05-22)

v0.3 führt den Backend-Pivot ein (Next.js 15 + Postgres 16 + Drizzle + Auth.js + Resend + Docker IONOS, dokumentiert in ADR-034). Daraus ergeben sich UI-Implikationen, die brand-konform bleiben müssen — die DNA aus v0.2 (Industrial Dark, Rost als Marke, Bebas Neue, Plex Sans, Plex Mono, Strich-Marker) wird nicht angerührt. Was sich ändert, ist die Trust-Layer-Spur, nicht der Ton.

### Stand-Anzeige live

Item-Karten zeigen ab v0.3 zwei Stand-Felder als Mono-Meta-Zeilen am Karten-Ende:

- `last_ingested_at` — Stand der letzten Datenabholung aus der Quelle. Mono, muted, deutsches Tagesformat.
- `editorial_reviewed_at` — Stand der letzten redaktionellen Prüfung. Bleibt das v0.2-Pflichtfeld `retrieved_at` semantisch, aber explizit benannt.

Beide Werte stehen sichtbar untereinander, nicht in einem kombinierten String. Sie sind unterschiedliche Aussagen über unterschiedliche Verantwortungen. Live-Vokabular bleibt verboten — kein „gerade aktualisiert", kein „Realtime", kein „Live". Die Phrase bleibt „Letzte Abfrage" / „Letzte redaktionelle Prüfung", jeweils mit Datum.

### Modus-Anker: Haushalts-Typ als persistentes Profil

v0.3 ersetzt die localStorage-basierte Haushalts-Typ-Selektion durch ein persistentes Profil (Auth.js + Postgres). Vier Modi bleiben: Single, Familie, Selbstständig, Rentner.

Der Modus ändert ausschließlich die **Sprache** der App — welche Beispiele in Karten priorisiert werden, welche Kostenbereiche zuerst auftauchen, welche Bürgermaßnahmen relevant sind. Der Modus ändert **nicht die Daten** (gleiche Items, gleiche Quellen, gleiche Confidence). Er ändert auch nicht den Ton oder die Severity-Skala. Bürger-Modus ist ein Lese-Anker, keine Personalisierungs-Engine.

Sichtbar im UI durch einen ruhigen Modus-Switcher in der App-Shell (Drawer oder kompaktes Dropdown, kein prominenter Hero). Default ohne Login: kein Modus aktiv, App spricht modus-frei.

Ausnahme für anonymes "Eingabe merken": Der öffentliche Haushalts-Check auf der Startseite darf eine anonyme Eingabe (Haushaltstyp/Heizart) über einen rein funktionalen, nicht-httpOnly Cookie (`ws-household`, siehe /datenschutz) zwischen Seitenaufrufen merken, damit die Formularfelder und die Sortierung der Startseite konsistent bleiben. Das bleibt brand-konform, solange (a) daraus kein eingeloggt-wirkendes Modus-Identitätsbadge entsteht — insbesondere keine Konto-Kennzeichnung wie "· dein Profil" für anonyme Nutzer — und (b) die Home ohne gesetzten Cookie weiterhin komplett modus-frei bleibt (keine Personalisierung, kein aktives Modus-Badge). Der Cookie ist kein Ersatz für das persistente Login-Profil, sondern nur eine anonyme Komfortfunktion.

### Editorial-Status-Indikatoren

Pro Source und pro Item führt v0.3 einen Editorial-Status-Indikator ein als zusätzlicher Trust-Layer:

- `live` — Quelle wird aktiv abgefragt und Daten sind frisch.
- `stale` — Quelle wird abgefragt, aber letzter Stand ist außerhalb des erwarteten Refresh-Fensters.
- `error` — Quelle ist temporär nicht erreichbar; angezeigt wird der letzte gültige Stand mit Hinweis.

Indikator-Farben folgen den bestehenden Statuslagen-Tokens: `verified` für `live`, `watch` für `stale`, `critical` für `error`. Der Indikator ist klein, mono, neben dem Source-Pill oder am Karten-Footer — niemals als großflächiger Alarm-Banner. Er ist Auditierbarkeit, nicht Eskalation.

### Quellen-Stand bleibt sichtbar

Das v0.2-Source-Pill-Pattern (`Quelle:` + Name, `Stand:` + Datum) bleibt unverändert sichtbar. v0.3 fügt nichts hinzu, was den Quellen-Stand ersetzt oder relativiert. Backend-Anbindung ist eine Verstärkung der Auditierbarkeit, kein „Live"-Versprechen. Wenn die Quelle einen Stand vom 14.04.2026 trägt, zeigt das Pill den 14.04.2026 — auch wenn das Backend die Datei eine Stunde vor dem Render abgerufen hat.

### Stitch-User-ZIP als verbindliche Design-Quelle ab v0.3

Der vom User am 2026-05-22 gelieferte Stitch-ZIP (entpackt unter `.superpowers/user-stitch-zip-2026-05-22/stitch_wachsam_krisenradar/`) ist die normative Design-Quelle für v0.3. Inventar und Routen-/Wellen-Zuordnung leben in `outputs/2026-05-22-user-stitch-zip-mapping.md`. Bei Konflikt zwischen Stitch-Screens und dieser Brand-Datei gilt: `brand.md` führt die strategische Direction (Rost, Bebas, Plex, Strich-Marker), Stitch liefert das Layout-Skelett.

Der ZIP enthält zwei `DESIGN.md`-Files. `industrial_intelligence_ui/DESIGN.md` ist die kanonische Spec und token-konform mit v0.2 (Bebas Neue, #D4540A, Industrial Dark). `wachsam_product_ui/DESIGN.md` ist älter und enthält Pre-Rebuild-Referenzen (Space Grotesk, `getTerminalSnapshot()`, Polykrise-Vokabular) — nicht als Quelle nutzen.

### Verweis auf ADR-034

Die strukturelle Backend-Entscheidung steht in `docs/adr/034-backend-pivot.md`. Datenschicht-, Auth- und Ingestion-Verträge sind dort fixiert; `brand.md` operationalisiert nur die UI-Implikationen.
