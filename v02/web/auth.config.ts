import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

export default {
  providers: [
    Resend({
      from: process.env.AUTH_EMAIL_FROM ?? "wachsam@ruhrlogik.de",
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/profil")) {
        const hasSessionCookie =
          request.cookies.has("authjs.session-token") ||
          request.cookies.has("__Secure-authjs.session-token") ||
          request.cookies.has("next-auth.session-token") ||
          request.cookies.has("__Secure-next-auth.session-token");

        return !!auth?.user || hasSessionCookie;
      }

      if (path.startsWith("/admin")) {
        const role = (auth?.user as { role?: string } | undefined)?.role;
        return role === "editor" || role === "admin";
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
