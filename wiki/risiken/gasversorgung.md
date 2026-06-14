---
type: Risikodomaene
title: Gasversorgung
description: Wirkkette von Störungen der Gasversorgung auf Heiz- und Energiekosten deutscher Haushalte.
tags: [energie, gas, versorgung, kosten, haushalt]
confidence: hoch
last_updated: 2026-06-14
sources:
  - url: https://www.bundesnetzagentur.de/DE/Gasversorgung/aktuelle_gasversorgung/start.html
    stand: 2026-06-14
  - url: https://agsi.gie.eu/
    stand: 2026-06-14
---

# Gasversorgung

Erdgas versorgt deutsche Haushalte mit Wärme und Warmwasser und treibt Teile der
Stromerzeugung. Störungen wirken über Preise und – im Extremfall – über physische
Knappheit auf Haushalte.

## Wirkkette

1. **Auslöser:** Import-/Lieferunterbrechung, Infrastruktur-Schaden, Nachfrage-Spitze
   bei Kälte, niedrige Speicherfüllstände.
2. **Kopplung:** Gas → Wärmeversorgung und Gaskraftwerke → [Stromversorgung](stromversorgung.md).
3. **Markt:** Knappheit treibt Großhandelspreise, die verzögert bei Haushalten ankommen.
4. **Eskalation:** Im Mangelfall greift die Notfallstufe der Gas-Notfallvorsorge der
   Bundesnetzagentur (geschützte Kunden, u. a. Haushalte, zuletzt).

## Live-Indikatoren (NICHT im Wiki speichern)

- Speicherfüllstände: AGSI / Gas Infrastructure Europe (`agsi.gie.eu`).
- Lage & Notfallstufe: Bundesnetzagentur, aktuelle Gasversorgung.

> Diese Werte sind flüchtig und werden zur Laufzeit abgefragt, nicht hier als Zahl
> hinterlegt (siehe [Frische & Status](../methodik/frische-und-status.md)).

## Haushalts-Wirkung

- **Kosten:** steigende Heiz-/Abschlagskosten.
- **Versorgung:** im Mangelfall Priorisierung; Haushalte sind geschützte Kunden.
- **Stabilität:** indirekt über gekoppelte [Stromversorgung](stromversorgung.md).

Mechanik: [Kaskadeneffekt](../konzepte/kaskadeneffekt.md). Gegenmaßnahme:
[Haushalts-Resilienz](../konzepte/haushalts-resilienz.md).
