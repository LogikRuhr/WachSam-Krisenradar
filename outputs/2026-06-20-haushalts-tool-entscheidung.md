# WachSam Haushalts-Tool - Entscheidungsstand

Stand: 2026-06-20, repo-geprueft am 2026-06-22. Status: Konzept zur Entscheidung, kein Bauauftrag fuer den grossen Umbau.

## Anlass

Das Live-Feedback sieht WachSam fachlich als brauchbare Informationsseite, aber noch nicht als persoenliches Haushalts-Tool. Die Hauptluecken sind:

- kein persoenlicher Kostenrechner
- keine Monatskosten-Schaetzung in Euro-Spannen
- keine priorisierten Sparhebel
- keine klare Liste "betrifft mich" / "betrifft mich nicht"
- mobil weiterhin zu textlastig und nicht app-artig genug

## Bereits entschieden

- Lebensmittel: Destatis-Index plus Modell-Warenkorb, keine Discounter-Scraping-Loesung.
- Euro-Aussagen: Spannen und Genauigkeitsstufen, keine Scheingenauigkeit.
- Speicherung: anonymer Schnellcheck plus optionales Account-Speichern.
- Methodik: Benchmark-Klassen nach Heizspiegel-/Stromspiegel-Logik.
- App-Ansatz: App-Shell/PWA vor nativer App.

## Offene Richtungsentscheidung

### Weg A - App-first Fundament-Reset

Erst mobiles App-Fundament und PWA, danach Haushalts-Tool. Empfohlen, weil es die wiederkehrende Mobile-Kritik dauerhaft adressiert. Risiko: sichtbarer Feature-Nutzen kommt etwas spaeter.

### Weg B - Tool-first minimal-invasiv

Plain CSS behalten und direkt das Haushalts-Tool bauen. Schnellster sichtbarer Nutzen, aber die Mobile-Kernkritik bleibt zuerst bestehen und spaetere App-Shell-Arbeit wird wahrscheinlicher doppelt.

### Weg C - Grosser Wurf parallel

Fundament, App-Shell und Tool gemeinsam. Schnellstes Gesamtbild, aber hoechstes Risiko, schwerer testbar und schwerer rueckrollbar.

## Empfohlene Umsetzung nach Richtungswahl

W0: Frontend-Fundament und App-Shell, falls Weg A oder C gewaehlt wird.

W1: Tool-MVP mit Profil-Erweiterung, Benchmark-Euro-Engine fuer Energie/Heizen und Mobilitaet, Ergebnis-Screen, anonymer Schnellcheck und "betrifft mich nicht"-Basis.

W2: Lebensmittel ueber Destatis-Subindex plus Modell-Warenkorb, Genauigkeitsstufen und weitere Kostentreiber.

W3: Sparhebel-Spannen je Massnahme, neutrale regionale Vergleiche und optionales Speichern im Profil.

## Optimierte Ausfuehrung fuer diesen Branch

Der Branch `feat-data-viz-nutzen` enthaelt bereits eine kleine, risikoarme Vorarbeit:

- Sparklines aus vorhandenen `indicator_observations`
- Skeleton-Ladezustaende fuer datenlastige Routen
- NutzenBoard auf der Startseite
- keine DB-Migration, keine neuen Datenquellen, keine neuen Userdaten

Diese Welle baut noch nicht das Haushalts-Tool. Sinnvoller Abschluss ist:

- Plan in `outputs/` tracken
- modusbasierte Begrifflichkeit herstellen
- Worktree-kompatibles Root-Verify sichern
- lokale Verify-Gates und Mobile-Smoke laufen lassen

## Nicht bauen ohne separate Freigabe

- Tailwind/shadcn-Einfuehrung
- App-Shell/PWA
- Haushaltsprofil-Erweiterung
- Euro-Benchmark-Engine
- neue Speicherung oder neue Userdaten
- Deploy, Push oder Merge
