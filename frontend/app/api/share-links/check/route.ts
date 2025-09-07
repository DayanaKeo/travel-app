import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logUsageFromRequest } from "@/lib/audit";

export const runtime = "nodejs";
const tokenSuffix = (t: string) => String(t).slice(-6);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || "";
    if (!token) return NextResponse.json({ error: "token requis" }, { status: 400 });

    const link = await prisma.shareLink.findUnique({
      where: { token },
      select: {
        token: true, expiresAt: true, isRevoked: true, voyageId: true,
        voyage: { select: { titre: true } },
      },
    });
    if (!link) {
      await logUsageFromRequest(req, { type: "share.open.unknown", meta: { token_suffix: tokenSuffix(token) } });
      return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
    }

    const status =
      link.isRevoked ? "revoked" :
      link.expiresAt.getTime() < Date.now() ? "expired" :
      "active";

    await logUsageFromRequest(req, {
      type: status === "active" ? "share.open" : status === "expired" ? "share.open.expired" : "share.open.revoked",
      meta: {
        token_suffix: tokenSuffix(link.token),
        voyageId: link.voyageId
      }
    });

    const hasCookie =
      req.cookies.get(`share_${token}`)?.value === "1" ||
      req.cookies.get(`share:${token}`)?.value === "1";

    return NextResponse.json({
      data: {
        token: link.token,
        voyageId: link.voyageId,
        titre: link.voyage.titre,
        expiresAt: link.expiresAt,
        status,
        hasCookie,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
