import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const vt = await prisma.verificationToken.findFirst({
    where: { identifier: email, tokenHash },
  });
  if (!vt) {
    return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  }

  if (vt.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { id: vt.id } });
    return NextResponse.json({ error: "Token expiré." }, { status: 410 });
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { id: vt.id } });

  const app = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(`${app}/auth/verified?email=${encodeURIComponent(email)}`);
}

export const runtime = "nodejs";
