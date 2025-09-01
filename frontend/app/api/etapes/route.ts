import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { assertVoyageOwnership } from "@/lib/ownership";
import { listEtapesQuerySchema, createEtapeSchema } from "@/lib/validation/etape";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);

    const { searchParams } = new URL(req.url);
    const parsed = listEtapesQuerySchema.safeParse({
      voyageId: searchParams.get("voyageId"),
      order: searchParams.get("order") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { voyageId, order } = parsed.data;

    await assertVoyageOwnership(voyageId, userId);

    const etapes = await prisma.etape.findMany({
      where: { voyageId },
      orderBy: { date: order },
    });

    return NextResponse.json({ data: etapes });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);
    const body = await req.json();

    const parsed = createEtapeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { voyageId, titre, adresse, texte, latitude, longitude, date } = parsed.data;

    await assertVoyageOwnership(voyageId, userId);

    const created = await prisma.etape.create({
      data: {
        voyageId,
        titre,
        adresse,
        texte: texte ?? null,
        latitude,
        longitude,
        date,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}