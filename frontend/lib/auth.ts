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
      credentials: { email: { label: "Email", type: "text" }, password: { label: "Mot de passe", type: "password" } },
      async authorize(c) {
        if (!c?.email || !c.password) return null;
        const email = c.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, role: true, premium: true, passwordHash: true },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(c.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, role: user.role, premium: user.premium } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
        token.premium = (user as any).premium;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.uid && session.user) {
        session.user.id = token.uid as number;
        session.user.role = token.role as any;
        session.user.premium = token.premium as boolean;
      }
      return session;
    },
  },
};
