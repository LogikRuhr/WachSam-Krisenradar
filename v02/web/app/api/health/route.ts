import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Leichtgewichtiger Health-Check für externes Uptime-Monitoring (z. B. UptimeRobot).
 * Prüft die DB-Erreichbarkeit per `select 1`. Gibt bewusst KEINE Details/Secrets
 * preis — nur einen groben Status. 200 = ok, 503 = degraded.
 */
export async function GET() {
  let dbState: "ok" | "error" | "unconfigured" = "unconfigured";
  if (db) {
    try {
      await db.execute(sql`select 1`);
      dbState = "ok";
    } catch {
      dbState = "error";
    }
  }

  const healthy = dbState === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", db: dbState, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
