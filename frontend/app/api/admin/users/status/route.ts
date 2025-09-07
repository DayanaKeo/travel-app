import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMongo } from "@/lib/mongo";

export const runtime = "nodejs";

function daysAgoUTC(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export async function GET(req: NextRequest) {
  // Sécurité (le middleware protège déjà /api/admin/*, on double-vérifie)
  const role = (req.headers.get("x-user-role") || "").toUpperCase();
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  // 1) Totaux SQL
  const total = await prisma.user.count();

  const db = await getMongo();
  const cutoff = daysAgoUTC(30);
  const activeIdsRaw = await db
    .collection("usage_events")
    .distinct("user_id", { at: { $gte: cutoff }, user_id: { $ne: null } });

  // Filtre: ne garde que des ID numériques valides
  const activeIds = (activeIdsRaw as any[]).filter(
    (v) => typeof v === "number" && Number.isFinite(v) && v > 0
  );
  const active30d = activeIds.length;

  let suspended = 0;
  try {
    suspended = await prisma.user.count({ where: { status: "SUSPENDED" } });
  } catch {}
  if (suspended === 0) {
    try {
      // @ts-expect-error
      suspended = await prisma.user.count({ where: { isSuspended: true } });
    } catch {}
  }
  if (suspended === 0) {
    try {
      // @ts-expect-error
      suspended = await prisma.user.count({ where: { suspended: true } });
    } catch {}
  }

  let inactive30d = total - active30d - suspended;
  if (inactive30d < 0) inactive30d = 0;

  return NextResponse.json({
    total,
    windowDays: 30,
    cutoffISO: cutoff.toISOString(),
    active30d,
    inactive30d,
    suspended,
  });
}
