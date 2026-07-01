import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

export type OperatorRole = "viewer" | "editor" | "admin";

export type OperatorRoleCommand = {
  email: string;
  role: OperatorRole;
  confirm: boolean;
};

type RoleRow = {
  id: string;
  role: OperatorRole;
};

const ROLES = new Set<OperatorRole>(["viewer", "editor", "admin"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const first = local[0] ?? "*";
  return `${first}***@${domain || "redacted"}`;
}

export function parseOperatorRoleCommand(argv: string[]): OperatorRoleCommand {
  const email = valueAfter(argv, "--email")?.trim().toLowerCase();
  const roleValue = valueAfter(argv, "--role")?.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    throw new Error("--email muss eine gültige E-Mail-Adresse sein.");
  }
  if (!roleValue || !ROLES.has(roleValue as OperatorRole)) {
    throw new Error("--role muss viewer, editor oder admin sein.");
  }

  return {
    email,
    role: roleValue as OperatorRole,
    confirm: argv.includes("--confirm"),
  };
}

export function buildRoleChangeSummary(input: {
  email: string;
  currentRole: OperatorRole;
  nextRole: OperatorRole;
  confirmed: boolean;
}): string {
  const prefix = input.confirmed ? "UPDATED" : "[DRY-RUN]";
  return `${prefix} ${maskEmail(input.email)}: ${input.currentRole} -> ${input.nextRole}`;
}

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt.");
  return url;
}

export async function setOperatorRole(command: OperatorRoleCommand): Promise<string> {
  const sql = postgres(databaseUrl(), { max: 1 });
  try {
    const rows = await sql<RoleRow[]>`
      select id, role::text as role
      from users
      where lower(email) = ${command.email}
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error(`Auth-User nicht gefunden: ${maskEmail(command.email)}`);

    if (command.confirm) {
      await sql`
        update users
        set role = ${command.role},
            updated_at = now()
        where id = ${row.id}
      `;
    }

    return buildRoleChangeSummary({
      email: command.email,
      currentRole: row.role,
      nextRole: command.role,
      confirmed: command.confirm,
    });
  } finally {
    await sql.end();
  }
}

export function helpText(): string {
  return [
    "WachSam Operator Role CLI",
    "",
    "Usage:",
    "  pnpm operator:role -- --email name@example.de --role editor",
    "  pnpm operator:role -- --email name@example.de --role admin --confirm",
    "",
    "Ohne --confirm wird nur geprüft und nichts geändert.",
  ].join("\n");
}

export async function runCli(argv: string[]): Promise<number> {
  try {
    if (argv.includes("--help") || argv.includes("-h")) {
      console.log(helpText());
      return 0;
    }
    const command = parseOperatorRoleCommand(argv);
    const summary = await setOperatorRole(command);
    console.log(summary);
    if (!command.confirm) {
      console.log("Keine Änderung geschrieben. Für Mutation --confirm ergänzen.");
    }
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
