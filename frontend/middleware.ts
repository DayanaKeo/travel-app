import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_API = [
  "/api/auth",
  "/api/health",
  "/api/voyages/public",
  "/api/partage/",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api")) return NextResponse.next();

  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.uid) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const res = NextResponse.next();
  res.headers.set("x-user-id", String(token.uid));
  res.headers.set("x-user-role", (token.role ?? "USER") as "USER" | "ADMIN"); // "USER" | "ADMIN"
  res.headers.set("x-user-premium", String(!!token.premium));
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
