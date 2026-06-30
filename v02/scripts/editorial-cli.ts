import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

export type EditorialStatus = "draft" | "approved" | "rejected" | "published";
export type EditorialAction = "approve" | "reject" | "publish";

export type EditorialItemType =
  | "facts"
  | "cascades"
  | "governance"
  | "indicators"
  | "costImpacts"
  | "lagebildItems"
  | "supplyRisks"
  | "citizenActions"
  | "nationalState";

type ItemTypeMeta = {
  type: EditorialItemType;
  table: string;
  label: string;
  titleColumn: string;
  auditType: string;
};

type DbQueueRow = {
  id: string;
  title: string | null;
  status: EditorialStatus;
  editorial_reviewed_at: Date | null;
  published_at: Date | null;
  created_at: Date | null;
};

export type QueueItem = {
  type: EditorialItemType;
  label: string;
  id: string;
  title: string;
  status: EditorialStatus;
  queuedAt: Date | null;
};

export type ParsedCommand =
  | { command: "queue"; limit: number; json: boolean }
  | { command: "report"; limit: number; out: string; stdout: boolean }
  | { command: EditorialAction; itemType: EditorialItemType; id: string; reason?: string; dryRun: boolean }
  | { command: "help" };

const DEFAULT_LIMIT = 20;
const OPS_ACTOR = "ops-cli";

export const ITEM_TYPES: Record<EditorialItemType, ItemTypeMeta> = {
  facts: { type: "facts", table: "facts", label: "Fakten", titleColumn: "value_label", auditType: "fact" },
  cascades: { type: "cascades", table: "cascades", label: "Kaskaden", titleColumn: "title", auditType: "cascade" },
  governance: { type: "governance", table: "governance", label: "Governance", titleColumn: "title", auditType: "governance" },
  indicators: { type: "indicators", table: "indicators", label: "Indikatoren", titleColumn: "label", auditType: "indicator" },
  costImpacts: { type: "costImpacts", table: "cost_impacts", label: "Kostenwirkungen", titleColumn: "titel", auditType: "cost_impact" },
  lagebildItems: { type: "lagebildItems", table: "lagebild_items", label: "Lagebild", titleColumn: "titel", auditType: "lagebild_item" },
  supplyRisks: { type: "supplyRisks", table: "supply_risks", label: "Versorgung", titleColumn: "titel", auditType: "supply_risk" },
  citizenActions: { type: "citizenActions", table: "citizen_actions", label: "Maßnahmen", titleColumn: "titel", auditType: "citizen_action" },
  nationalState: { type: "nationalState", table: "national_state", label: "Gesamtstand", titleColumn: "executive_summary", auditType: "national_state" },
};

const TYPE_ALIASES: Record<string, EditorialItemType> = {
  fact: "facts",
  facts: "facts",
  cascade: "cascades",
  cascades: "cascades",
  governance: "governance",
  indicator: "indicators",
  indicators: "indicators",
  cost: "costImpacts",
  cost_impacts: "costImpacts",
  costImpacts: "costImpacts",
  lagebild: "lagebildItems",
  lagebild_items: "lagebildItems",
  lagebildItems: "lagebildItems",
  supply: "supplyRisks",
  supply_risks: "supplyRisks",
  supplyRisks: "supplyRisks",
  action: "citizenActions",
  citizen_actions: "citizenActions",
  citizenActions: "citizenActions",
  national_state: "nationalState",
  nationalState: "nationalState",
};

const TRANSITIONS: Record<EditorialAction, { from: EditorialStatus[]; to: EditorialStatus }> = {
  approve: { from: ["draft"], to: "approved" },
  publish: { from: ["approved"], to: "published" },
  reject: { from: ["draft", "approved"], to: "rejected" },
};

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function parseLimit(args: string[]): number {
  const raw = valueAfter(args, "--limit");
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 500) {
    throw new Error("--limit muss eine Zahl zwischen 1 und 500 sein.");
  }
  return parsed;
}

export function parseItemType(value: string | undefined): EditorialItemType {
  const itemType = value ? TYPE_ALIASES[value] : undefined;
  if (!itemType) {
    throw new Error(`Unbekannter Typ '${value ?? ""}'. Erlaubt: ${Object.keys(ITEM_TYPES).join(", ")}`);
  }
  return itemType;
}

export function parseCommand(argv: string[]): ParsedCommand {
  const [command = "help", maybeType, maybeId] = argv;
  if (command === "help" || command === "--help" || command === "-h") return { command: "help" };
  if (command === "queue") return { command, limit: parseLimit(argv), json: hasFlag(argv, "--json") };
  if (command === "report") {
    return {
      command,
      limit: parseLimit(argv),
      out: valueAfter(argv, "--out") ?? defaultReportPath(new Date()),
      stdout: hasFlag(argv, "--stdout"),
    };
  }
  if (command === "approve" || command === "publish" || command === "reject") {
    const itemType = parseItemType(maybeType);
    if (!maybeId) throw new Error(`${command} braucht eine Item-ID.`);
    const reason = valueAfter(argv, "--reason");
    if (command === "reject" && (!reason || reason.trim().length < 3)) {
      throw new Error("reject braucht --reason mit mindestens 3 Zeichen.");
    }
    return { command, itemType, id: maybeId, reason: reason?.trim(), dryRun: hasFlag(argv, "--dry-run") };
  }
  throw new Error(`Unbekannter Befehl '${command}'.`);
}

export function allowedTransition(action: EditorialAction, from: EditorialStatus): EditorialStatus {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(from)) {
    throw new Error(`Transition '${action}' nur aus ${transition.from.join(" | ")} erlaubt (aktuell: ${from}).`);
  }
  return transition.to;
}

export function sanitizeOutput(value: string): string {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]").replace(/\s+/g, " ").trim();
}

export function defaultReportPath(now: Date): string {
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  return join("outputs", `editorial-review-${stamp}.md`);
}

function formatDate(value: Date | null): string {
  return value ? value.toISOString() : "unbekannt";
}

function sortQueueItems(items: QueueItem[]): QueueItem[] {
  const statusRank: Record<EditorialStatus, number> = { draft: 0, approved: 1, rejected: 2, published: 3 };
  return [...items].sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      (b.queuedAt?.getTime() ?? 0) - (a.queuedAt?.getTime() ?? 0) ||
      a.type.localeCompare(b.type) ||
      a.id.localeCompare(b.id),
  );
}

export function formatQueue(items: QueueItem[]): string {
  if (items.length === 0) return "Keine offenen Editorial-Items.";
  return sortQueueItems(items)
    .map((item, index) => {
      const next = item.status === "draft" ? "approve" : "publish";
      return `${index + 1}. [${item.status}] ${item.type}/${item.id} · ${item.label} · ${formatDate(item.queuedAt)}\n   ${sanitizeOutput(item.title)}\n   next: editorial:${next} ${item.type} ${item.id}`;
    })
    .join("\n");
}

export function formatReport(items: QueueItem[], now = new Date()): string {
  const sorted = sortQueueItems(items);
  const draftCount = sorted.filter((item) => item.status === "draft").length;
  const approvedCount = sorted.filter((item) => item.status === "approved").length;
  const lines = [
    "# WachSam Editorial Review",
    "",
    `Stand: ${now.toISOString()}`,
    "",
    "## Summary",
    "",
    `- Drafts: ${draftCount}`,
    `- Freigegeben, noch nicht publiziert: ${approvedCount}`,
    `- Gesamt in Queue: ${sorted.length}`,
    "",
    "## Queue",
    "",
  ];

  if (sorted.length === 0) {
    lines.push("Keine offenen Editorial-Items.");
    return `${lines.join("\n")}\n`;
  }

  for (const [index, item] of sorted.entries()) {
    const next = item.status === "draft" ? "approve" : "publish";
    lines.push(
      `### ${index + 1}. ${sanitizeOutput(item.title)}`,
      "",
      `- Status: \`${item.status}\``,
      `- Typ: \`${item.type}\` (${item.label})`,
      `- ID: \`${item.id}\``,
      `- Eingang/Review: ${formatDate(item.queuedAt)}`,
      `- Naechster Befehl: \`pnpm editorial:${next} ${item.type} ${item.id}\``,
      "",
    );
  }
  return `${lines.join("\n")}\n`;
}

function dbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt.");
  return url;
}

async function withSql<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(dbUrl(), { max: 1 });
  try {
    return await fn(sql);
  } finally {
    await sql.end();
  }
}

export async function fetchQueue(limit: number): Promise<QueueItem[]> {
  return withSql(async (sql) => {
    const items: QueueItem[] = [];
    for (const meta of Object.values(ITEM_TYPES)) {
      const rows = await sql<DbQueueRow[]>`
        select
          id,
          ${sql.unsafe(meta.titleColumn)}::text as title,
          editorial_status::text as status,
          editorial_reviewed_at,
          published_at,
          created_at
        from ${sql.unsafe(meta.table)}
        where editorial_status in ('draft', 'approved')
        order by
          case editorial_status when 'draft' then 0 when 'approved' then 1 else 2 end,
          coalesce(editorial_reviewed_at, published_at, created_at) desc,
          id asc
        limit ${limit}
      `;
      for (const row of rows) {
        items.push({
          type: meta.type,
          label: meta.label,
          id: row.id,
          title: row.title ?? row.id,
          status: row.status,
          queuedAt: row.editorial_reviewed_at ?? row.published_at ?? row.created_at,
        });
      }
    }
    return sortQueueItems(items).slice(0, limit);
  });
}

async function runTransition(
  action: EditorialAction,
  itemType: EditorialItemType,
  id: string,
  options: { reason?: string; dryRun?: boolean } = {},
): Promise<string> {
  const meta = ITEM_TYPES[itemType];
  return withSql(async (sql) => {
    const rows = await sql<{ editorial_status: EditorialStatus }[]>`
      select editorial_status::text as editorial_status
      from ${sql.unsafe(meta.table)}
      where id = ${id}
      limit 1
    `;
    const current = rows[0]?.editorial_status;
    if (!current) throw new Error(`${itemType}/${id} nicht gefunden.`);
    const next = allowedTransition(action, current);
    if (options.dryRun) {
      return `[DRY-RUN] ${itemType}/${id}: ${current} -> ${next}`;
    }

    await sql.begin(async (tx) => {
      const patchPublished = action === "publish" ? tx`, published_at = now()` : tx``;
      await tx`
        update ${tx.unsafe(meta.table)}
        set editorial_status = ${next},
            editorial_reviewed_by = ${OPS_ACTOR},
            editorial_reviewed_at = now(),
            updated_at = now()
            ${patchPublished}
        where id = ${id}
      `;
      await tx`
        insert into editorial_audit_log
          (id, item_type, item_id, action, actor_id, from_status, to_status, reason, created_at)
        values
          (${randomUUID()}, ${meta.auditType}, ${id}, ${action}, null, ${current}, ${next}, ${options.reason ?? null}, now())
      `;
    });

    return `${itemType}/${id}: ${current} -> ${next}`;
  });
}

export async function approveItem(itemType: EditorialItemType, id: string, dryRun = false): Promise<string> {
  return runTransition("approve", itemType, id, { dryRun });
}

export async function publishItem(itemType: EditorialItemType, id: string, dryRun = false): Promise<string> {
  return runTransition("publish", itemType, id, { dryRun });
}

export async function rejectItem(itemType: EditorialItemType, id: string, reason: string, dryRun = false): Promise<string> {
  return runTransition("reject", itemType, id, { reason, dryRun });
}

export function helpText(): string {
  return [
    "WachSam Editorial CLI",
    "",
    "Commands:",
    "  pnpm editorial:queue -- --limit 20",
    "  pnpm editorial:report -- --out outputs/editorial-review.md",
    "  pnpm editorial:approve <type> <id> [--dry-run]",
    "  pnpm editorial:publish <type> <id> [--dry-run]",
    "  pnpm editorial:reject <type> <id> --reason \"...\" [--dry-run]",
    "",
    `Types: ${Object.keys(ITEM_TYPES).join(", ")}`,
  ].join("\n");
}

export async function runCli(argv: string[]): Promise<number> {
  try {
    const parsed = parseCommand(argv);
    if (parsed.command === "help") {
      console.log(helpText());
      return 0;
    }
    if (parsed.command === "queue") {
      const items = await fetchQueue(parsed.limit);
      console.log(parsed.json ? JSON.stringify(items, null, 2) : formatQueue(items));
      return 0;
    }
    if (parsed.command === "report") {
      const items = await fetchQueue(parsed.limit);
      const report = formatReport(items);
      if (parsed.stdout) {
        console.log(report);
      } else {
        await mkdir(dirname(parsed.out), { recursive: true });
        await writeFile(parsed.out, report, "utf8");
        console.log(`Editorial-Report geschrieben: ${parsed.out}`);
      }
      return 0;
    }
    const result =
      parsed.command === "approve"
        ? await approveItem(parsed.itemType, parsed.id, parsed.dryRun)
        : parsed.command === "publish"
          ? await publishItem(parsed.itemType, parsed.id, parsed.dryRun)
          : await rejectItem(parsed.itemType, parsed.id, parsed.reason ?? "", parsed.dryRun);
    console.log(result);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("");
    console.error(helpText());
    return 1;
  }
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
