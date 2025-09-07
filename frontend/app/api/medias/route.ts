import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByEtapeId } from "@/lib/ownership";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VID = ["video/mp4", "video/webm"];
const MAX_SIZE = 30 * 1024 * 1024; // 30MB

function typeFromMime(m: string): "image" | "video" | null {
  if (ALLOWED_IMG.includes(m)) return "image";
  if (ALLOWED_VID.includes(m)) return "video";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const etapeId = Number(form.get("etapeId")); 

    if (!file || !Number.isInteger(etapeId) || etapeId <= 0) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const owner = await getOwnerUserIdByEtapeId(etapeId);
    if (!owner) return NextResponse.json({ error: "Étape introuvable" }, { status: 404 });
    if (owner !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Fichier trop volumineux" }, { status: 413 });

    const mime = file.type || "application/octet-stream";
    const mediaType = typeFromMime(mime);
    if (!mediaType) return NextResponse.json({ error: "Type de fichier non supporté" }, { status: 415 });

    // Upload Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "carnet-voyage/etapes";
    const uploaded = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: mediaType === "video" ? "video" : "image" },
        (err, result) => (err || !result ? reject(err) : resolve(result))
      );
      stream.end(buffer);
    });

    const created = await prisma.media.create({
      data: {
        etapeId,
        voyageId: null,
        url: uploaded.secure_url,
        type: mediaType, 
        takenAt: uploaded.created_at ? new Date(uploaded.created_at) : null,
        mongoRef: uploaded.public_id,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
