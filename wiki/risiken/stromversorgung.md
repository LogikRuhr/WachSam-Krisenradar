---
type: Risikodomaene
title: Stromversorgung
description: Wirkkette von Störungen der Stromversorgung auf Versorgung und Stabilität deutscher Haushalte.
tags: [energie, strom, versorgung, stabilitaet, haushalt]
confidence: hoch
last_updated: 2026-06-14
sources:
  - url: https://www.smard.de/
    stand: 2026-06-14
  - url: https://transparency.entsoe.eu/
    stand: 2026-06-14
---

# Stromversorgung

Strom ist der am stärksten gekoppelte Knoten kritischer Infrastruktur: nahezu alle
anderen Sektoren hängen von ihm ab. Ein Ausfall hat das höchste Kaskadenpotenzial.

## Wirkkette

1. **Auslöser:** Erzeugungs-/Netzungleichgewicht, Großschaden, extreme Last,
   Abhängigkeit von [Gasversorgung](gasversorgung.md) bei Gaskraftwerken.
2. **Kopplung:** Strom → Wasser/Abwasser, Kommunikation, Kälte/Lebensmittel,
   Bezahlsysteme, Heizungssteuerung.
3. **Fortpflanzung:** schon kurze Ausfälle stören mehrere Sektoren gleichzeitig
   (siehe [Kaskadeneffekt](../konzepte/kaskadeneffekt.md)).

## Live-Indikatoren (NICHT im Wiki speichern)

- Erzeugung/Verbrauch/Last: SMARD (Bundesnetzagentur, `smard.de`).
- Europäische Netzdaten: ENTSO-E Transparency Platform (`transparency.entsoe.eu`).

## Haushalts-Wirkung

- **Versorgung:** Ausfall von Kühlung, Wasser, Kommunikation.
- **Stabilität:** Bezahl-/Notrufsysteme betroffen.
- **Kosten:** Großhandelspreise wirken verzögert auf Tarife.

Gegenmaßnahme: [Haushalts-Resilienz](../konzepte/haushalts-resilienz.md)
(netzunabhängige Vorräte, Beleuchtung, Kommunikation).
