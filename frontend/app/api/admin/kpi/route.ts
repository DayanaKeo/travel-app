import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMongo } from "@/lib/mongo";
import { ensureMongoCollectionsAndIndexes } from "@/lib/mongo-init";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.uid || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await ensureMongoCollectionsAndIndexes(); // idempotent
  const db = await getMongo();

  const [users, voyages, medias] = await Promise.all([
    prisma.user.count(),
    prisma.voyage.count(),
    prisma.media.count(),
  ]);

  const lastSignup = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const auditCount24h = await db.collection("audit_logs").countDocuments({
    at: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
  });

  return NextResponse.json({
    users,
    voyages,
    medias,
    lastSignupAt: lastSignup?.createdAt ?? null,
    auditCount24h,
  });
}
