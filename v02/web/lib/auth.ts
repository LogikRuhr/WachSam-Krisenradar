import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import { and, eq, ne } from "drizzle-orm";
import authConfig from "../auth.config";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "@wachsam/db/schema";
import { isAllowlistedAdmin } from "./admin/admin-allowlist";
import { buildConfirmUrl } from "./auth-confirm";

const adapter = db
  ? DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  : undefined;

/** Minimal HTML/text template for the "confirm sign-in" mail (deutsche Copy). */
function confirmEmailHtml(url: string) {
  return `
<body style="background:#f9f9f9;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background:#fff; max-width:600px; margin:auto; border-radius:10px;">
    <tr>
      <td align="center"
        style="padding:10px 0; font-size:22px; font-family:Helvetica,Arial,sans-serif; color:#444;">
        WachSam · Anmeldung bestätigen
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding:0 24px 20px; font-size:15px; line-height:22px; font-family:Helvetica,Arial,sans-serif; color:#444;">
        Bitte bestätige deine Anmeldung. Der Link gilt 10 Minuten und kann nur einmal verwendet werden.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 0 20px;">
        <a href="${url}" target="_blank"
          style="font-size:16px; font-family:Helvetica,Arial,sans-serif; color:#fff; text-decoration:none; border-radius:5px; padding:12px 24px; background:#D4540A; display:inline-block; font-weight:bold;">
          Anmeldung bestätigen
        </a>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding:0 24px 10px; font-size:13px; line-height:20px; font-family:Helvetica,Arial,sans-serif; color:#777;">
        Wenn du diese Anmeldung nicht ausgelöst hast, kannst du diese Mail ignorieren.
      </td>
    </tr>
  </table>
</body>`;
}

function confirmEmailText(url: string) {
  return `WachSam · Anmeldung bestätigen\n\n${url}\n\nDer Link gilt 10 Minuten und kann nur einmal verwendet werden.\n`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "wachsam@ruhrlogik.de",
      apiKey: process.env.RESEND_API_KEY,
      // Bounds how long the confirmation link stays valid end-to-end.
      // Matches the "gilt 10 Minuten" copy on /login/verify.
      maxAge: 60 * 10,
      // Der Mail-Link führt auf /login/confirm, nicht direkt auf den Callback.
      // Der Token wird erst konsumiert, wenn dort der Bestätigen-Button geklickt
      // wird (Einmal-Token, strikt) — Scanner-/Tracking-Prefetches der Mail
      // verbrennen ihn dadurch nicht mehr.
      async sendVerificationRequest({ identifier: to, provider, url }) {
        const confirmUrl = buildConfirmUrl(url);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: "WachSam · Anmeldung bestätigen",
            html: confirmEmailHtml(confirmUrl),
            text: confirmEmailText(confirmUrl),
          }),
        });
        if (!res.ok) {
          throw new Error(`Resend error (${res.status}): ${JSON.stringify(await res.json())}`);
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    session({ session, user }) {
      const sessionUser = session.user as typeof session.user & { id?: string; role?: string };
      sessionUser.id = user.id;
      sessionUser.role = (user as typeof user & { role?: string }).role;
      return session;
    },
  },
  events: {
    /**
     * Promote allowlisted operators to admin on sign-in. Lets the betreiber gain
     * CMS access by logging in with an ADMIN_EMAILS address — no manual DB write,
     * no CLI. Idempotent: only writes when the role is not already admin, and
     * covers both freshly created and existing (viewer) accounts. The session
     * callback reads role fresh from the DB, so it takes effect on the next
     * request after login (a single reload if promoted during the same login).
     */
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!db || !email || !isAllowlistedAdmin(email, process.env.ADMIN_EMAILS)) return;
      await db
        .update(users)
        .set({ role: "admin" })
        .where(and(eq(users.email, email), ne(users.role, "admin")));
    },
  },
  session: { strategy: "database" },
});

export function isAuthRuntimeConfigured() {
  return Boolean(process.env.DATABASE_URL && (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET));
}

export function assertAuthRuntimeReady() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ist für Auth-Runtime erforderlich.");
  }
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY ist für Magic-Link-Versand erforderlich.");
  }
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    throw new Error("AUTH_SECRET ist für die Session-Verschlüsselung erforderlich.");
  }
}
