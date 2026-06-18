import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { parseFeedbackInput } from "@/lib/feedback";
import { createRateLimiter } from "@/lib/rate-limit";
import { isSameOrigin, resolveExpectedHost } from "@/lib/same-origin";

export const runtime = "nodejs";

// Basis-Spam-Schutz: max. 5 Einsendungen pro Minute je Quell-IP (pro Prozess).
const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });

export async function POST(request: Request) {
  // Same-Origin-Guard. Hinter Traefik trägt request.url den INTERNEN Host —
  // der erwartete (öffentliche) Host kommt aus dem vom Proxy gesetzten
  // x-forwarded-host bzw. host-Header, sonst scheitert ein legitimer Browser-POST.
  const expectedHost = resolveExpectedHost({
    forwardedHost: request.headers.get("x-forwarded-host"),
    host: request.headers.get("host"),
    fallbackUrl: request.url,
  });
  if (!isSameOrigin(request.headers.get("origin"), expectedHost)) {
    return NextResponse.json({ ok: false, error: "Ungültige Herkunft." }, { status: 403 });
  }

  // Hinter dem eigenen Reverse-Proxy ist x-real-ip bzw. der RECHTESTE (vom Proxy
  // gesetzte) x-forwarded-for-Eintrag vertrauenswürdiger als der linkeste, den der
  // Client frei setzen kann — sonst ließe sich das Rate-Limit per fake-IP umgehen.
  const forwarded = request.headers.get("x-forwarded-for");
  const rightmostForwarded = forwarded?.split(",").map((part) => part.trim()).filter(Boolean).at(-1);
  const ip = request.headers.get("x-real-ip")?.trim() || rightmostForwarded || "unknown";
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
