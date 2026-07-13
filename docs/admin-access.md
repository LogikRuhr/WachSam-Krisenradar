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

## Login klappt nicht? („Link konnte nicht geprüft werden")
Der Magic-Link ist ein **Einmal-Token**. Wird er vor dem Klick abgerufen, gilt er als „benutzt".
- **Resend „Click Tracking" + „Open Tracking" deaktivieren** (Dashboard → Domain). Tracking
  schreibt den Link auf einen Redirect um und verbrennt den Token. Häufigste Ursache.
- `AUTH_URL=https://wachsam.ruhrlogik.de` auf dem VPS gesetzt? (Basis des Links in der Mail.)
- Sessions halten ~30 Tage (DB-Strategie) → **einmal** einloggen reicht, kein Login pro Besuch.

## Mobil freigeben
1. `wachsam.ruhrlogik.de/review` öffnen (mobile Freigabe-Queue).
2. Offene Einträge als Karten → **Freigeben** (`approved`) → **Publizieren** (`published`).
   Nur `published` ist öffentlich sichtbar.
3. **Gesamtstand Deutschland** (`/lage`): den `nationalState`-Eintrag publizieren → die Hinweis-
   karte „redaktionelle Gesamteinschätzung steht noch aus" verschwindet, die Einordnung erscheint.

**CLI-Alternative** (Desktop, ohne UI): `pnpm editorial:approve nationalState <id>` →
`pnpm editorial:publish nationalState <id>`.
