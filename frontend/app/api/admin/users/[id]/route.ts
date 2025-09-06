import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest } from "@/app/api/_utils/auth";
import { logAdminAction } from "@/app/api/_utils/audit";

type Action = "promote" | "suspend" | "restore";
type RouteCtx<P extends Record<string, string>> = { params: Promise<P> };
type IdParam = { id: string };

export async function PATCH(req: Request, ctx: RouteCtx<IdParam>) {
  try {
    const admin = await requireAdminFromRequest(req);

    const { id } = await ctx.params;          // ✅ params est une Promise
    const uid = Number(id);
    if (!Number.isFinite(uid)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as { action?: Action };
    const action = body.action;
    if (!action || !["promote", "suspend", "restore"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if (admin.uid === uid && action !== "restore") {
      return NextResponse.json({ error: "Action non autorisée sur ton propre compte" }, { status: 400 });
    }
    if (target.role === "ADMIN" && (action === "suspend" || action === "promote")) {
      return NextResponse.json({ error: "Action non autorisée sur un compte ADMIN" }, { status: 400 });
    }

    let data: { role?: "ADMIN"; status?: "SUSPENDED" | "ACTIVE" } | null = null;
    if (action === "promote" && target.role === "USER") data = { role: "ADMIN" };
    if (action === "suspend" && target.status === "ACTIVE") data = { status: "SUSPENDED" };
    if (action === "restore" && target.status === "SUSPENDED") data = { status: "ACTIVE" };

    if (!data) return NextResponse.json({ ok: true, user: target, note: "Aucun changement" });

    const updated = await prisma.user.update({
      where: { id: uid },
      data,
      select: { id: true, email: true, role: true, status: true },
    });

    try { await logAdminAction({ by: admin.uid, action, targetUserId: uid }); } catch {}
    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: RouteCtx<IdParam>) {
  try {
    const admin = await requireAdminFromRequest(req);

    const { id } = await ctx.params;          // ✅ idem
    const uid = Number(id);
    if (!Number.isFinite(uid)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if (admin.uid === uid) {
      return NextResponse.json({ error: "Impossible de supprimer ton propre compte" }, { status: 400 });
    }
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Impossible de supprimer un ADMIN" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: uid } });
    try { await logAdminAction({ by: admin.uid, action: "delete", targetUserId: uid }); } catch {}
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
