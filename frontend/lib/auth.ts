import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: { signIn: "/auth/signin", error: "/auth/error" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(c) {
        if (!c?.email || !c.password) return null;
        const user = await prisma.user.findUnique({ where: { email: c.email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(c.password, user.passwordHash);
        return ok ? user : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.uid = (user as any).id; return token; },
    async session({ session, token }) { if (token?.uid) (session.user as any).id = token.uid; return session; },
  },
};
