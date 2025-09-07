import { NextRequest, NextResponse } from "next/server";
import { requireUserIdFromRequest } from "@/app/api/_utils/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserIdFromRequest(req); // ✅ Auth requise

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 3 Mo)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload Cloudinary (avatar normalisé 256x256 + auto format/qualité)
    const uploaded: UploadApiResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          public_id: `user_${userId}`, // remplace l'avatar de l'utilisateur (pas d'accumulation)
          overwrite: true,
          invalidate: true,            // purge CDN
          transformation: [
            { width: 256, height: 256, crop: "fill", gravity: "auto" },
            { fetch_format: "auto", quality: "auto" },
          ],
          resource_type: "image",
        },
        (err, result) => (err ? reject(err) : resolve(result as UploadApiResponse))
      );
      stream.end(buffer);
    });

    const url = uploaded.secure_url; // contient un "version" -> cache-busting

    // ✅ Persistance BDD immédiate (upsert du profil)
    const profil = await prisma.profilUser.upsert({
      where: { userId },
      update: { avatarUrl: url },
      create: { userId, avatarUrl: url },
    });

    // Tu peux aussi mettre à jour user.image si tu l’utilises ailleurs :
    // await prisma.user.update({ where: { id: userId }, data: { image: url } });

    return NextResponse.json({ url, profil });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur upload avatar" }, { status: 500 });
  }
}
