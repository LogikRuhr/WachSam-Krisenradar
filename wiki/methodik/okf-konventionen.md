---
type: Methodik
title: OKF-Konventionen
description: Wie Seiten nach dem Open Knowledge Format aufgebaut und verlinkt werden.
tags: [methodik, okf, format]
confidence: hoch
last_updated: 2026-06-14
---

# OKF-Konventionen

Das Wiki folgt dem **Open Knowledge Format (OKF)** — einem offenen, herstellerneutralen
Muster: ein Verzeichnisbaum aus Markdown-Dateien mit YAML-Frontmatter, deren
Markdown-Links einen Konzept-Graphen bilden.

Referenz: Google Cloud, „How the Open Knowledge Format can improve data sharing"
(`https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing`,
Stand 2026-06-14). Konzeptueller Ursprung: Andrej Karpathys „LLM Wiki"-Muster.

## Prinzipien

1. **Just Markdown** — in jedem Editor lesbar, auf GitHub renderbar.
2. **Just Files** — als Tarball versendbar, in Git versionierbar, kein Backend nötig.
3. **Format, kein Produkt** — keine proprietären Accounts oder SDKs.

## Pflichten pro Seite

- Frontmatter mit Pflichtfeld `type` (siehe [AGENTS.md](../AGENTS.md) für das Schema).
- Mindestens ein eingehender Link aus der jeweiligen `index.md` (keine Waisen).
- Faktenbehauptungen mit Eintrag in `sources` (echte URL + `stand`).

## Verlinkung

Beziehungen entstehen durch relative Markdown-Links zwischen Seiten, z. B. verweist
[Gasversorgung](../risiken/gasversorgung.md) auf
[Kaskadeneffekt](../konzepte/kaskadeneffekt.md). Diese Links sind der „Graph" — Tools
(inkl. OKF-Visualizer) können ihn rendern.

## Namensgebung

- Dateinamen klein, mit Bindestrich, ohne Umlaute (`gasversorgung.md`).
- Ereignisse mit Datumspräfix: `YYYY-MM-kurztitel.md`.
