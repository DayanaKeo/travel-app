import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { profilSchema, preferencesSchema, changePwdSchema } from "@/lib/validation/user";
import bcrypt from "bcryptjs";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export async function GET(req: NextRequest) {
  try {
    const userId = requireAuth(req.headers);
    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: { profil: true, preferences: true },
    });
    return NextResponse.json(me);
  } catch (e) {
    const m = (e as Error).message;
    return NextResponse.json({ error: m }, { status: m === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = requireAuth(req.headers);
    const body = await req.json();

    if (body.profile) {
      const data = profilSchema.parse(body.profile);

      const payload: Record<string, any> = {};

      const setIfPresent = (
        key: keyof typeof data,
        mapTo?: string,
        transform?: (v: any) => any
      ) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const outKey = mapTo ?? (key as string);
          const raw = (data as any)[key];
          (payload as any)[outKey] = transform ? transform(raw) : (raw ?? null);
        }
      };

      setIfPresent("nomComplet");
      setIfPresent("localisation");
      setIfPresent("languePreferee");
      setIfPresent("biographie");
      setIfPresent("avatarUrl");

      setIfPresent("dateNaissance", "dateNaissance", (v) => (v ? new Date(v) : null));

      if (Object.prototype.hasOwnProperty.call(data, "telephone")) {
        const tel = (data as any).telephone;
        if (!tel || String(tel).trim() === "") {
          payload.telephone = null; // effacer en DB
        } else {
          const country = (data.languePreferee?.split("-")[1]?.toUpperCase() ?? "FR") as any;
          const parsed = parsePhoneNumberFromString(String(tel), country);
          if (!parsed?.isValid()) {
            return NextResponse.json(
              { error: "Téléphone invalide pour le pays" },
              { status: 400 }
            );
          }
          payload.telephone = parsed.number; // E.164
        }
      }

      const profil = await prisma.profilUser.upsert({
        where: { userId },
        update: payload,
        create: { userId, ...payload },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({ profil });
    }

    if (body.preference) {
      const data = preferencesSchema.parse(body.preference);
      const preferences = await prisma.preferenceUser.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
      });
      return NextResponse.json({ preferences });
    }

    return NextResponse.json(
      { error: "Aucune section reconnue (profile|preference)" },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = requireAuth(req.headers);
    const { currentPassword, newPassword } = changePwdSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Compte OAuth (mot de passe local absent)" },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Ancien mot de passe invalide" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ 
      where: { id: userId }, 
      data: { passwordHash: hash } 
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = requireAuth(req.headers);
    await prisma.user.update({
      where: { id: userId },
      data: { email: null, passwordHash: null, name: null, image: null },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 400 });
  }
}
