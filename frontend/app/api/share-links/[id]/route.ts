import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByVoyageId } from "@/lib/ownership";
import { logUsageFromRequest } from "@/lib/audit";

export const runtime = "nodejs";
const tokenSuffix = (t: string) => String(t).slice(-6);

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const linkId = Number(id);
    if (!Number.isInteger(linkId) || linkId <= 0) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const { id: userId } = await requireUserFromJwt(req);

    const link = await prisma.shareLink.findUnique({ where: { id: linkId } });
    if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

    const owner = await getOwnerUserIdByVoyageId(link.voyageId);
    if (owner !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    const updated = await prisma.shareLink.update({
      where: { id: linkId },
      data: { isRevoked: true },
    });

    await logUsageFromRequest(req, {
      type: "share.revoke",
      user_id: userId,
      meta: { voyageId: link.voyageId, token_suffix: tokenSuffix(link.token) }
    });

    return NextResponse.json({ data: updated });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
