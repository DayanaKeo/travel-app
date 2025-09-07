import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import { createVoyageSchema } from "@/lib/validation/voyage";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 15 * 1024 * 1024;

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const voyages = await prisma.voyage.findMany({
      where: { userId: Number(user.id) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(voyages, { status: 200 });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);

    const contentType = req.headers.get("content-type") || "";
    let payload: any = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      payload.titre = form.get("titre");
      payload.description = form.get("description") || null;
      payload.dateDebut = form.get("dateDebut");
      payload.dateFin = form.get("dateFin");
      // checkbox/boolean : on accepte "on", "true", etc.
      const isPublicRaw = String(form.get("isPublic") ?? "");
      payload.isPublic = ["true", "on", "1"].includes(isPublicRaw.toLowerCase());
      file = (form.get("cover") as File) ?? null;
    } else {
      payload = await req.json();
    }

    // Validation
    const parsed = createVoyageSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const p = parsed.data;

    // Upload cover si fournie
    let coverUrl: string | null = null;
    let publicId: string | null = null;

    if (file) {
      if (file.size > MAX_SIZE) return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 });
      const mime = file.type || "application/octet-stream";
      if (!ALLOWED_IMG.includes(mime)) return NextResponse.json({ error: "Format image non supporté" }, { status: 415 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "carnet-voyage/voyages";
      const uploaded = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image" },
          (err, result) => (err || !result ? reject(err) : resolve(result))
        );
        stream.end(buffer);
      });
      coverUrl = uploaded.secure_url;
      publicId = uploaded.public_id;
    }

    // Création du voyage
    const voyage = await prisma.voyage.create({
      data: {
        userId,
        titre: p.titre,
        description: p.description ?? null,
        dateDebut: p.dateDebut,
        dateFin: p.dateFin,
        isPublic: p.isPublic ?? false,
        image: coverUrl, 
      },
    });

    // Optionnel : garder une trace en Media (utile pour ta galerie voyage)
    if (coverUrl) {
      await prisma.media.create({
        data: {
          voyageId: voyage.id,
          etapeId: null,
          url: coverUrl,
          type: "image",
          mongoRef: publicId, // pour DELETE Cloudinary plus tard
        },
      });
    }

    return NextResponse.json({ data: voyage }, { status: 201 });
  } catch (e: any) {
    if (e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
