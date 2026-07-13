import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import { and, eq, ne } from "drizzle-orm";
import authConfig from "../auth.config";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "@wachsam/db/schema";
import { isAllowlistedAdmin } from "./admin/admin-allowlist";

const adapter = db
  ? DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    })
  : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "wachsam@ruhrlogik.de",
      apiKey: process.env.RESEND_API_KEY,
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
