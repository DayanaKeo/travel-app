import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const voyage = await prisma.voyage.findFirst({
      where: { id, isPublic: true, user: { preferences: { is: { profilPublic: true } } } },
      select: { id: true, titre: true, userId: true },
    });

    if (!voyage) {
      return NextResponse.json({ error: "Voyage non publié ou auteur non public" }, { status: 404 });
    }

    const etapes = await prisma.etape.findMany({
      where: { voyageId: id, status: "PUBLISHED", deletedAt: null },
      orderBy: [{ ordre: "asc" }, { date: "asc" }],
      select: {
        id: true,
        titre: true,
        texte: true,
        latitude: true,
        longitude: true,
        adresse: true,
        date: true,
      },
    });

    return NextResponse.json({ voyageId: id, etapes });
  } catch (e) {
    console.error("EXPLORER_VOYAGE_DETAILS_ERROR", e);
    return NextResponse.json({ error: "Impossible de charger les étapes" }, { status: 500 });
  }
}
