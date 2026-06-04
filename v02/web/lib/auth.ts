import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import authConfig from "../auth.config";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "@wachsam/db/schema";

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
  callbacks: {
    ...authConfig.callbacks,
    session({ session, user }) {
      const sessionUser = session.user as typeof session.user & { id?: string; role?: string };
      sessionUser.id = user.id;
      sessionUser.role = (user as typeof user & { role?: string }).role;
      return session;
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
