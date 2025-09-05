import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { generateToken, hashToken, addHours } from "@/lib/tokens";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ message: "Déjà vérifié." });

  // purge expirés
  await prisma.verificationToken.deleteMany({
    where: { identifier: email, expires: { lt: new Date() } },
  });

  // anti-spam : s'il y a déjà un token actif, refuse
  const active = await prisma.verificationToken.count({
    where: { identifier: email, expires: { gt: new Date() } },
  });
  if (active > 0) {
    return NextResponse.json({ error: "Un e-mail de vérification est déjà actif." }, { status: 429 });
  }

  // (re)création
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const raw = generateToken(32);
  const tokenHash = hashToken(raw);
  const expires = addHours(24);

  await prisma.verificationToken.create({
    data: { identifier: email, tokenHash, expires },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${raw}&email=${encodeURIComponent(email)}`;

  await sendMail({
    to: email,
    subject: "Rappel — vérifie ton e-mail",
    html: `<p>Rappel : confirme ton e-mail</p><p><a href="${verifyUrl}">Confirmer</a></p>`,
    text: `Confirme ton e-mail : ${verifyUrl}`,
  });

  return NextResponse.json({ ok: true, message: "E-mail renvoyé." });
}

export const runtime = "nodejs";
