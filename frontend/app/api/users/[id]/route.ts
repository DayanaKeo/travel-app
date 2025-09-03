import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { profilSchema, preferencesSchema, changePwdSchema } from "@/lib/validation/user";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req.headers);
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
      include: { profil: true, preferences: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req.headers);
    const id = Number(params.id);
    const body = await req.json();

    if (body.role || typeof body.premium === "boolean") {
      await prisma.user.update({
        where: { id },
        data: {
          role: body.role,
          premium: body.premium,
        },
      });
    }

    if (body.profile) {
      const p = profilSchema.parse(body.profile);
      await prisma.profilUser.upsert({
        where: { userId: id },
        update: { ...p, dateNaissance: p.dateNaissance ? new Date(p.dateNaissance) : null },
        create: { userId: id, ...p, dateNaissance: p.dateNaissance ? new Date(p.dateNaissance) : null },
      });
    }

    if (body.preference) {
      const pr = preferencesSchema.parse(body.preference);
      await prisma.preferenceUser.upsert({
        where: { userId: id },
        update: pr,
        create: { userId: id, ...pr },
      });
    }

    const refreshed = await prisma.user.findUnique({
      where: { id }, include: { profil: true, preferences: true },
    });
    return NextResponse.json(refreshed);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = requireAuth(req.headers);

    // on trim pour éviter un false négatif si l'utilisateur met un espace
    const { currentPassword = "", newPassword = "" } = changePwdSchema.parse(await req.json());
    const cur = String(currentPassword).trim();
    const nxt = String(newPassword).trim();

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Cas 1: aucun mot de passe en base (compte OAuth) → autoriser initialisation si currentPassword vide
    if (!user?.passwordHash) {
      if (cur.length > 0) {
        return NextResponse.json(
          { error: "Compte OAuth (mot de passe local absent). Laissez 'ancien mot de passe' vide pour en définir un." },
          { status: 400 }
        );
      }
      const hash = await bcrypt.hash(nxt, 12);
      await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
      return NextResponse.json({ ok: true, message: "Mot de passe initialisé." });
    }

    const ok = await bcrypt.compare(cur, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Ancien mot de passe invalide" }, { status: 400 });
    }

    const hash = await bcrypt.hash(nxt, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(req.headers);
    const id = Number(params.id);
    await prisma.user.update({
      where: { id },
      data: { email: null, passwordHash: null, name: null, image: null },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
}
