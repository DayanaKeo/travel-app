// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // si souci natif sous Windows, remplace par "bcryptjs"
import { prisma } from "@/lib/prisma";
import { SignupSchema } from "@/lib/validation/auth";
import { sendMail } from "@/lib/mailer";
import { generateToken, hashToken, addHours } from "@/lib/tokens";

// --- petit rate-limit mémoire, comme chez toi ---
const buckets = new Map<string, { count: number; ts: number }>();
function rateLimit(ip: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip) ?? { count: 0, ts: now };
  if (now - b.ts > windowMs) { b.count = 0; b.ts = now; }
  b.count++; buckets.set(ip, b);
  return b.count <= limit;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    // email unique
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }

    // création user (non vérifié)
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, status: "ACTIVE", role: "USER" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // purge anciens tokens pour cet email (unicité sur identifier)
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const raw = generateToken(32);
    const tokenHash = hashToken(raw);
    const expires = addHours(24);

    await prisma.verificationToken.create({
      data: { identifier: email, tokenHash, expires },
    });

    // envoi email via Mailtrap (SMTP)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${raw}&email=${encodeURIComponent(email)}`;

    try {
      await sendMail({
        to: email,
        subject: "Confirme ton e-mail — TravelBook",
        html: `
          <div style="font-family:Inter,Arial,sans-serif;line-height:1.6">
            <h2>Bienvenue ${name ?? ""} 👋</h2>
            <p>Confirme ton adresse e-mail pour activer ton compte :</p>
            <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Vérifier mon e-mail</a></p>
            <p>Ce lien est valable 24h.</p>
          </div>`,
        text: `Confirme ton email : ${verifyUrl}`,
      });
    } catch (e) {
      console.error("MAIL_SEND_FAILED", e);
      // on garde le user + token créés, l’UI proposera "Renvoyer l’e-mail"
      return NextResponse.json(
        { ok: false, code: "MAIL_SEND_FAILED", message: "Impossible d'envoyer l'email de vérification. Réessaie plus tard ou renvoie l’e-mail." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { ok: true, user, next: `/auth/check-email?email=${encodeURIComponent(email)}` },
      { status: 201 }
    );
  } catch (err) {
    console.error("ERREUR_INSCRIPTION", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// runtime Node obligatoire si tu utilises bcrypt natif
export const runtime = "nodejs";
