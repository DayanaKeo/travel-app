import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMongo } from "@/lib/mongo";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const [users, voyages, medias] = await Promise.all([
      prisma.user.count(),
      prisma.voyage.count(),
      prisma.media.count(),
    ]);

    const lastSignup = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Mongo usage last 30d
    const db = await getMongo();
    const since = daysAgo(30);
    const usageLast30d = await db.collection("usage_events").aggregate([
      { $match: { at: { $gte: since } } },
      { $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$at" } }, type: "$type" },
          c: { $sum: 1 }
      }},
      { $group: {
          _id: "$_id.day",
          events: { $push: { type: "$_id.type", c: "$c" } },
          total: { $sum: "$c" }
      }},
      { $sort: { _id: 1 } }
    ]).toArray();

    // Top pays (approx via profil.localisation)
    const profils = await prisma.profilUser.findMany({
      where: { localisation: { not: null } },
      select: { localisation: true },
      take: 2000,
    });
    const countryMap = new Map<string, number>();
    for (const p of profils) {
      const loc = p.localisation ?? "";
      const parts = loc.split(",").map(s => s.trim());
      const country = parts[parts.length - 1] || "N/A";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    }
    const topCountries = Array.from(countryMap.entries())
      .sort((a,b)=>b[1]-a[1]).slice(0, 8)
      .map(([country, count]) => ({ country, count }));

    return NextResponse.json({
      users, voyages, medias,
      lastSignup: lastSignup?.createdAt ?? null,
      usageLast30d, topCountries,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erreur stats" }, { status: 500 });
  }
}
// Note : cette route est protégée par le middleware (admin only)