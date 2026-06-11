# Verwendungs-Katalog: Was kann von wo verwendet oder abgeleitet werden

**Für:** WachSam (wachsam.ruhrlogik.de) + YouTube-Kanal "Kaskaden & Krisen"
**Stand:** 10. Juni 2026 · Konsolidiert aus drei Recherche-Berichten
**Legende Verwendungsart:** 🔌 Daten direkt anbinden · 🧩 Code/Architektur ableiten · 🎨 Design/Konzept ableiten · 🎬 Video-Material/Recherche · 🛠️ Werkzeug für Redaktion

---

## 1. Deutsche Behörden-Datenquellen (direkt anbindbar, kostenlos)

| Quelle | Verwendung | Was konkret | Lizenz | Key nötig |
|---|---|---|---|---|
| **SMARD** (smard.de, via bund.dev) | 🔌 🎬 | Stromerzeugung, -verbrauch, Großhandelspreise als JSON-Zeitreihen → WachSam-Energielage + Video-Belege | CC BY 4.0 | Nein |
| **Pegelonline** (pegelonline.wsv.de) | 🔌 🎬 | Wasserstände 640+ Stationen (Rhein/Kaub!) alle 15 Min → Niedrigwasser-Kaskaden-Trigger | DL-DE Zero 2.0 (keine Auflagen) | Nein |
| **DWD Open Data** (opendata.dwd.de) | 🔌 🎬 | Warnungen (CAP-XML), Vorhersagen, Klimadaten (CDC) → Wetter-Auslöser-Ebene | CC BY 4.0 / GeoNutzV | Nein |
| **NINA-API** (warnung.bund.de/api31) | 🔌 | Aggregierte Bevölkerungsschutz-Warnungen (MoWaS, KATWARN, Polizei) als JSON/GeoJSON | Inoffiziell; MoWaS-RSS nicht-gewerblich → für Hochwasser besser LHP direkt | Nein |
| **LHP Hochwasserportal** (hochwasserzentralen.de) | 🔌 | ~1.200 Hochwasser-Pegel Gefahrenklassen, GeoJSON, minütlich | CC BY 4.0 | Nein |
| **Destatis GENESIS** (www-genesis.destatis.de) | 🔌 🎬 | VPI/Inflation, Außenhandel — REST/JSON (SOAP seit Mitte 2025 tot) → Haushaltsauswirkung in Euro | DL-DE 2.0 | Ja (kostenlos) |
| **Bundesbank SDMX** (api.statistiken.bundesbank.de) | 🔌 🎬 | Zinsen, Wechselkurse, Makro-Zeitreihen | Frei mit Quellenangabe | Nein |
| **BfArM Lieferengpässe** | 🔌 🎬 | CSV-Downloads (keine API — Polling nötig) → Gesundheits-Lagekarten | Frei | Nein |
| **RKI/AMELAG** (GitHub/Zenodo) | 🔌 🎬 | Abwasser-Viruslast (CSV, wöchentlich, bis 70 Kläranlagen) → Gesundheits-Frühindikator | CC BY 4.0 | Nein |
| **Autobahn-API** (autobahn.api.bund.dev) | 🔌 | Sperrungen, Staus, Baustellen → Verkehrs-/Logistikebene | Offen (Bund) | Nein |
| **BSI/CERT-Bund RSS** | 🔌 🛠️ | IT-Sicherheitswarnungen als RSS/CSAF → Cyber-Lageebene | Frei | Nein |
| **bund.dev + Python-Paket `deutschland`** | 🧩 🔌 | Zentrale Doku 30+ Behörden-APIs als OpenAPI 3; pip-installierbarer Sammel-Client | Open Source | — |
| **Dashboard Deutschland** (dashboard-deutschland.de, Destatis) | 🎨 🎬 | Vorbild für Indikator-Bündelung; persönlicher Inflationsrechner = Haushaltsbezug-Referenz | Behördlich | — |

## 2. Europäische/internationale Datenquellen

| Quelle | Verwendung | Was konkret | Lizenz/Kosten | Key |
|---|---|---|---|---|
| **AGSI+ / GIE** (agsi.gie.eu) | 🔌 🎬 | Gasspeicher-Füllstände DE/EU, täglich → Energie-Kaskaden | Frei, Attribution "GIE/AGSI" | Ja (kostenlos) |
| **Energy-Charts API** (api.energy-charts.info, Fraunhofer ISE) | 🔌 🎬 | Strompreise, Erzeugung, Emissionen seit 2011 | CC BY 4.0; seit v1.5 (10/2025) strengere Rate-Limits, kommerziell ggf. Kontakt nötig | Nein |
| **ENTSO-E Transparency** | 🔌 | EU-Stromdaten granular | Frei; E-Mail-Freischaltung ~3 Tage, zeitweise instabil | Ja |
| **EIA** (api.eia.gov) | 🔌 🎬 | Brent/WTI-Ölpreise → Kaskaden-Glied "Ölpreis" | US Public Domain | Ja (kostenlos) |
| **ECB Data Portal / Eurostat / Weltbank** | 🔌 | SDMX/REST-Makrodaten ohne Key | Frei | Nein |
| **GDELT** (api.gdeltproject.org) | 🔌 🛠️ 🎬 | Globales Ereignis-Monitoring alle 15 Min; DOC-API rollierend ~3 Monate → Auslöser-Erkennung | Frei, kommerziell ok | Nein |
| **UN Comtrade** | 🔌 🎬 | Handelsströme nach Land/HS-Code | Free-Tier | Ja |
| **Kiel Trade Indicator** (IfW Kiel) | 🔌 🎬 | Handelsfluss-Schätzung aus Schiffsdaten, 75 Länder, monatlich CSV → Lieferketten-Kaskaden, sehr zitierfähig | Quellenangabe | Nein |
| **World Bank Pink Sheet** | 🔌 🎬 | Rohstoffpreise monatlich (Excel) — Ersatz für teure LME-Daten | CC BY 4.0 | Nein |
| **Tankerkönig** (creativecommons.tankerkoenig.de) | 🔌 🎬 | Spritpreise Echtzeit + History-CSV seit 2014 → direkteste Haushaltsauswirkung | CC BY 4.0; 1 Req/Min, 25 km Radius | Ja (kostenlos) |
| **USGS / NASA FIRMS / GDACS / NASA EONET** | 🔌 🎬 | Erdbeben, Feuer-Hotspots, Multi-Hazard-Alerts — alle API-fähig | Frei (US-Gov/UN) | FIRMS: Key kostenlos |
| **Cloudflare Radar Outage Center** | 🔌 🛠️ 🎬 | Internet-Ausfälle mit API → Kaskade "Internet fällt aus" | Frei | Nein |
| **IODA / NetBlocks** | 🛠️ 🎬 | Internet-Outage-Detection; NetBlocks journalistisch zitierfähig | Frei (Ansicht) | Nein |
| **Copernicus EMS / EFAS** | 🎬 🔌 | Satelliten-Katastrophenkarten, frei nutzbar mit Attribution → starkes Video-Material | Copernicus-Lizenz, Attribution Pflicht | CDS: Account |
| **netzfrequenz.info** | 🛠️ 🎬 | Netzfrequenz-Echtzeit → Blackout-Frühindikator, gutes Erklärmaterial | API nur privat | Nein |
| **ACLED** | 🎬 | Konfliktdaten; Public-Tier ~5.000 Zeilen | ⚠️ Kommerziell NICHT frei — nur Zitat/Recherche | Ja |
| **OpenSky Network** | 🔌 | ADS-B-Flugdaten | ⚠️ Kommerziell gesonderte Vereinbarung | Account |

## 3. Open-Source-Projekte (Code, Architektur, Quellenkataloge ableiten)

| Projekt | Lizenz | Was ableiten | Was NICHT |
|---|---|---|---|
| **World Monitor** (github.com/koala73/worldmonitor) | AGPL-3.0, kommerziell lizenzpflichtig | 🧩 Quellenkatalog (65+ Provider, docs/data-sources) abgleichen; Freshness-Monitor-Konzept; Lokal-KI via Ollama ohne Keys; Country-Risk-Scoring-Logik; Varianten aus einer Codebasis | ❌ Code in WachSam einbauen (AGPL = Offenlegungspflicht); ❌ deren Dienste automatisiert anzapfen |
| **OSIRIS** (simplifaisoul/osiris) | **MIT** | 🧩 Code darf übernommen werden! MapLibre-GL-Karten-Setup, Next.js-API-Routes-Pattern | — |
| **global-conflict-intelligence-dashboard** (Vireen555) | prüfen | 🧩 Python/Streamlit + GitHub-Actions-Auto-Refresh = passt exakt zu deinem Stack | Lizenz vor Übernahme prüfen |
| **globalpulse** (ntamero) | unklar | 🧩 🎨 KI-Risikoscoring-Ansatz, 13 Sprachen inkl. Deutsch, Docker-Setup | Lizenz unklar → nur Konzepte, kein Code |
| **Sakuna** (sakuna.tokita.online) | Feed CC0 | 🧩 "0-€-Aggregator"-Blaupause: 1 Cloudflare Worker bündelt 6 freie APIs | — |
| **ShadowBroker / OSINT-War-Room** | prüfen | 🧩 Performance-Patterns (ETag-Caching, Viewport-Culling); Telegram-Geoparsing-Idee | ⚠️ "vibecoded", Telegram-Scraping = ToS-Risiko |
| **The Open OSINT Board** | prüfen | 🧩 CORS-Proxy als einzelne Flask-Datei; graceful degradation bei Rate-Limits | — |
| **Electricity Maps** (contrib-Repo) | Open Source | 🧩 🔌 Vorbild für offenes Daten-Contributor-Modell; CO₂-Stromdaten | — |
| **PolyWorld** | prüfen | 🎨 Prediction-Markets-Panel als Frühindikator-Idee | — |
| **OpenBB** | Open Source | 🛠️ FRED/Finanzdaten in Python ziehen | — |

## 4. Kommerzielle Plattformen (nur Design/Konzepte ableiten — nichts kaufen)

| Plattform | Preis-Realität | Abzuleitendes Designmuster für WachSam |
|---|---|---|
| **Dataminr** | ab ~20.000 $/Jahr | 🎨 Alert-Priorisierung (Flash/Urgent/Alert) → max. 1-3 Karten prominent, Rest tritt zurück. Anti-Lehre: Information Overload vermeiden |
| **Factal** | "einige Tsd. $/Monat" (2018, evtl. veraltet) | 🎨 Verifikations-Status sichtbar machen → "2 Quellen · geprüft am X" pro Lagekarte |
| **Samdesk** | Enterprise | 🎨 Verlauf statt Momentaufnahme → Mini-Historie pro Karte ("eskaliert/entspannt sich") |
| **Crisis24 Horizon** | Enterprise | 🎨 Eine Karte = eine Entscheidung; Handlungsempfehlung visuell stärkstes Element |
| **Janes / ICEYE** | £666–Mio. / Enterprise | 🎨 Zusammenhänge als Grafik → **Wirkungsketten-Visualisierung** (Auslöser → Glieder → €/Monat) = Markenzeichen für Plattform UND Video |
| **Liveuamap** | Free + Paid | 🎨 Kartenzentrierte Event-Organisation; Free/Paid-Schnitt als Monetarisierungs-Vorbild |
| **BBK/GMLZ Lagebild** | nicht öffentlich | 🎨 Konzept-Verwandter Nr. 1: Lagebild + KRITIS-Kaskaden + Prognose, 14-tägig — als Bürger-Version ist das WachSam |
| ❌ Kaspersky/Check-Point Threat-Maps, 3D-Globen | — | Bewusst NICHT übernehmen — Eye-Candy = Overload; WachSams ruhige Karten sind das bessere Produkt für Haushalte |

## 5. Redaktions-Werkzeuge (täglich, kostenlos, self-hosted auf IONOS-VPS)

| Tool | Verwendung |
|---|---|
| **Miniflux** oder FreshRSS | 🛠️ RSS-Zentrale (Tagesschau, Behörden-Feeds, BSI); Miniflux = ressourcenschonendster (Go) |
| **changedetection.io** | 🛠️ Behörden-Seiten ohne RSS überwachen (BfArM-Engpassliste, BNetzA, Destatis-PMs) mit Trigger-Keywords |
| **n8n** (self-hosted) oder cron+Python | 🛠️ 🧩 Daten-Pipeline-Orchestrierung: Fetcher → SQLite/Postgres → WachSam-Frontend |
| **GDELT DOC API** | 🛠️ Themen-/Auslöser-Monitoring für Lagekarten und Videothemen |
| **World Monitor** (worldmonitor.app, Browser) | 🛠️ Persönliches Lage-Monitoring (50-Tabs-Ersatz); ⚠️ Grauzone bei redaktioneller Nutzung, nicht automatisiert anzapfen |
| **ADS-B Exchange** | 🛠️ Ungefilterte Flugdaten für Vorfall-Recherche (journalistenfreundlich) |

## 6. YouTube-Produktions-Stack (bereits bezahlt/vorhanden zuerst)

| Baustein | Quelle | Kosten | Hinweise |
|---|---|---|---|
| Skript/Regie | Claude Code + WachSam-Lagekarten als Input | vorhanden (Max) | Lagekarte = fertiges Video-Briefing (Hook=Entwicklung, Hauptteil=Wirkungskette, CTA=Maßnahme) |
| Video-Clips | **Veo 3.1 (Fast/Lite) via Vertex AI** | ~300 € Google-Guthaben → grob 250-400+ Fast-Clips ≈ 5-10 Videos | Verfallsdatum prüfen! Ggf. Clips auf Vorrat; kommerzielle Nutzung lt. Google-Terms ok |
| Standbilder/Thumbnails | **GPT Image** (ChatGPT Pro) | vorhanden (Pro) | Kein exaktes 16:9 (1536×1024) → croppen; Ken-Burns-Zoom in DaVinci spart Video-Credits |
| B-Roll echt | **Pexels** | 0 € | Keine Indemnification → Marken/Personen meiden; Storyblocks erst bei Skalierung |
| Screen-Material | USGS, FIRMS, GDACS, Copernicus EMS, Energy-Charts, netzfrequenz.info, Cloudflare Radar, GDELT-Visuals | 0 € | Attribution einblenden; Threat-Maps (Kaspersky etc.) nur mit Vorsicht (Marken) |
| Voiceover | **ElevenLabs Starter** (Multilingual v2) | 5 $/Monat | 30.000 Credits ≈ 2-3 Videos/Monat; bei 4 Videos → Creator (22 $) |
| Schnitt | **DaVinci Resolve Free** | 0 € | Kommerziell erlaubt; 1080p auf T14 ohne dGPU machbar (Proxy-Modus). ❌ CapCut: ToS-Risiko (perpetual license, Jun 2025) |
| Automatisierung | Codex CLI: Manifeste, Benennung, Metadaten, ggf. YouTube-API-Upload | vorhanden | ⚠️ AI-Disclosure-Schalter manuell in YT Studio setzen; Faktencheck bleibt manuell |
| Musik/SFX | YouTube Audio Library | 0 € | lizenzfrei |

**Startbudget gesamt: ~5 $/Monat** (bis Google-Guthaben aufgebraucht), danach Higgsfield Plus/Ultra evaluieren (39-99 $).

## 7. Lizenz-Ampel (Kurzreferenz)

- 🟢 **Frei + kommerziell:** DL-DE Zero (Pegelonline) · DL-DE 2.0 (Destatis, SMARD-Umfeld) · CC BY 4.0 (DWD, Tankerkönig, Energy-Charts, RKI, LHP, Pink Sheet) · US Public Domain (EIA, USGS, FIRMS) · GDELT · MIT-Code (OSIRIS)
- 🟡 **Mit Auflagen/prüfen:** Copernicus (Attribution-Formel) · AGSI+ (Quellenangabe) · OpenSky (kommerziell gesondert) · Energy-Charts (Rate-Limits seit 2025) · World Monitor als Werkzeug (nicht-kommerziell-Grenze unscharf) · GitHub-Projekte ohne klare LICENSE
- 🔴 **Nicht frei kommerziell:** ACLED · MoWaS-RSS (gewerblich) · UFZ-Dürremonitor (keine offene Lizenz — vorher anfragen) · LME/EEX/Drewry-Echtzeit · CapCut (ToS) · Medien-Volltexte (nur verlinken/kurz zitieren)

## 8. Bestätigte Differenzierung (aus allen drei Recherchen)

Kein gefundenes Projekt kombiniert: **Deutschland-zentriert + Haushaltsauswirkung in Euro + erklärte Wirkungsketten + Handlungsempfehlungen für Privathaushalte + deutschsprachig + ruhiger Ton.** Die OSINT-Dashboards liefern Signale für Analysten (englisch, global), die Behörden-Lagebilder sind intern, die Profi-Tools B2B ab 20.000 $/Jahr, die Krisen-Nische auf YouTube wird von der Panik-Ökonomie bedient. → WachSams Aufgabe ist die **Übersetzungsschicht**, nicht die Aggregation — und der YouTube-Kanal ist dieselbe Übersetzungsschicht als Video.

## Offene Prüfpunkte

1. Verfallsdatum des Google-Cloud-Guthabens (Cloud Console → Abrechnung)
2. Veo-Verfügbarkeit in EU-Region vs. us-central1
3. Higgsfield-Tarif + kommerzielle Lizenz des Einstiegstarifs (widersprüchliche Quellen) — nur falls später relevant
4. LICENSE-Dateien von globalpulse, Vireen555-Dashboard, ShadowBroker vor Code-Übernahme
5. UFZ-Dürremonitor: Lizenzanfrage, falls Dürre-Layer gewünscht (andreas.marx@ufz.de)
