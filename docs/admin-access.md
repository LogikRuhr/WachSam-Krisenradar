# Admin-Zugang & mobile Freigabe

Wie der Betreiber ins CMS kommt und Inhalte (inkl. Gesamtstand Deutschland) freigibt —
insbesondere **unterwegs vom Handy**. Ergänzt den Workflow in [`editorial-gate.md`](./editorial-gate.md).

## Rollen
`users.role` kennt drei Stufen: `viewer` (Default bei erster Anmeldung) · `editor` · `admin`.
`/admin` und `/review` verlangen `editor` **oder** `admin` (`v02/web/lib/admin/permissions.ts`).

## Admin werden (empfohlen: Allowlist)
Kein DB-Zugriff nötig. Auf dem VPS im Web-Service `ADMIN_EMAILS` setzen (kommagetrennt), dann
einmal per Magic-Link einloggen — die Rolle wird beim Login automatisch auf `admin` gehoben
(`v02/web/lib/auth.ts`, `events.signIn`). Greift auch für bereits bestehende `viewer`-Accounts.

```
# /opt/wachsam/.env  (oder docker-compose.v02.yml env)
ADMIN_EMAILS=deine-login@example.de
```
Danach Web neu bauen: `gh workflow run deploy.yml --ref main`. Beim ersten Login nach dem Deploy
ggf. **einmal neu laden**, dann greift die Admin-Rolle.

**Fallback ohne Allowlist** (einmalig, DB-Write): erst per Magic-Link einloggen (legt `users`-Zeile
an), dann `cd v02 && pnpm operator:role -- --email deine-login@example.de --role admin --confirm`.

## Keine Mail? Resend-Absender / Domain
Resend sendet **nur von einer verifizierten Domain**. Zeigt Resend „Domain not verified:
Verify ruhrlogik.de or update your from domain", gibt es zwei Wege:
- **Schnell, ohne DNS (Solo-Betrieb):** `AUTH_EMAIL_FROM=onboarding@resend.dev` setzen (Resends
  Test-Absender). Sendet **nur an die E-Mail deines Resend-Kontos** → mit genau dieser Adresse
  einloggen (und sie in `ADMIN_EMAILS` eintragen). Kein DNS nötig.
- **Sauber (Produktion):** Domain in Resend verifizieren — die von Resend gezeigten DNS-Records
  (SPF-TXT, DKIM, MX) beim DNS-Anbieter von `ruhrlogik.de` (IONOS) eintragen, dann in Resend
  „Verify". Nötig, sobald andere Adressen Mails bekommen sollen.

## Login klappt nicht? („Link konnte nicht geprüft werden")
Der Magic-Link ist ein **strikter Einmal-Token**. Der Mail-Link führt nicht direkt auf den
Callback, sondern auf `/login/confirm` — eine Zwischenseite, die den Token nur anzeigt, aber noch
nicht einlöst. Erst der Klick auf **„Anmeldung bestätigen"** ruft den eigentlichen Callback auf und
verbraucht den Token. Scanner-/Tracking-Prefetches der Mail (Virenscanner, Vorschau, Resend
Click-/Open-Tracking) laden dadurch zwar `/login/confirm` vorab, lösen den Callback aber nicht aus
— der Token bleibt bis zum echten Klick gültig.
- **Resend „Click Tracking" + „Open Tracking" deaktivieren** (Dashboard → Domain) bleibt trotzdem
  empfohlen, um unnötige Prefetches zu vermeiden — für den Login selbst ist es aber nicht mehr
  zwingend nötig.
- `AUTH_URL=https://wachsam.ruhrlogik.de` auf dem VPS gesetzt? (Basis des Links in der Mail.)
- Sessions halten ~30 Tage (DB-Strategie) → **einmal** einloggen reicht, kein Login pro Besuch.
- Kommt „Link konnte nicht geprüft werden" trotzdem: Der Link ist älter als 10 Minuten oder wurde
  bereits per Button bestätigt — neue Mail anfordern.

## Mobil freigeben
1. `wachsam.ruhrlogik.de/review` öffnen (mobile Freigabe-Queue).
2. Offene Einträge als Karten → **Freigeben** (`approved`) → **Publizieren** (`published`).
   Nur `published` ist öffentlich sichtbar.
3. **Gesamtstand Deutschland** (`/lage`): den `nationalState`-Eintrag publizieren → die Hinweis-
   karte „redaktionelle Gesamteinschätzung steht noch aus" verschwindet, die Einordnung erscheint.

**CLI-Alternative** (Desktop, ohne UI): `pnpm editorial:approve nationalState <id>` →
`pnpm editorial:publish nationalState <id>`.
