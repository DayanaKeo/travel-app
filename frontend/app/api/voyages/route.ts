import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/requireUser";
import { VoyageCreateSchema } from "../../../lib/validation/voyage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const voyages = await prisma.voyage.findMany({
      where: { userId: Number(user.id) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(voyages, { status: 200 });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = VoyageCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_DATA", details: parsed.error.flatten() }, { status: 400 });
    }
    const { titre, description, dateDebut, dateFin } = parsed.data;

    const voyage = await prisma.voyage.create({
      data: {
        userId: Number(user.id),
        titre,
        description,
        dateDebut,
        dateFin,
      },
    });

    return NextResponse.json(voyage, { status: 201 });
  } catch (e: any) {
    const msg = e?.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
