import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;

    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    if (link.isRevoked) return NextResponse.json({ error: "Lien révoqué" }, { status: 403 });
    if (link.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Lien expiré" }, { status: 410 });

    const hasCookie =
      req.cookies.get(`share_${token}`)?.value === "1" ||
      req.cookies.get(`share:${token}`)?.value === "1";
    if (!hasCookie) return NextResponse.json({ error: "PIN requis" }, { status: 401 });

    const voyage = await prisma.voyage.findUnique({
      where: { id: link.voyageId },
      select: {
        id: true, titre: true, description: true, image: true, dateDebut: true, dateFin: true,
        etapes: {
          where: { deletedAt: null },
          orderBy: { date: "asc" },
          select: { id: true, titre: true, date: true, adresse: true, texte: true },
        },
      },
    });
    if (!voyage) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });

    return NextResponse.json({ data: voyage });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
