import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { assertVoyageOwnership } from "@/lib/ownership";
import { listEtapesQuerySchema, createEtapeSchema } from "@/lib/validation/etape";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function toNumberEtape<T extends { latitude: any; longitude: any }>(e: T) {
  return {
    ...e,
    latitude: Number(e.latitude),
    longitude: Number(e.longitude),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);

    const { searchParams } = new URL(req.url);
    const parsed = listEtapesQuerySchema.safeParse({
      voyageId: searchParams.get("voyageId"),
      order: searchParams.get("order") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { voyageId, order, page, limit, q } = parsed.data;

    await assertVoyageOwnership(voyageId, userId);

    // const etapes = await prisma.etape.findMany({
    //   where: { voyageId },
    //   orderBy: { date: order },
    // });

   const where = {
      voyageId,
      ...(q
        ? {
            OR: [
              { titre: { contains: q, mode: "insensitive" } },
              { adresse: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.etape.count({ where }),
      prisma.etape.findMany({
        where,
        orderBy: { date: order === "asc" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = rows.map(toNumberEtape);
    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
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
        latitude: new Prisma.Decimal(latitude),
        longitude: new Prisma.Decimal(longitude),
        date,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}