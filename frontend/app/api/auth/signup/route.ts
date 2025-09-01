import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { SignupSchema } from "@/lib/validation/auth";

const buckets = new Map<string, { count: number; ts: number }>();
function rateLimit(ip: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip) ?? { count: 0, ts: now };
  if (now - b.ts > windowMs) { b.count = 0; b.ts = now; }
  b.count++; buckets.set(ip, b);
  return b.count <= limit;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("ERREUR_INSCRIPTION_ZOD", parsed.error.issues);
      return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("ERREUR_INSCRIPTION", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export const runtime = "nodejs";
