import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPinSchema } from "@/lib/validation/share";
import bcrypt from "bcryptjs";
import { clearRate, isLocked, onFailAttempt, RATE_CONST } from "@/lib/rateLimit";

export const runtime = "nodejs";

function clientIp(req: NextRequest) {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "0.0.0.0";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyPinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

    const { token } = parsed.data;
    const pin = parsed.data.pin.toUpperCase();
    const ip = clientIp(req);

    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    if (link.isRevoked) return NextResponse.json({ error: "Lien révoqué" }, { status: 403 });
    if (link.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: "Lien expiré" }, { status: 410 });

    const { locked, retryAfter } = await isLocked(token, ip);
    if (locked) {
      const res = NextResponse.json(
        { error: `Trop d’essais. Réessaie dans ${retryAfter}s.` },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(Math.max(1, retryAfter)));
      return res;
    }

    const ok = await bcrypt.compare(pin, link.pinHash);

    if (!ok) {
      const r = await onFailAttempt(token, ip);
      if (r.lockedNow) {
        const res = NextResponse.json(
          { error: `Trop d’essais. Réessaie dans ${RATE_CONST.LOCK_SECONDS}s.` },
          { status: 429 }
        );
        res.headers.set("Retry-After", String(RATE_CONST.LOCK_SECONDS));
        return res;
      }
      return NextResponse.json(
        { error: `PIN invalide. Essais restants: ${r.remaining}` },
        { status: 401 }
      );
    }

    // Succès: clear le compteur et pose le cookie d’accès
    await clearRate(token, ip);

    const res = NextResponse.json({ ok: true, voyageId: link.voyageId });
    const maxAge = Math.max(1, Math.floor((link.expiresAt.getTime() - Date.now()) / 1000));
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = `share_${token}`;

    res.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd, 
      path: "/",
      maxAge,
    });
    res.cookies.set(`share:${token}`, "", { path: "/", maxAge: 0 });

    return res;
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
