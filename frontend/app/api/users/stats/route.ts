import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = requireAuth(req.headers);

    const [voyages, etapes, photos, videos] = await Promise.all([
      prisma.voyage.count({ where: { userId } }),
      prisma.etape.count({ where: { voyage: { userId } } }),
      prisma.media.count({
        where: {
          OR: [
            { voyage: { userId } },
            { etape: { voyage: { userId } } },
          ],
          type: "image",
        },
      }),
      prisma.media.count({
        where: {
          OR: [
            { voyage: { userId } },
            { etape: { voyage: { userId } } },
          ],
          type: "video",
        },
      }),
    ]);

    // Pays approximatif à partir d'Etape.adresse
    const etapesAdr = await prisma.etape.findMany({
      where: { voyage: { userId } },
      select: { adresse: true },
    });
    const countrySet = new Set<string>();
    for (const e of etapesAdr) {
      const a = (e.adresse || "").trim();
      if (!a) continue;
      const parts = a.split(",").map(s => s.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) countrySet.add(last);
    }
    const pays = countrySet.size;

    // Top 5 pays (fréquence)
    const countryFreq: Record<string, number> = {};
    for (const e of etapesAdr) {
      const a = (e.adresse || "").trim();
      if (!a) continue;
      const parts = a.split(",").map(s => s.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) countryFreq[last] = (countryFreq[last] || 0) + 1;
    }
    const topPays = Object.entries(countryFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // 12 derniers mois (mois courant inclus)
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // On récupère les dates puis on assemble en JS (simple et portable)
    const [voyagesDates, mediaDates] = await Promise.all([
      prisma.voyage.findMany({
        where: { userId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.media.findMany({
        where: {
          OR: [
            { voyage: { userId } },
            { etape: { voyage: { userId } } },
          ],
          createdAt: { gte: start },
        },
        select: { createdAt: true, type: true },
      }),
    ]);

    // "YYYY-MM"
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push(key);
    }
    const makeBins = () => Object.fromEntries(months.map(m => [m, 0]));

    const voyagesByMonth: Record<string, number> = makeBins();
    voyagesDates.forEach(v => {
      const d = v.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in voyagesByMonth) voyagesByMonth[key]++;
    });

    const mediasByMonth: Record<string, number> = makeBins();
    mediaDates.forEach(m => {
      const d = m.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in mediasByMonth) mediasByMonth[key]++;
    });

    return NextResponse.json({
      voyages,
      etapes,
      pays,
      photos,
      videos,
      topPays,
      monthly: months.map((m) => ({
        month: m, // "YYYY-MM"
        voyages: voyagesByMonth[m] ?? 0,
        medias: mediasByMonth[m] ?? 0,
      })),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
