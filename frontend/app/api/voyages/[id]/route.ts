import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { updateVoyageSchema } from "@/lib/validation/voyage";
import { v2 as cloudinary } from "cloudinary";
import { assertVoyageOwnership } from "@/lib/ownership";

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
        image: true,
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
    const voyageId = parseId(id);
    if (!voyageId) return NextResponse.json({ error: "id invalide" }, { status: 400 });

    const { id: userId } = await requireUserFromJwt(req);
    await assertVoyageOwnership(voyageId, userId);

    const ct = req.headers.get("content-type") || "";
    let body: any = {};
    let file: File | null = null;

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      body.titre = form.get("titre") ?? undefined;
      body.description = form.get("description") ?? undefined;
      body.dateDebut = form.get("dateDebut") ?? undefined;
      body.dateFin = form.get("dateFin") ?? undefined;
      body.isPublic = form.get("isPublic") ?? undefined;
      body.removeCover = form.get("removeCover") ?? undefined;
      file = (form.get("cover") as File) ?? null;
    } else {
      body = await req.json();
    }

    const parsed = updateVoyageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const p = parsed.data;

    const current = await prisma.voyage.findUnique({
      where: { id: voyageId },
      select: { id: true, image: true },
    });
    if (!current) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });

    const data: any = {
      ...("titre" in p ? { titre: p.titre } : {}),
      ...("description" in p ? { description: p.description ?? null } : {}),
      ...("dateDebut" in p ? { dateDebut: p.dateDebut } : {}),
      ...("dateFin" in p ? { dateFin: p.dateFin } : {}),
      ...("isPublic" in p ? { isPublic: p.isPublic } : {}),
      ...("image" in p ? { image: p.image } : {}),
    };

    if (file && file.size > 0) {
      const mime = file.type || "application/octet-stream";
      const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!ok.includes(mime)) return NextResponse.json({ error: "Format image non supporté" }, { status: 415 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "carnet-voyage/voyages";
      const uploaded = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (err, result) => (err || !result ? reject(err) : resolve(result))
        );
        stream.end(buffer);
      });

      data.image = uploaded.secure_url;

      await prisma.media.create({
        data: {
          voyageId,
          etapeId: null,
          url: uploaded.secure_url,
          type: "image",
          mongoRef: uploaded.public_id,
        },
      });
    } else if (p.removeCover && current.image) {
      data.image = null;

      const existingMedia = await prisma.media.findFirst({
        where: { voyageId, url: current.image, type: "image" },
        select: { id: true, mongoRef: true },
      });
      if (existingMedia?.mongoRef) {
        try {
          await cloudinary.uploader.destroy(existingMedia.mongoRef, { resource_type: "image" });
        } catch {
          // on ignore les erreurs Cloudinary
        }
        await prisma.media.delete({ where: { id: existingMedia.id } });
      }
    }

    const updated = await prisma.voyage.update({ where: { id: voyageId }, data });
    return NextResponse.json({ data: updated });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (e.message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
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
