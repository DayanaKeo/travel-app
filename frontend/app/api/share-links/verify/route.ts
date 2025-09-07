import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPinSchema } from "@/lib/validation/share";
import bcrypt from "bcryptjs";
import { clearRate, isLocked, onFailAttempt, RATE_CONST } from "@/lib/rateLimit";
import { logUsageFromRequest } from "@/lib/audit";

export const runtime = "nodejs";

function clientIp(req: NextRequest) {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "0.0.0.0";
}

const tokenSuffix = (t: string) => String(t).slice(-6);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyPinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });

    const { token } = parsed.data;
    const pin = parsed.data.pin.toUpperCase();
    const ip = clientIp(req);

    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link) {
      await logUsageFromRequest(req, { type: "share.pin.unknown", meta: { token_suffix: tokenSuffix(token) } });
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    }
    if (link.isRevoked) {
      await logUsageFromRequest(req, { type: "share.pin.revoked", meta: { token_suffix: tokenSuffix(link.token) } });
      return NextResponse.json({ error: "Lien révoqué" }, { status: 403 });
    }
    if (link.expiresAt.getTime() < Date.now()) {
      await logUsageFromRequest(req, { type: "share.pin.expired", meta: { token_suffix: tokenSuffix(link.token) } });
      return NextResponse.json({ error: "Lien expiré" }, { status: 410 });
    }

    const { locked, retryAfter } = await isLocked(token, ip);
    if (locked) {
      await logUsageFromRequest(req, { type: "share.pin.locked", meta: { token_suffix: tokenSuffix(link.token) } });
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
      await logUsageFromRequest(req, {
        type: "share.pin.fail",
        meta: { token_suffix: tokenSuffix(link.token), remaining: r.remaining }
      });
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

    // Succès
    await clearRate(token, ip);
    await logUsageFromRequest(req, {
      type: "share.pin.success",
      meta: { token_suffix: tokenSuffix(link.token), voyageId: link.voyageId }
    });

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

    // ✅ trace l’octroi d’accès
    await logUsageFromRequest(req, { type: "share.grant", meta: { token_suffix: tokenSuffix(link.token) } });

    return res;
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
