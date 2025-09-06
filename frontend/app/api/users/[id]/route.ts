import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest, requireUserIdFromRequest } from "@/app/api/_utils/auth";
import { profilSchema, preferencesSchema, changePwdSchema } from "@/lib/validation/user";
import bcrypt from "bcryptjs";
import type { RouteCtx } from "@/app/types/route";

type IdParam = { id: string };
type Role = "ADMIN" | "USER";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

export async function GET(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    await requireAdminFromRequest(req);
    const { id } = await ctx.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { profil: true, preferences: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    await requireAdminFromRequest(req);
    const { id } = await ctx.params;
    const userId = Number(id);

    // 🚫 plus d'any
    const raw: unknown = await req.json().catch(() => ({}));

    let role: Role | undefined;
    let premium: boolean | undefined;
    let profileInput: unknown;
    let preferenceInput: unknown;

    if (isRecord(raw)) {
      if (typeof raw.role === "string") {
        const r = raw.role.toUpperCase();
        if (r === "ADMIN" || r === "USER") role = r;
      }
      if (typeof raw.premium === "boolean") {
        premium = raw.premium;
      }
      if ("profile" in raw) profileInput = (raw as Record<string, unknown>).profile;
      if ("preference" in raw) preferenceInput = (raw as Record<string, unknown>).preference;
    }

    // Mise à jour role/premium si fournis
    if (role !== undefined || typeof premium === "boolean") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(role !== undefined ? { role } : {}),
          ...(typeof premium === "boolean" ? { premium } : {}),
        },
      });
    }

    // Profil (validé Zod)
    if (profileInput !== undefined) {
      const p = profilSchema.parse(profileInput);
      await prisma.profilUser.upsert({
        where: { userId },
        update: { ...p, dateNaissance: p.dateNaissance ? new Date(p.dateNaissance) : null },
        create: { userId, ...p, dateNaissance: p.dateNaissance ? new Date(p.dateNaissance) : null },
      });
    }

    // Préférences (validé Zod)
    if (preferenceInput !== undefined) {
      const pr = preferencesSchema.parse(preferenceInput);
      await prisma.preferenceUser.upsert({
        where: { userId },
        update: pr,
        create: { userId, ...pr },
      });
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: userId },
      include: { profil: true, preferences: true },
    });
    return NextResponse.json(refreshed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserIdFromRequest(req);
    const { currentPassword = "", newPassword = "" } = changePwdSchema.parse(await req.json());
    const cur = String(currentPassword).trim();
    const nxt = String(newPassword).trim();

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Compte OAuth (sans password local) → initialisation
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

    // Changement standard
    const ok = await bcrypt.compare(cur, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Ancien mot de passe invalide" }, { status: 400 });

    const hash = await bcrypt.hash(nxt, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bad Request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx<IdParam>) {
  try {
    await requireAdminFromRequest(req);
    const { id } = await ctx.params;
    const userId = Number(id);
    await prisma.user.update({
      where: { id: userId },
      data: { email: null, passwordHash: null, name: null, image: null },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
}
