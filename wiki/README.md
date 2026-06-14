# WachSam Krisen-Wiki

Eine gepflegte, agenten- und menschenlesbare Wissensbasis zu Krisen, systemischen
Risiken und deren Auswirkungen auf deutsche Haushalte. Aufgebaut nach dem
**LLM-Wiki-Muster** (Karpathy) und dem **Open Knowledge Format (OKF)** von Google
Cloud: ein Verzeichnis aus Markdown-Dateien mit YAML-Frontmatter, deren Links einen
Konzept-Graphen bilden.

## Zweck

Dieses Wiki ist die **stabile Wissensschicht** von WachSam — nicht die Live-Lage.
Es kompiliert verstreutes, langsam veränderliches Hintergrundwissen (Mechaniken,
Definitionen, Quellenregister, historische Ereignisse) zu verlässlichen, zitierfähigen
Seiten. Die **Echtzeit-Lage** (aktuelle Warnungen, Pegel, Preise) wird NICHT hier
gespeichert, sondern live über die in [`quellen/`](quellen/index.md) registrierten
Schnittstellen abgefragt.

> Faustregel: Ist eine Information in 3 Monaten noch wahr oder lehrreich? → ins Wiki.
> Ist es ein Schnappschuss von heute? → Live-Quelle, nicht hier.

## Struktur

| Ordner | Inhalt |
|---|---|
| [`konzepte/`](konzepte/index.md) | Definitionen & Mechaniken (Kaskade, systemisches Risiko, Resilienz) |
| [`risiken/`](risiken/index.md) | Risikodomänen mit Wirkketten auf Haushalte |
| [`quellen/`](quellen/index.md) | Register offizieller/behördlicher Datenquellen |
| [`ereignisse/`](ereignisse/index.md) | Datierte Ereignis-Chronik mit Status (aktiv/abgeflaut/archiviert) |
| [`methodik/`](methodik/index.md) | Frische-/Status-Regeln und OKF-Konventionen |

## Regeln

Verbindlich: [`AGENTS.md`](AGENTS.md) (Schema, Ingest/Query/Lint, DSGVO).
Einstieg für Agenten: [`llms.txt`](llms.txt). Maschinen-Index: [`index.md`](index.md).

## Quellen-Disziplin

Jede Faktenbehauptung trägt eine **echte Quelle mit Stand**. Keine erfundenen Quellen,
keine PII — nur offizielle, zitierfähige Stellen (BBK, DWD, BNetzA, Destatis u. a.).
