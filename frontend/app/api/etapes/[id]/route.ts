import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByEtapeId } from "@/lib/ownership";
import { updateEtapeSchema } from "@/lib/validation/etape";

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


export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const etapeId = parseId(id);
    if (!etapeId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertEtapeOwnershipOr404(etapeId, userId);

    const etape = await prisma.etape.findUnique({ where: { id: etapeId } });
    if (!etape) return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });

    return NextResponse.json({ data: etape });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const etapeId = parseId(id);
    if (!etapeId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertEtapeOwnershipOr404(etapeId, userId);

    const body = await req.json();
    const parsed = updateEtapeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const payload = parsed.data;
    const updated = await prisma.etape.update({
      where: { id: etapeId },
      data: {
        ...("titre" in payload ? { titre: payload.titre } : {}),
        ...("adresse" in payload ? { adresse: payload.adresse } : {}),
        ...("texte" in payload ? { texte: payload.texte ?? null } : {}),
        ...("latitude" in payload ? { latitude: payload.latitude } : {}),
        ...("longitude" in payload ? { longitude: payload.longitude } : {}),
        ...("date" in payload && payload.date ? { date: payload.date } : {}),
        // ...("ordre" in payload ? { ordre: payload.ordre ?? null } : {}),
        // ...("status" in payload ? { status: payload.status } : {}),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const etapeId = parseId(id);
    if (!etapeId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertEtapeOwnershipOr404(etapeId, userId);

    await prisma.etape.delete({ where: { id: etapeId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
