# WachSam Source-Gap-Audit — Welle 12 (2026-06-08)

Ziel: WachSams Dateninput breiter machen, ohne Mockdaten, ohne erfundene Quellen und ohne lizenzkritische Übernahmen. Fokus: offizielle oder institutionelle Quellen, Deutschland-Relevanz, Haushaltsauswirkung, Adapter-Fähigkeit.

## Verifizierungsstand

URLs wurden per `curl -L -I --max-time 20` geprüft. HTTP-Status ist nur ein Erreichbarkeits-Signal; API-Nutzbarkeit, Lizenzen, Auth und Datenformate müssen vor Implementierung einzeln geprüft werden.

- Dashboard Deutschland: `200` — `https://www.dashboard-deutschland.de/`
- DWD Open Data: `200` — `https://opendata.dwd.de/`
- Pegelonline REST API: `200` — `https://www.pegelonline.wsv.de/webservice/guideRestapi`
- BA Statistik: `200` — `https://statistik.arbeitsagentur.de/`
- Bundesbank Zeitreihen: `200` — `https://www.bundesbank.de/de/statistiken/zeitreihen-datenbanken`
- BDEW Strompreisanalyse: `200` — `https://www.bdew.de/service/daten-und-grafiken/bdew-strompreisanalyse/`
- Destatis GENESIS REST: Redirect/`404` beim alten Pfad; vor Adapterarbeit neue Doku/Endpoint prüfen.
- SMARD API-Artikel: Redirect/`404` beim alten Pfad; vor Adapterarbeit aktuelle API-Doku prüfen.
- BfArM Lieferengpässe: `400` via HEAD/CDN; browser-/GET-Prüfung nötig, Quelle bleibt fachlich relevant.
- RKI SurvStat: `200` auf Error-Seite; API-/Downloadpfad separat prüfen.
- ENTSO-E API Guide: `400` via HEAD; Plattform ist bekannt auth-/tokenpflichtig, Doku separat prüfen.

## Priorisierte Quellen-/Adapter-Kandidaten

### P0 — Adapter-ready prüfen und zuerst bauen

#### 1. DWD Open Data

- URL: `https://opendata.dwd.de/`
- Klasse: Wetter, Extremwetter, Hitze, Niederschlag, Sturm.
- Format: offenes Verzeichnis; häufig CSV/Geo/Grib/Binär je Produkt.
- Deutschland-Relevanz: sehr hoch.
- Haushaltswirkung: Gesundheit, Mobilität, Versorgung, Gebäude-/Keller-/Hitzeschutz.
- WachSam-Nutzung: Frühwarn-/Lagekarten für Hitze, Starkregen, Sturm, regionale Belastung.
- Status: adapter-ready nach Produktauswahl.
- Risiko: viele Produktpfade; zuerst 1–2 robuste Produkte statt Vollabdeckung.
- Testpfad: Fixture aus einem konkreten Open-Data-Pfad, Parser-Test, Freshness-Test.

#### 2. Pegelonline / WSV

- URL: `https://www.pegelonline.wsv.de/webservice/guideRestapi`
- Klasse: Wasserstände, Hochwasser, Binnenwasserstraßen.
- Format: REST API.
- Deutschland-Relevanz: hoch, besonders Flussregionen und Logistik.
- Haushaltswirkung: Hochwasserrisiko, Mobilität, Versorgung, regionale Warnlage.
- WachSam-Nutzung: regionale Wasserstands-/Trendkarte mit Schwellenhinweis.
- Status: adapter-ready.
- Risiko: Haushaltswirkung braucht regionale Zuordnung und Schwellenkontext.
- Testpfad: einzelne Station abrufen, Wasserstand normalisieren, Trend/Freshness testen.

#### 3. Dashboard Deutschland / Destatis-nahe Kennzahlen

- URL: `https://www.dashboard-deutschland.de/`
- Klasse: volkswirtschaftliche und gesellschaftliche Lageindikatoren.
- Format: Website/API-Pfad noch zu prüfen.
- Deutschland-Relevanz: hoch.
- Haushaltswirkung: Preise, Arbeitsmarkt, Wirtschaftslage, Konsum-/Energieindikatoren.
- WachSam-Nutzung: ruhige Makro-Lage für Kosten-/Arbeitsmarkt-/Versorgungsstress.
- Status: adapter-candidate, nicht direkt adapter-ready.
- Risiko: API-/Lizenz-/Endpoint-Klärung nötig.
- Testpfad: erst Doku/API suchen; falls keine stabile API, nur editorial-only.

### P1 — starke Fachquellen, aber mit Auth/Doku-/Lizenzprüfung

#### 4. Bundesnetzagentur SMARD

- URL geprüft: alter API-Artikel redirectet auf `404`; aktuelle Doku neu suchen.
- Klasse: Stromerzeugung, Last, Großhandel, Energiefluss.
- Deutschland-Relevanz: sehr hoch.
- Haushaltswirkung: Strompreis-/Versorgungsstress, Energie-Lage, Industriebelastung.
- WachSam-Nutzung: Energie-Lagekarten mit Datenstand und Quellenqualität.
- Status: blocked-until-docs.
- Risiko: alter Endpoint instabil; nicht implementieren, bis aktuelle API bestätigt ist.

#### 5. ENTSO-E Transparency Platform

- URL: `https://transparency.entsoe.eu/` / API Guide tokenpflichtig.
- Klasse: europäische Strommarkt-/Netzdaten.
- Deutschland-Relevanz: hoch als europäischer Kontext.
- Haushaltswirkung: Energiepreisdruck, Netz-/Versorgungsstress.
- WachSam-Nutzung: zweite Quelle zur Plausibilisierung von Energie-Lagekarten.
- Status: adapter-ready nur mit API-Token und Nutzungsbedingungen.
- Risiko: Auth, Rate Limits, komplexe Parameter, Lizenz/Nutzungsbedingungen.

#### 6. BfArM Lieferengpässe

- URL: `https://www.bfarm.de/DE/Arzneimittel/Arzneimittelinformationen/Lieferengpaesse/_node.html`
- Klasse: Arzneimittel-Lieferengpässe.
- Deutschland-Relevanz: hoch.
- Haushaltswirkung: Dauermedikation, Apotheken-/Arztpraxis-Prüfschritte.
- WachSam-Nutzung: Gesundheits-/Versorgungskarten mit praktischen Maßnahmen.
- Status: research-needed; HEAD lieferte `400`, GET/Downloadpfade prüfen.
- Risiko: Datenstruktur und Nutzbarkeit nicht per HEAD bestätigt.

### P2 — editorial-only oder periodische Datenquellen

#### 7. Bundesagentur für Arbeit Statistik

- URL: `https://statistik.arbeitsagentur.de/`
- Klasse: Arbeitsmarkt, Beschäftigung, Kurzarbeit, Regionen.
- Deutschland-Relevanz: hoch.
- Haushaltswirkung: Jobrisiko, Branchenstress, regionale Planung.
- WachSam-Nutzung: Arbeitsmarkt-Stressfeld; eher monatlich/periodisch.
- Status: editorial-/batch-candidate.
- Risiko: stabile Downloadpfade und maschinenlesbare Tabellen prüfen.

#### 8. Deutsche Bundesbank Zeitreihen

- URL: `https://www.bundesbank.de/de/statistiken/zeitreihen-datenbanken`
- Klasse: Zinsen, Preise, Finanzindikatoren.
- Deutschland-Relevanz: hoch.
- Haushaltswirkung: Kredite, Sparen, Finanzierung, Wohnkosten.
- WachSam-Nutzung: Finanz-/Wohnkosten-Kontext statt Akutlage.
- Status: adapter-candidate.
- Risiko: Fachlichkeit; nicht zu pseudo-exakten Haushaltsprognosen verdichten.

#### 9. RKI SurvStat / Gesundheitsdaten

- URL: `https://survstat.rki.de/`
- Klasse: Infektions-/Meldeindikatoren.
- Deutschland-Relevanz: hoch.
- Haushaltswirkung: Gesundheit, Arbeit, Schule/Familie, Versorgung.
- WachSam-Nutzung: Gesundheitslage als Kontext, nicht Alarmismus.
- Status: research-needed; geprüfter Pfad zeigte Error-Seite.
- Risiko: Datenzugang, Meldeverzug, Interpretation.

#### 10. BDEW Strompreisanalyse

- URL: `https://www.bdew.de/service/daten-und-grafiken/bdew-strompreisanalyse/`
- Klasse: Energiepreise, Preisbestandteile.
- Deutschland-Relevanz: hoch.
- Haushaltswirkung: Strom-/Gas-/Kostenverständnis.
- WachSam-Nutzung: redaktionelle Referenz für Energie-/Kostenkarten.
- Status: editorial-only unless stable downloads exist.
- Risiko: Branchenverband; als Kontext kennzeichnen, nicht als amtliche Quelle.

## Empfohlene Umsetzung in kleinen Wellen

### Welle 12A — Source Registry normalisieren

- Ziel: Quellenklassen und Status sauber als Registry dokumentieren.
- Artefakte: `docs/source-expansion.md` oder `v02/intelligence/source_registry.yaml` erst nach Architekturfreigabe.
- Kein Adaptercode.

### Welle 12B — erster echter Adapter: Pegelonline oder DWD

- Favorit 1: Pegelonline, weil REST-Doku erreichbar und klar.
- Favorit 2: DWD, wenn ein konkretes Produkt gewählt wird.
- Akzeptanz: echte Quelle, Parser-Test, Freshness-Test, kein Produkt-Mock.

### Welle 12C — Energie-Doku klären

- SMARD und ENTSO-E nicht blind bauen.
- Erst aktuelle API-Doku, Auth, Rate Limits und Nutzungsbedingungen dokumentieren.
- Danach Adapter-Entscheidung.

## Produktleitplanke

Die Worldmonitor-Inspiration wird hier nur abstrakt genutzt: sichtbare Quellenzahl, Qualität, Stand-Datum, Methodik. Keine Code-, Text-, Formel-, Layer-, Design- oder Markenübernahme. WachSam muss Quellenqualität eigenständig, ruhig und haushaltsbezogen erklären.
