import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 12)));
    const skip = (page - 1) * limit;

    const whereVoyages: any = {
      isPublic: true,
      user: { preferences: { is: { profilPublic: true } } },
    };

    if (q) {
      whereVoyages.OR = [
        { titre: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, voyages] = await Promise.all([
      prisma.voyage.count({ where: whereVoyages }),
      prisma.voyage.findMany({
        where: whereVoyages,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          titre: true,
          description: true,
          dateDebut: true,
          dateFin: true,
          image: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              profil: { select: { localisation: true, biographie: true, avatarUrl: true } },
            },
          },
          _count: { select: { etapes: true, media: true } },
        },
      }),
    ]);

    const authors = await prisma.user.findMany({
      where: {
        preferences: { is: { profilPublic: true } },
        voyages: { some: { isPublic: true } },
      },
      select: {
        id: true,
        name: true,
        image: true,
        profil: { select: { localisation: true, biographie: true, avatarUrl: true } },
        preferences: { select: { profilPublic: true } },
        _count: { select: { voyages: { where: { isPublic: true } } } },
        voyages: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true, titre: true, image: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ page, limit, total, voyages, authors });
  } catch (e) {
    console.error("EXPLORER_API_ERROR", e);
    return NextResponse.json({ error: "Impossible de charger l'explorer" }, { status: 500 });
  }
}
