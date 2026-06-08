# Worldmonitor — Konzeptanalyse für WachSam (2026-06-05)

> Eigenständige, konzeptionelle Referenzanalyse. Geprüft wurden tatsächlich: `LICENSE`
> (`main` + `master`), README, das live gerenderte Dashboard (Browser), `llms.txt`-Methodik
> und die Pro-Seite. Keine Analyse aus dem Gedächtnis.

## Lizenz-Befund (hart)

- **Lizenz:** GNU **AGPL-3.0-only** (Affero GPL v3), Copyright Elie Habib 2024–2026.
  Bestätigt aus `LICENSE` (`main`+`master`, identisch), README-Lizenzsektion, Repo-Badge.
  Zusätzlich separate **Trademark Policy** — Name/Marke „World Monitor" gesondert geschützt.
- **Konsequenz:** AGPL ist **Netzwerk-Copyleft** (§13). Eine Übernahme von Code, Datenstrukturen,
  Assets, CSS, Texten, Layer-/Quellenlisten oder Scoring-Formeln würde den **gesamten
  WachSam-Stack AGPL-offenlegungspflichtig** machen — unvereinbar mit einem proprietären Produkt.
- **Daher:** KEIN Code, KEINE Assets, KEINE Texte, KEINE UI-1:1-Nachbauten, KEINE Formel-Übernahmen.
  **Erlaubt ist ausschließlich abstrakte, eigenständig neu umgesetzte UX-/IA-Inspiration.**
  Gerade die Muster zu Quellen, Qualität, Stand-Datum und Datenvertrauen sind als Konzept interessant,
  müssen aber mit eigener Methodik, eigener Skala und eigenen Texten abgeleitet werden. Marke/Name nie verwenden.

## Was tatsächlich gesehen wurde (Kurzfassung je Dimension)

1. **IA:** Hub aus 5 Dashboards (World/Tech/Finance/Commodity/Happy), frei anordbares Panel-Raster,
   globale Lage-Headerzeile, Layer-Sidebar, News-Ticker.
2. **Visualisierung:** WebGL-Weltkarte mit farbcodierten Markern + Legende, Zähl-Kacheln, Signal-Counts.
3. **Lage/Risiko:** kategoriale Severity-Labels (CRITICAL/ERHÖHT/STRONG…), „DEFCON 5", Hotspot-Counter —
   stark alarmistisch/Terminal-haft.
4. **Karten-Logik:** Layer-Toggle-Sidebar mit Suchfeld + Per-Layer-Hilfe, Zeitbereichsfilter (1h…7d), 2D/3D.
5. **Quellen/Transparenz:** sehr stark — Quellenanzahl + Konfidenz pro Item, „Aktualisiert: HH:MM:SS",
   durchgängige „Show methodology"-Buttons, namentliche Quellen-Attribution, Freshness-Monitor (35 Quellgruppen).
6. **Mobile:** desktop-dichtes Multi-Panel-Terminal, erkennbar nicht mobile-first.
7. **Personalisierung:** „Follow Land", My Monitors (Keyword-Alerts), Watchlists, localStorage ohne Account;
   Pro-Tier mit AI-Digest/Alert-Rules/Widget-Builder.
8. **Erklärbarkeit:** Methodik-Tooltips an jedem Modul + Doku-Seiten; „Geografische Konvergenz" als Klartext;
   interaktives Infrastruktur-Kaskaden-Tool (Asset wählen → „Auswirkungen analysieren").

## Übertragbarkeits-Matrix

| Beobachtung | Nutzen | Geeignet | WachSam-eigene Umsetzung | Lizenz/Risiko | Prio | PR-Block |
|---|---|---|---|---|---|---|
| „?"-Button pro Panel öffnet Methodik | Erklärbarkeit on-demand | **ja** | „Wie entsteht dieser Wert?"-Popover an jedem Score: Eingangssignale, Confidence, Stand-Datum; eigene Texte | Konzept frei; keine WM-Texte/Formeln | **P0** | A/E |
| Quellenanzahl + Konfidenzstufe pro Item | Mehrquellen-Vertrauen sichtbar | **ja** | Confidence-Chip: Quellenzahl + verbale Sicherheit (gesichert/wahrscheinlich/unbestätigt), ruhig | eigene Skala | **P0** | A/F |
| „Stand: HH:MM" pro Panel | Aktualität ohne Fake-Live | **ja** | „Stand TT.MM. HH:MM" in Plex Mono auf jeder Karte; keine blinkenden Live-Punkte | Konzept frei | **P0** | A/D |
| Interaktives Kaskaden-Tool (Asset → Auswirkung) | Wirkungsketten greifbar | **ja** | Wirkungsketten-Explorer: Signal wählen → DE-Relevanz→Systemstress→**Haushaltsauswirkung**, Confidence je Glied. **Entscheidung nötig** (Datenmodell/ggf. DB) | nur Interaktionsmuster | P1 | E/B |
| „Geografische Konvergenz" als Klartextsatz | mehrere Signale → 1 Aussage | teilweise | „Lage-Cluster"-Modul: DE-Signale zu ruhigem Klartext bündeln, ohne Heatmap-Alarmistik | Konzept frei | P2 | E/F |
| Legende mit benannten Severity-Stufen | sofort lesbare Schwere | **ja** | eigene 3–4-stufige ruhige Skala (Beobachten/Erhöht/Belastend), Rost nur für höchste Stufe | eigene Stufen/Farben | P1 | E |
| Layer-Sidebar mit Suchfeld + Hilfe | viele Ebenen beherrschbar | teilweise | Karten-Themen-Umschalter (Energie/Versorgung/Wetter/Verkehr) mit Tooltip; wenige kuratierte DE-Themen | Konzept frei | P2 | E |
| Zeitbereichsfilter (1h…7d) | Lage über Zeit | teilweise | schlichter Zeitraum-Umschalter (24h/7T/30T) je Indikator | Konzept frei | P2 | A/E |
| „Follow Land" + My Monitors (localStorage) | Personalisierung ohne Account | teilweise | „Meine Region/Mein Haushalt": Bundesland/PLZ + Themen lokal priorisieren. Serverseitige Alerts: **Entscheidung nötig** (Userdaten/DSGVO) | nur lokal/anonym, keine PII | P1 | C |
| AI-Digest (E-Mail/Slack, Cadence) | Mehrwert ohne App-Besuch | teilweise | Wochenbriefing „Was war für Haushalte relevant" + Prüfschritte. **Entscheidung nötig** (Versand/Consent) | DSGVO-Consent | P2 | B/F |
| Mehrquellen-Synthese-Brief | Deutung statt Rohnews | **ja** | Lagebrief je Thema: 1 Absatz Deutung + Quellen mit Stand, ruhig | eigene Redaktion | P1 | F |
| Resilience/CII-Score 0–100 | Komplexes als 1 Zahl | teilweise | pro DE-Stressfeld ruhiger Stress-Indikator mit Erklär-Popover, **verbale** Stufen bevorzugt. **Entscheidung nötig** (Methodik) | keine WM-Formeln | P2 | E/D |
| Multi-Panel-Drag-Resize-Workspace | Power-User-Anpassung | **nein** | bewusst weglassen — widerspricht ruhiger geführter UX | — | P3 | — |
| DEFCON/🍕-Index/rote Blinker/Live-Optik | Drama/Aufmerksamkeit | **nein** | bewusst vermeiden — verstößt gegen WachSam-Tonalität | Anti-Pattern | P3 | — |
| Namentliche Quellen-Attribution | Glaubwürdigkeit | **ja** | Quellen-Register + Quelle-mit-Stand an jedem Wert; nur offizielle DE/EU-Quellen. **Entscheidung nötig** bei neuen Anbindungen | Quell-Lizenzen je API prüfen | P1 | D/F |
| Methodik-Doku-Seiten pro Algorithmus | Tiefe Transparenz | **ja** | schlanke öffentliche Methodik-Seiten (max 150–200 Wörter), deutsch | eigene Inhalte | P2 | F |

## Empfehlung

Zuerst die **vertrauens- und erklärbarkeitsstiftenden P0-Muster** (rein Frontend, lizenzrisikofrei, ohne neues
Datenmodell, exakt auf WachSams Confidence-/Quellen-Methodik): **Methodik-Popover**, **Confidence-/Quellen-Chip**,
**Stand-Datum an jedem Wert**. Als Differenzierung folgt der eigenständig neu entwickelte **Wirkungsketten-Explorer**
(P1), der die Kaskaden-Idee aufgreift, aber konsequent auf die **Haushaltsauswirkung** zielt statt auf geopolitische
Eskalation. **Bewusst weglassen:** die gesamte alarmistische Terminal-Ästhetik (DEFCON, Pizza-Index, rote Blinker,
Fake-Live), den Drag-Workspace und jede Formel-Übernahme. **Leitplanke:** AGPL-3.0 + Trademark → nur abstrakte
UX-Ideen, niemals Code/Assets/Texte/Listen/Formeln; jede Idee mit neuen Datenquellen, Userdaten, E-Mail-Versand
oder Migration ist „Entscheidung nötig" und gehört vor die DSGVO-/DB-Freigabe.
