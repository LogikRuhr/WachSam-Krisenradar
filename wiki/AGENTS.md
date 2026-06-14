# AGENTS.md — Schema & Pflege-Regeln des Krisen-Wikis

Verbindliche Regeln für jeden Agenten, der dieses Wiki liest oder pflegt. Ergänzt die
globale `../AGENTS.md` (Plan-First, Security, DSGVO, keine erfundenen Quellen) — bei
Konflikt gilt die globale Datei.

## 1. Format (OKF / LLM-Wiki)

Jede Inhaltsseite ist Markdown mit YAML-Frontmatter. Pflichtfeld ist `type`. Relative
Markdown-Links zwischen Seiten bilden den Konzept-Graphen. Keine Datenbank,
kein Build-Zwang — die Dateien sind die Quelle der Wahrheit.

### Frontmatter-Schema

```yaml
---
type: Konzept | Risikodomaene | Quelle | Ereignis | Methodik | Index
title: Klarer Titel
description: Ein Satz, was die Seite enthält.
tags: [energie, haushalt, ...]
status: aktiv | beobachtet | abgeflaut | archiviert   # v. a. für Ereignisse
confidence: hoch | mittel | niedrig
last_updated: YYYY-MM-DD
sources:
  - url: https://...            # echte, offizielle Quelle
    stand: YYYY-MM-DD           # wann zuletzt gegen die Quelle geprüft
---
```

## 2. Operationen

### Ingest (neue Quelle aufnehmen)
1. Quelle lesen, Kernaussagen extrahieren.
2. **Bestehende Seite aktualisieren statt duplizieren** (Dedup-Pflicht).
3. `sources` und `last_updated` setzen; betroffene Querverweise nachziehen.
4. Bei Ereignissen: `status` setzen und Datum im Dateinamen (`YYYY-MM-...`).

### Query (Frage beantworten)
1. Relevante Wiki-Seiten suchen, Antwort **mit Zitaten** aus `sources` synthetisieren.
2. Für Echtzeit-Werte (aktuelle Warnung/Pegel/Preis) NICHT das Wiki zitieren, sondern
   die in [`quellen/`](quellen/index.md) registrierte Live-Quelle abfragen.
3. Wertvolle, dauerhafte Erkenntnisse zurück ins Wiki schreiben.

### Lint (Gesundheitscheck)
- Markiere Seiten mit `last_updated` älter als **180 Tage** als `confidence: niedrig`
  und notiere „prüfen" — Werte können veraltet sein.
- Finde verwaiste Seiten (keine eingehenden Links) und tote Quell-URLs.
- Finde Widersprüche zwischen Seiten und melde sie, statt sie still zu überschreiben.

## 3. Trennung Wissen ↔ Live-Lage (kritisch)

- **Ins Wiki:** Mechaniken, Definitionen, Wirkketten, Quellenregister, historische
  Ereignisse mit Lessons Learned.
- **NICHT ins Wiki (Live):** aktuelle Warnstufen, Pegelstände, Tagespreise,
  Speicherfüllstände von heute. Diese veralten sofort → nur über Live-Schnittstellen.

## 4. Sicherheit & DSGVO

- Keine PII, keine personenbezogenen Daten — nur aggregierte/öffentliche Fakten.
- Keine Secrets, Tokens oder Cookies in Wiki-Dateien.
- Nur offizielle, zitierfähige Quellen. Cookie-Scraping/ToS-Graubereich ist hier
  ausgeschlossen.
- Sachlich, nicht alarmistisch (globale Stil-Regel).
