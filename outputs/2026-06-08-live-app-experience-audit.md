# WachSam Live-App-Experience-Audit (2026-06-08)

Scope: read-only Audit gegen `https://wachsam.ruhrlogik.de` plus Prüfung der bereits untracked Artefakte. Keine Code-/DB-/Deploy-Änderungen.

## Kurzbefund

WachSam ist live erreichbar und inhaltlich deutlich weiter als eine reine Landingpage: Public-Routen, Quellen, Kaskaden-Details, Login und mehrere Inhaltsbereiche funktionieren. Die App-Wirkung bleibt aber noch begrenzt, weil die Oberfläche überwiegend Listen/Karten ausgibt und kaum App-Zustand, Nutzerfortschritt, persönliche Relevanz oder interaktive Erklärung bietet.

Wichtig: Die bereits untracked Reports vom 2026-06-05 enthalten genau die angefangene Richtung und sollten nicht ignoriert werden. Sie bestätigen P0-Hebel: Member-Dashboard, Methodik-Popover, Confidence-/Quellen-Chip, Stand-Datum, bessere Source-Härtung.

## Technischer Smoke

- `https://wachsam.ruhrlogik.de/`: HTTP 200, Titel `WachSam — Krisenradar`.
- Next.js erkennbar (`X-Powered-By: Next.js`, RSC/Next payload).
- Public-Routen via Playwright/curl geprüft:
  - `/` → 200, H1: `Was globale Entwicklungen für deinen Alltag in Deutschland bedeuten.`
  - `/lagebild` → 200, H1: `Deutschland in zehn Bereichen`
  - `/kosten` → 200, H1: `Was teurer werden kann`
  - `/kaskaden` → 200, H1: `Wie Krisen zusammenhängen`
  - `/massnahmen` → 200, H1: `Was ich tun kann`
  - `/quellen` → 200, H1: `Quellen & Methodik`
  - `/profil` → redirect/Login, effektiv Login mit H1 `Anmelden`
- Browser-Konsole: keine App-JS-Errors; ein 404 für `/favicon.ico`.
- Leere `<p>`-Elemente: in Playwright-DOM auf geprüften Routen keine gefunden.

## Findings

### F1 — Mobile Horizontal Overflow

- Severity: High
- Kategorie: UX/Responsive
- Evidence: Mobile viewport 390×844 ergibt `scrollWidth: 494`, `clientWidth: 375`, `overflowX: true`.
- Wirkung: Seite ist mobil breiter als Viewport; das fühlt nicht wie App an und kann Navigation/Cards seitlich abschneiden.
- Wahrscheinliche Ursache: breite Header-/Card-/Layout-Elemente oder nicht umbrechende Tokens.
- Verify-Fix: Playwright mobile viewport 390×844 muss `overflowX: false` ergeben.

### F2 — Startseite erklärt gut, aber App-State fehlt

- Severity: Medium
- Kategorie: Product/App Experience
- Beobachtung: Startseite hat klare Story und CTAs (`Aktuelle Lage ansehen`, `Maßnahmen prüfen`), aber keinen persönlichen oder sessionbezogenen Zustand.
- Fehlende App-Signale:
  - keine `letzte Prüfung` / `seit deinem letzten Besuch geändert`
  - keine persönliche Relevanz
  - keine Watchlist / gespeicherte Themen
  - keine Fortschritts- oder Checklistenlogik
- Konsequenz: wirkt informativ, aber nicht wie ein Werkzeug, das man wiederholt nutzt.

### F3 — `/lagebild` und Startseitenkarten verlinken repetitiv auf dieselbe Liste

- Severity: Medium
- Kategorie: Navigation/App Flow
- Evidence: `/lagebild` enthält viele CTAs `Mehr im Lagebild`, die auf `/lagebild` selbst zeigen.
- Wirkung: Nutzer erwartet Details, bekommt aber oft nur dieselbe Listenebene. Das schwächt den App-Flow.
- Empfehlung: Detailziele oder modulare Erklär-/Handlungsziele pro Bereich statt Self-Link.

### F4 — `/kosten` und `/massnahmen` sind solide Listen, aber keine Arbeitsoberflächen

- Severity: Medium
- Kategorie: Product/App Experience
- Beobachtung: Inhalte sind brauchbar, quellengeführt und ruhig. Aber es fehlen App-Mechaniken:
  - Auswahl/Speichern `betrifft mich`
  - Checkliste `geprüft / offen`
  - Filter nach Haushalt/Heizart/Mobilität
  - Verbindung zu Profil oder Watchlist
- Konsequenz: Hoher Informationswert, geringer Wiederbesuchswert.

### F5 — `/kaskaden` hat Details, aber Explorer-Charakter fehlt noch

- Severity: Medium
- Kategorie: Interaktion/Erklärbarkeit
- Beobachtung: `/kaskaden` listet 12 Ketten und Detailseiten funktionieren (`/kaskaden/cascade-a` öffnet). Detailseite hat `Wirkungskarte` und Erklärbereiche.
- Gap: Es ist noch kein klarer interaktiver Explorer im Sinne `Signal → Deutschland-Relevanz → Systemstress → Haushaltsauswirkung → was prüfen?` sichtbar.
- Empfehlung: P1 aus Worldmonitor-Konzeptanalyse: eigener Wirkungsketten-Explorer, aber ohne AGPL-Code/Assets/Formeln.

### F6 — Quellen-/Methodik-Seite ist stark, aber Methodik ist zu weit weg vom Wert

- Severity: Medium
- Kategorie: Transparenz
- Beobachtung: `/quellen` ist umfangreich (44 Artikel/Quellenblöcke). Das stärkt Glaubwürdigkeit.
- Gap: Auf Karten selbst fehlt oft ein direktes `Wie entsteht dieser Wert?` / Quellenzahl + Confidence-Chip / konsistentes Stand-Datum.
- Empfehlung: P0-Muster aus untracked Worldmonitor-Analyse umsetzen: Methodik-Popover, Confidence-/Quellen-Chip, Stand-Datum an jedem Wert.

### F7 — Favicon fehlt

- Severity: Low
- Kategorie: Polish/Brand
- Evidence: Console: `Failed to load resource: the server responded with a status of 404 () @ https://wachsam.ruhrlogik.de/favicon.ico`.
- Wirkung: kleiner Branding-/Polish-Mangel.

## Prüfung der untracked Dateien

### `outputs/wachsam-produktblock-audit-2026-06-05.md`

Status: relevant, sollte nicht verworfen werden.

Wichtige Punkte:
- bestätigt: WachSam technisch produktiv, Public-Story stark, aber Nutzwert-Tiefe fehlt.
- P0 offen:
  - Member-Dashboard fehlt (`/profil` nur Form/Login-Pfad)
  - Methodik-Popover `Wie entsteht dieser Wert?`
  - Confidence-/Quellen-Chip
  - Tankerkönig previous_value / Datenqualität vor W6b
- PR-Plan ist brauchbar und priorisiert:
  - PR E Teil 1: Erklärbarkeit
  - PR B: Member-Bereich `Mein Bereich`
  - PR D: Datenquellen-Statusmatrix + Adapter-Härtung

Empfehlung: als Produkt-/Plan-Artefakt reviewen und wahrscheinlich committen, falls keine sensiblen Inhalte enthalten sind.

### `outputs/worldmonitor-konzeptanalyse-2026-06-05.md`

Status: relevant als konzeptionelle Referenz, aber mit klarer Lizenzgrenze.

Wichtige Punkte:
- AGPL-3.0-only + Trademark: kein Code, keine Assets, keine Texte, keine Formeln, keine 1:1 UI-Übernahme.
- Nutzbare abstrakte Muster:
  - Methodik-Button pro Panel
  - Quellenanzahl + Konfidenz pro Item
  - Stand-Datum pro Wert
  - Wirkungsketten-Explorer als eigenes WachSam-Konzept
  - Follow/Watchlist lokal/anonym als Inspiration
- Bewusst vermeiden:
  - DEFCON/Alarmismus
  - rote Blinker/Fake-Live
  - Drag-Resize-Terminal

Empfehlung: als Referenzanalyse commitbar, wenn klar bleibt, dass nur abstrakte Inspiration genutzt wird.

### `wm-home.jpeg`

Status: lokale Referenzdatei, 136 KB, JPEG 1381×585.

Vision-Analyse war nicht möglich, weil das konfigurierte Gemini-Visionmodell unter Codex/ChatGPT-Account nicht unterstützt wird. Aus Kontext/Dateiname und Worldmonitor-Report ist es sehr wahrscheinlich ein Screenshot der Worldmonitor-Home/UI.

Empfehlung: eher nicht committen. Gründe: Fremd-UI/Screenshot, AGPL-/Trademark-Kontext, wenig dauerhafter Nutzen gegenüber der Markdown-Analyse. Besser lokal lassen oder löschen, wenn der Report ausreicht.

## Priorisierte nächste Umsetzung

### P0.1 — Mobile Overflow fixen

- Ziel: mobile App wirkt sauber und nicht seitlich gebrochen.
- Verify: Playwright 390×844, `overflowX === false` auf `/`, `/lagebild`, `/kosten`, `/kaskaden`, `/massnahmen`, `/quellen`.

### P0.2 — Erklärbarkeit direkt an Karten bringen

- Ziel: `Wie entsteht dieser Wert?`, Quellenzahl, Confidence, Stand-Datum direkt am Wert.
- Scope: Frontend-only, keine DB, vorhandene Felder nutzen.

### P0.3 — `Mein Bereich` als echte App-Oberfläche

- Ziel: nach Login nicht nur Profilformular, sondern persönlicher Lage-/Maßnahmen-Hub.
- Scope: vorhandene Profilfelder nutzen; keine neuen Userdaten ohne Freigabe.

### P1 — Source-Härtung und Source-Gap-Plan

- Ziel: Dateninput verbreitern und aktuelle Adapterlücken priorisieren.
- Start mit PR D aus Produktblock-Audit.

## Empfehlung für Repo-Hygiene

- `docs/agent-skill-matrix.md` ist bereits committed (`512ab5f`).
- Diese Audit-Datei kann als nächstes tracked werden.
- Die zwei untracked Reports vom 2026-06-05 sollten nach kurzer Sensibilitätsprüfung ebenfalls committed werden.
- `wm-home.jpeg` sollte lokal bleiben oder entfernt werden, nicht committen.
