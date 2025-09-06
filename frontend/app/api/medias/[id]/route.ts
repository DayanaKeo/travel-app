import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByEtapeId } from "@/lib/ownership";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function parseId(raw: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

type RouteCtx<P extends Record<string, string>> = { params: Promise<P> };
type IdParam = { id: string };

export async function DELETE(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    const { id } = await ctx.params;
    const mediaId = parseId(id);
    if (!mediaId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);

    // 1) Trouver le média
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: { id: true, etapeId: true, voyageId: true, type: true, mongoRef: true },
    });
    if (!media) return NextResponse.json({ error: "Média introuvable" }, { status: 404 });

    // 2) Ownership
    if (media.etapeId) {
      const owner = await getOwnerUserIdByEtapeId(media.etapeId);
      if (!owner) return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
      if (owner !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    } else if (media.voyageId) {
      const v = await prisma.voyage.findUnique({ where: { id: media.voyageId }, select: { userId: true } });
      if (!v) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
      if (v.userId !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    } else {
      return NextResponse.json({ error: "Média non rattaché" }, { status: 409 });
    }

    // 3) Suppression Cloudinary
    if (media.mongoRef) {
      try {
        await cloudinary.uploader.destroy(media.mongoRef, {
          resource_type: media.type === "video" ? "video" : "image",
        });
      } catch {
        // on ignore l'erreur Cloudinary pour ne pas bloquer la suppression DB
      }
    }

    await prisma.media.delete({ where: { id: mediaId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
