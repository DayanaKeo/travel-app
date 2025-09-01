import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { updateVoyageSchema } from "@/lib/validation/voyage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const voyageId = Number(id);
    if (!Number.isInteger(voyageId) || voyageId <= 0) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const { id: userId } = await requireUserFromJwt(req);

    const voyage = await prisma.voyage.findFirst({
      where: { id: voyageId, userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        titre: true,
        description: true,
        dateDebut: true,
        dateFin: true,
        isPublic: true,
        // image: true,
        _count: { select: { etapes: true } },
      },
    });

    if (!voyage) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    return NextResponse.json({ data: voyage });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const voyageId = Number(id);
    if (!Number.isInteger(voyageId) || voyageId <= 0) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const { id: userId } = await requireUserFromJwt(req);

    // Vérifie la propriété
    const canEdit = await prisma.voyage.findFirst({ where: { id: voyageId, userId }, select: { id: true } });
    if (!canEdit) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    const body = await req.json();
    const parsed = updateVoyageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const p = parsed.data;
    const updated = await prisma.voyage.update({
      where: { id: voyageId },
      data: {
        ...(p.titre !== undefined ? { titre: p.titre } : {}),
        ...(p.description !== undefined ? { description: p.description } : {}),
        ...(p.dateDebut !== undefined ? { dateDebut: p.dateDebut } : {}),
        ...(p.dateFin !== undefined ? { dateFin: p.dateFin } : {}),
        ...(p.isPublic !== undefined ? { isPublic: p.isPublic } : {}),
        // ...(p.image !== undefined ? { image: p.image } : {}),
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        titre: true,
        description: true,
        dateDebut: true,
        dateFin: true,
        isPublic: true,
        // image: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const voyageId = Number(id);
    if (!Number.isInteger(voyageId) || voyageId <= 0) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const { id: userId } = await requireUserFromJwt(req);
    const canEdit = await prisma.voyage.findFirst({ where: { id: voyageId, userId }, select: { id: true } });
    if (!canEdit) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    await prisma.voyage.delete({ where: { id: voyageId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
