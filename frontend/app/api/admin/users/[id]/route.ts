import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest } from "@/app/api/_utils/auth";
import { logAdminAction } from "@/app/api/_utils/audit";

type Action = "promote" | "suspend" | "restore";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdminFromRequest(req);
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const action: Action | undefined = body?.action;
    if (!action || !["promote", "suspend", "restore"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if (admin.uid === id && action !== "restore") {
      return NextResponse.json({ error: "Action non autorisée sur ton propre compte" }, { status: 400 });
    }
    if (target.role === "ADMIN" && (action === "suspend" || action === "promote")) {
      return NextResponse.json({ error: "Action non autorisée sur un compte ADMIN" }, { status: 400 });
    }

    let data: Record<string, any> | null = null;
    if (action === "promote" && target.role === "USER") data = { role: "ADMIN" as const };
    if (action === "suspend" && target.status === "ACTIVE") data = { status: "SUSPENDED" as const };
    if (action === "restore" && target.status === "SUSPENDED") data = { status: "ACTIVE" as const };

    if (!data) {
      return NextResponse.json({ ok: true, user: target, note: "Aucun changement" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, status: true },
    });

    try { await logAdminAction({ by: admin.uid, action, targetUserId: id }); } catch {}

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erreur serveur", details: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdminFromRequest(req);
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if (admin.uid === id) {
      return NextResponse.json({ error: "Impossible de supprimer ton propre compte" }, { status: 400 });
    }
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Impossible de supprimer un ADMIN" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    try { await logAdminAction({ by: admin.uid, action: "delete", targetUserId: id }); } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erreur serveur", details: e?.message }, { status: 500 });
  }
}
