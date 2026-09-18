import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const {
  handlers: { GET, POST },
  auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    GitHub,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        // Compare against a dummy hash when the user is missing to keep timing flat.
        const hash = user?.passwordHash ?? "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5x1n2J8H1s7cQFv6cQf2i0bCq1q0x3K";
        const ok = await bcrypt.compare(parsed.data.password, hash);
        return user && ok ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
      },
    }),
  ],
});

/** Server-side guard for Server Actions / route handlers (defence in depth beyond middleware). */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}
