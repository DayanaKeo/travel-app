import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByEtapeId } from "@/lib/ownership";
import { updateEtapeSchema } from "@/lib/validation/etape";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function parseId(raw: string) {
  const idNum = Number(raw);
  if (!Number.isInteger(idNum) || idNum <= 0) return null;
  return idNum;
}

async function assertEtapeOwnershipOr404(etapeId: number, userId: number) {
  const owner = await getOwnerUserIdByEtapeId(etapeId);
  if (owner == null) throw new Error("NOT_FOUND");
  if (owner !== userId) throw new Error("FORBIDDEN");
}

// Next 15: params est une Promise
type RouteCtx<P extends Record<string, string>> = { params: Promise<P> };
type IdParam = { id: string };

type EtapeUpdateData = Partial<{
  titre: string;
  adresse: string;
  texte: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  date: string | Date;
}>;

export async function GET(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    const { id } = await ctx.params;
    const etapeId = parseId(id);
    if (!etapeId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertEtapeOwnershipOr404(etapeId, userId);

    const etape = await prisma.etape.findUnique({ where: { id: etapeId } });
    if (!etape) return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });

    const data = {
      ...etape,
      latitude: Number(etape.latitude),
      longitude: Number(etape.longitude),
    };
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    const { id } = await ctx.params;
    const etapeId = parseId(id);
    if (!etapeId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertEtapeOwnershipOr404(etapeId, userId);

    const body: unknown = await req.json();
    const parsed = updateEtapeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

    const p = parsed.data;
    const data: EtapeUpdateData = {};

    if (p.titre !== undefined) data.titre = p.titre;
    if (p.adresse !== undefined) data.adresse = p.adresse;
    if (p.texte !== undefined) data.texte = p.texte ?? null;
    if (p.latitude !== undefined) data.latitude = new Prisma.Decimal(p.latitude);
    if (p.longitude !== undefined) data.longitude = new Prisma.Decimal(p.longitude);
    if (p.date !== undefined && p.date) data.date = p.date;

    const row = await prisma.etape.update({ where: { id: etapeId }, data });

    const returned = {
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };
    return NextResponse.json({ data: returned });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    const { id } = await ctx.params;
    const etapeId = parseId(id);
    if (!etapeId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertEtapeOwnershipOr404(etapeId, userId);

    await prisma.etape.delete({ where: { id: etapeId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
