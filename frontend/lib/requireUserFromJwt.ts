import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

type Roles = "user" | "admin";

export async function requireUserFromJwt(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || typeof (token as any).uid !== "number") {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: (token as any).uid as number,
    role: ((token as any).role as Roles | undefined) ?? "user",
    premium: Boolean((token as any).premium),
  };
}
