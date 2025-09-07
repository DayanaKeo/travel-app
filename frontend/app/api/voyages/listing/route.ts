// frontend/app/api/voyages/listing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";

export const runtime = "nodejs";

/**
 * GET /api/voyages/listing
 * Retourne une liste enrichie pour l’UI :
 *  - coverUrl : 1ère image (Media.type="image") la plus récente
 *  - etapesCount : nombre d’étapes
 *  - isShared : vrai si un ShareLink actif existe (non révoqué & non expiré)
 */
export async function GET() {
  try {
    const user = await requireUser();
    const now = new Date();

    const rows = await prisma.voyage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { etapes: true } },
        media: {
          where: { type: "image" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { url: true },
        },
        shares: {
          where: { isRevoked: false, expiresAt: { gt: now } },
          select: { id: true },
        },
      },
    });

    const data = rows.map((v: typeof rows[number]) => ({
      id: v.id,
      titre: v.titre,
      description: v.description,
      dateDebut: v.dateDebut,
      dateFin: v.dateFin,
      isPublic: v.isPublic,
      etapesCount: v._count.etapes,
      isShared: v.shares.length > 0,
      coverUrl: v.media[0]?.url ?? null,
    }));

    return NextResponse.json({ items: data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
