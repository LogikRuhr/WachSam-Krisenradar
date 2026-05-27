# Session-Handoff — WachSam

> Format und Lifecycle der einzigen Handoff-Datei: `.remember/next-session-brief.md`.

## Zweck

Eine Datei pro Repo, die jede Session am Anfang liest und am Ende aktualisiert. Sie beantwortet drei Fragen:

1. Was läuft gerade?
2. Was steht als nächstes an?
3. Welche Regeln gelten für die nächste Session?

Today-Logs, Archive, Recent-Files oder Memory-Indexes gibt es im Repo nicht. Persistenz außerhalb dieses einen Briefs liegt in Git-History.

## Pfad

```
.remember/next-session-brief.md
```

Nichts anderes wird in `.remember/` getrackt (außer der Brief selbst und ggf. ein `.gitignore`).

## Frontmatter

YAML-Block am Anfang der Datei:

```yaml
---
handoff: wachsam-app
erstellt: YYYY-MM-DD
status: Kurzbeschreibung des aktuellen Stands
thema: Ein Satz, was diese Session-Phase tut
---
```

Felder:

- `handoff` — Repo-Identifier, bleibt `wachsam-app`.
- `erstellt` — Datum der letzten Brief-Aktualisierung, ISO-Format `YYYY-MM-DD`.
- `status` — Kurzlabel, z.B. `V0.1-LIVE + WORKSPACE-REBUILD-IM-GANG`.
- `thema` — ein Satz zur aktuellen Phase.

## Pflicht-Sektionen

Nach dem Frontmatter folgen in dieser Reihenfolge:

1. **Direction-Reminder.** Ein Absatz, der die verbindliche Produkt-Direction zitiert und alte Frames als verworfen markiert.
2. **Was läuft.** Stack, aktive Files, aktueller Verify-Stand in zwei bis vier Bullet-Points.
3. **Was als nächstes ansteht.** Tabelle mit Wellen oder Aufgaben, Status-Spalte (`offen`, `in Arbeit`, `done`).
4. **Hard Rules.** Nummerierte Liste der nicht verhandelbaren Regeln für die nächste Session.
5. **Branch.** Aktiver Branch und woher er abgezweigt ist.
6. **Verify-Stand.** Letzter bekannter Stand von `typecheck`, `build`, Tracked-Files-Count, Working-Tree-Status.
7. **Was die nächste Welle anlegen muss.** Datei-für-Datei-Skizze (nur Stichworte, keine fertigen Inhalte).
8. **Offen / klären.** Punkte, die vor Welle-Start mit dem User geklärt werden müssen.
9. **Memory-Aktualisierung.** Hinweise auf Auto-Memory-Einträge, die nach der Welle aktualisiert werden müssen.

Sektionen können entfallen, wenn sie leer wären. Reihenfolge bleibt.

## Wann der Brief aktualisiert wird

- **Am Session-Ende.** Immer. Auch wenn nichts committed wurde.
- **Nach jeder abgeschlossenen Welle.** Wave-Status auf `done` setzen, nächste Welle queue'n.
- **Bei Richtungswechsel.** Wenn der User eine neue Direction oder ein neues Verbot setzt, sofort in den Brief.

Nicht aktualisiert wird der Brief bei Routine-Lookups, Verify-Runs ohne Code-Change oder kurzen Recherchen.

## Was NICHT in den Brief gehört

- Secrets, Tokens, API-Keys.
- PII (E-Mail-Adressen außer der Repo-eigenen, Adressen, Telefonnummern).
- Große Code-Blöcke (verweise auf Datei + Zeile statt zu kopieren).
- Halbfertige Pläne, die nicht freigegeben sind.
- Today-Logs, Activity-Logs, Chat-Verläufe.

## Beispiel-Skelett

```markdown
---
handoff: wachsam-app
erstellt: 2026-05-12
status: V0.1-LIVE + WAVE-3-IM-GANG
thema: Operative Stabilität — Doku, Scripts, minimale Settings.
---

# Next-Session-Brief

WachSam-Direction (verbindlich, neu festgelegt 2026-05-11/12):
Deutschland-zentriertes Krisen- und Haushalts-Auswirkungsradar …

## Was läuft (v0.1)

- `v01/` — statische Homepage, …
- Verify zuletzt: typecheck PASS, build PASS, …

## Was als nächstes ansteht

| Welle | Inhalt | Status |
|---|---|---|
| 3-1 | Doku-Quartett | … |

## Hard Rules für jede nächste Session

1. Homepage-Verhalten nicht ändern ohne Freigabe.
2. Plan vor Code.
3. …

## Branch

`harness-rebuild-v01`, abgezweigt von …

## Verify-Stand

- typecheck: …
- build: …
- Working Tree: …

## Was Welle X anlegen muss

- `pfad/datei.md` — Skizze in einem Satz.

## Offen / klären

- Punkt 1
- Punkt 2

## Memory-Aktualisierung

- Eintrag „…" prüfen.
```

## Persistenz außerhalb des Briefs

- **Code und Doku** — Git-History.
- **Architektur-Entscheidungen** — Doku in `docs/`, nicht im Brief.
- **User-Präferenzen über Sessions hinweg** — Auto-Memory (außerhalb des Repos).
- **Alles andere** — bewusst nicht persistiert.
