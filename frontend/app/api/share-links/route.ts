import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserFromJwt } from "@/lib/requireUserFromJwt";
import { getOwnerUserIdByVoyageId } from "@/lib/ownership";
import { createShareLinkSchema } from "@/lib/validation/share";
import bcrypt from "bcryptjs";
import { generateSharePin } from "@/lib/security/pin";
import { logUsageFromRequest } from "@/lib/audit";

export const runtime = "nodejs";

function baseUrlFromHeaders(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host ?? process.env.NEXT_PUBLIC_APP_URL ?? "localhost:3000"}`;
}

const tokenSuffix = (t: string) => String(t).slice(-6);

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);
    const body = await req.json();
    const parsed = createShareLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { voyageId, expiresInHours } = parsed.data;
    const inputPin = parsed.data.pin;

    const owner = await getOwnerUserIdByVoyageId(voyageId);
    if (owner == null) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    if (owner !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    const token = crypto.randomUUID();
    const plainPin = (inputPin ?? generateSharePin()).toUpperCase();
    const pinHash = await bcrypt.hash(plainPin, 10);
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const link = await prisma.shareLink.create({
      data: { voyageId, pinHash, token, expiresAt },
    });

    await logUsageFromRequest(req, {
      type: "share.create",
      user_id: userId,
      meta: { voyageId, token_suffix: tokenSuffix(link.token), expiresInHours }
    });

    const url = `${baseUrlFromHeaders(req)}/partage/${link.token}`;
    return NextResponse.json({ data: { ...link, url, pin: plainPin } }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await requireUserFromJwt(req);
    const { searchParams } = new URL(req.url);
    const voyageId = Number(searchParams.get("voyageId"));
    if (!Number.isInteger(voyageId) || voyageId <= 0) {
      return NextResponse.json({ error: "voyageId invalide" }, { status: 400 });
    }

    const owner = await getOwnerUserIdByVoyageId(voyageId);
    if (owner == null) return NextResponse.json({ error: "Voyage introuvable" }, { status: 404 });
    if (owner !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });

    const links = await prisma.shareLink.findMany({
      where: { voyageId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: links });
  } catch (e: any) {
    if (e?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
