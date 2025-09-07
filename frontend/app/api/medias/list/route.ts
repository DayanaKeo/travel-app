import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByEtapeId } from "@/lib/ownership";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);
    const url = new URL(req.url);
    const etapeId = Number(url.searchParams.get("etapeId"));

    if (!Number.isInteger(etapeId) || etapeId <= 0) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const owner = await getOwnerUserIdByEtapeId(etapeId);
    if (!owner) return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    if (owner !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    const data = await prisma.media.findMany({
      where: { etapeId },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ data });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
