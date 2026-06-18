import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { parseFeedbackInput } from "@/lib/feedback";
import { createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Basis-Spam-Schutz: max. 5 Einsendungen pro Minute je Quell-IP (pro Prozess).
const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });

/** Same-Origin-Guard (leichtgewichtiger CSRF-Schutz). POSTs aus unserem Client
 *  senden einen Origin-Header; fehlt er, wird nicht blockiert. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Ungültige Herkunft." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!limiter.check(ip).allowed) {
    return NextResponse.json(
      { ok: false, error: "Zu viele Anfragen. Bitte versuche es später erneut." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = parseFeedbackInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Feedback kann derzeit nicht gespeichert werden." },
      { status: 503 },
    );
  }

  // Eingeloggte Nutzer werden zugeordnet; Gäste bleiben anonym (userId null).
  const session = await auth();
  const userId = session?.user?.id ?? null;

  await db.insert(schema.feedback).values({
    id: randomUUID(),
    userId,
    category: parsed.data.category,
    message: parsed.data.message,
    pagePath: parsed.data.pagePath ?? null,
    rating: parsed.data.rating ?? null,
    contactEmail: parsed.data.contactEmail ?? null,
  });

  return NextResponse.json({ ok: true });
}
