import type { NextAuthConfig } from "next-auth";

function hasSessionCookie(request: { cookies: { has(name: string): boolean } }) {
  return (
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token")
  );
}

export default {
  providers: [],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const sessionCookiePresent = hasSessionCookie(request);
      if (path.startsWith("/profil")) {
        return !!auth?.user || sessionCookiePresent;
      }

      if (path.startsWith("/admin") || path.startsWith("/review")) {
        const role = (auth?.user as { role?: string } | undefined)?.role;
        if (role === "editor" || role === "admin") return true;
        return sessionCookiePresent;
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
