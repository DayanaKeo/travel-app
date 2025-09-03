import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email?: string | null;
      role?: "USER" | "ADMIN";
      premium?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    email: string;
    role: "USER" | "ADMIN";
    premium: boolean;
    passwordHash?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: number;
    role?: "USER" | "ADMIN";
    premium?: boolean;
  }
}
