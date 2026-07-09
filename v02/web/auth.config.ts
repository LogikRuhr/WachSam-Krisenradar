import type { NextAuthConfig } from "next-auth";

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
      if (path.startsWith("/profil")) {
        return !!auth?.user;
      }

      if (path.startsWith("/admin") || path.startsWith("/review")) {
        const role = (auth?.user as { role?: string } | undefined)?.role;
        return role === "editor" || role === "admin";
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
