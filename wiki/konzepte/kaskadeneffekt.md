---
type: Konzept
title: Kaskadeneffekt
description: Mechanik, bei der der Ausfall eines Systems Folgeausfälle in abhängigen Systemen auslöst.
tags: [konzept, kaskade, kritische-infrastruktur, systemisches-risiko]
confidence: hoch
last_updated: 2026-06-14
sources:
  - url: https://www.bbk.bund.de/DE/Themen/Kritische-Infrastrukturen/kritische-infrastrukturen_node.html
    stand: 2026-06-14
---

# Kaskadeneffekt

Ein **Kaskadeneffekt** liegt vor, wenn die Störung oder der Ausfall eines Systems über
Abhängigkeiten weitere Systeme stört — eine Kette von Folgewirkungen. Für WachSam ist das
die zentrale Mechanik, um aus einem Einzelereignis die **Auswirkung auf Haushalte**
abzuleiten.

## Wirkprinzip

1. **Auslöser** — primäre Störung (z. B. Stromausfall, Lieferunterbrechung).
2. **Kopplung** — abhängige Systeme sind technisch/logistisch verbunden.
3. **Fortpflanzung** — der Ausfall wandert entlang der Kopplungen weiter.
4. **Haushalts-Wirkung** — am Ende stehen Kosten, Versorgung oder Stabilität.

## Beispiel-Kette

Stromausfall → Ausfall von Pumpen/Kälte/Kommunikation → Störung bei Wasser, Lebensmitteln
und Bezahlsystemen → unmittelbare Haushalts-Auswirkung. Kritische Infrastrukturen sind
stark gekoppelt, weshalb das BBK sie als Sektoren mit besonderer Abhängigkeit führt
(BBK, Kritische Infrastrukturen, Stand 2026-06-14).

## Bezug im Wiki

- Domäne: [Stromversorgung](../risiken/stromversorgung.md),
  [Lieferketten](../risiken/lieferketten.md)
- Übergeordnet: [Systemisches Risiko](systemisches-risiko.md)
- Gegenmaßnahme auf Haushaltsebene: [Haushalts-Resilienz](haushalts-resilienz.md)
- Historisches Muster: [Ahrtal-Hochwasser 2021](../ereignisse/2021-07-ahrtal-hochwasser.md)
