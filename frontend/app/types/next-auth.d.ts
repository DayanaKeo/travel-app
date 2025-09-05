import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: "USER" | "ADMIN";
      premium: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role?: "admin" | "user";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: number;
    role: "USER" | "ADMIN";
    premium: boolean;
  }
}
