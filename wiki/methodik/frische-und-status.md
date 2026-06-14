---
type: Methodik
title: Frische & Status
description: Lebenszyklus-Modell für Wiki-Inhalte und die Trennung von Wissen und Live-Lage.
tags: [methodik, frische, status, qualitaet]
confidence: hoch
last_updated: 2026-06-14
---

# Frische & Status

Das Wiki ist nur wertvoll, wenn klar ist, **wie frisch** eine Aussage ist. Dafür trägt
jede Seite `last_updated`, `confidence` und (bei Ereignissen) `status`.

## Status-Lebenszyklus (Ereignisse)

| Status | Bedeutung |
|---|---|
| `aktiv` | Ereignis läuft, Lage verändert sich |
| `beobachtet` | erhöhte Aufmerksamkeit, noch kein akutes Ereignis |
| `abgeflaut` | Ereignis vorbei, aber jung genug für Nachbetrachtung |
| `archiviert` | historisch; dient als Muster-/Vergleichswissen |

Ein abgeflautes Ereignis wird **nicht gelöscht**, sondern auf `archiviert` gesetzt. So
entsteht Muster-Wissen: „So verläuft ein Ereignis dieser Art" (siehe
[Kaskadeneffekt](../konzepte/kaskadeneffekt.md)).

## Confidence

- `hoch` — mehrfach durch offizielle Quellen bestätigt.
- `mittel` — eine offizielle Quelle oder teilweise bestätigt.
- `niedrig` — veraltet (`last_updated` > 180 Tage) oder nur schwach belegt → prüfen.

## Trennung Wissen ↔ Live-Lage

Diese Trennung ist die wichtigste Methodik-Regel:

- **Wiki (stabil):** Mechanik, Definition, Wirkkette, Quellenregister, Historie.
- **Live (flüchtig):** aktuelle Warnstufe, Pegelstand, Tagespreis, Speicherfüllstand.

Flüchtige Werte gehören **nie** als feste Zahl ins Wiki — sie veralten sofort. Das Wiki
verweist stattdessen auf die zuständige Live-Quelle in
[../quellen/](../quellen/index.md).

## Lint-Auslöser

Beim `lint` (siehe [AGENTS.md](../AGENTS.md)) werden geprüft: veraltete Seiten,
verwaiste Seiten, tote Quell-URLs, Widersprüche zwischen Seiten.
