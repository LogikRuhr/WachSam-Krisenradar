# Editorial-Gate — WachSam v0.3

> Wie Inhalte von der Ingestion bis zur öffentlichen Sichtbarkeit fließen. Keine automatische Veröffentlichung aus Crawler-Output.

## Status-Maschine

Jedes editorial-pflichtige Item (`facts`, `cascades`, `governance`, `indicators`, `cost_impacts`, `lagebild_items`, `supply_risks`, `citizen_actions`) trägt `editorial_status`:

```
draft ──approve──▶ approved ──publish──▶ published
  ▲                   │                      │
  │                   └──reject──▶ rejected  │
  └──────────────── unpublish ◀──────────────┘
```

Erlaubte Übergänge (`v02/web/lib/admin/editorial.ts`, Funktion `transition`):

| Aktion | Von | Nach |
|---|---|---|
| approve | `draft` | `approved` |
| reject | `draft`, `approved` | `rejected` |
| publish | `approved` | `published` |
| unpublish | `published` | `draft` |

**`publish` ist nur aus `approved` möglich** — ein Draft kann nicht direkt veröffentlicht werden. Das erzwingt das Vier-Augen-Prinzip Draft → Approve → Publish.

## Autorisierung

Jede Mutation (`createDraft`, `updateDraft`, `transition`) ruft zuerst `requireEditorRole()` (`v02/web/lib/admin/permissions.ts`):

1. Aktive Session erforderlich (`auth()`), sonst `NotAuthorizedError`.
2. Rolle wird frisch aus der DB gelesen (`users.role`), nicht aus dem Edge-Token.
3. Nur `editor` oder `admin` dürfen mutieren.

Die Server Actions in `v02/web/app/admin/actions.ts` delegieren ausschließlich an diese geprüften Funktionen.

## Audit-Spur

Jede Aktion schreibt einen Eintrag ins `editorial_audit_log` (`logAuditEvent`): `itemType`, `itemId`, `action`, `actorId`, `fromStatus`, `toStatus`, optional `reason`. Einsehbar unter `/admin/audit`.

## Öffentliche Sichtbarkeit

`v02/web/lib/public-data.ts` filtert **jede** öffentliche Query auf `editorialStatus = "published"`. Quellen (`item_sources`) tragen selbst keinen Status; `keepPublishedSources()` filtert sie gegen den `editorial_status` des Parent-Items, damit Quellen unveröffentlichter Drafts nicht über `/quellen` oder Detailrouten leaken.

## Ingestion → Gate

Die Python-Pipeline (`v02/intelligence/`) schreibt neue Items als **Draft** (`insert_draft`). Es gibt keinen Pfad, der Crawler- oder Adapter-Output automatisch veröffentlicht. Live-Werte für Indikatoren werden über `editorial_action = ingest_value` getrackt, ändern aber nicht den Veröffentlichungsstatus.

## Operator-CLI

Das Admin-UI ist optional. Der kontrollierte Review-Pfad fuer Betreiber laeuft auch ohne Login:

```bash
cd v02
pnpm editorial:queue -- --limit 20
pnpm editorial:report -- --out outputs/editorial-review.md
pnpm editorial:approve lagebildItems <id>
pnpm editorial:publish lagebildItems <id>
pnpm editorial:reject lagebildItems <id> --reason "Quelle unklar"
```

Die CLI nutzt dieselbe Statusmaschine: `publish` ist nur aus `approved` erlaubt. Mutationen schreiben `editorial_audit_log`; `actor_id` bleibt bewusst leer, `editorial_reviewed_by` wird als `ops-cli` gesetzt.
