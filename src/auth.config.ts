import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe config (no Prisma, no bcrypt) shared by middleware and the
 * full Node config in `auth.ts`. RBAC lives in the `authorized` callback so
 * it runs before any /admin route renders.
 */
export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      if (nextUrl.pathname.startsWith("/admin")) return role === "ADMIN";
      if (nextUrl.pathname.startsWith("/account")) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? "USER";
        token.id = user.id!;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
