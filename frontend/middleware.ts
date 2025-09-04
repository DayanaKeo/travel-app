import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_API = [
  "/api/auth",
  "/api/health",
  "/api/voyages/public",
  "/api/share-links/",
];

const ADMIN_PATHS = [/^\/admin($|\/)/, /^\/api\/admin($|\/)/];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.uid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  if (ADMIN_PATHS.some((re) => re.test(pathname))) {
    if (token.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-user-id", String(token.uid));
  res.headers.set("x-user-role", (token.role ?? "USER") as "USER" | "ADMIN");
  res.headers.set("x-user-premium", String(!!token.premium));
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
  ],
};

// protège l’espace admin frontend