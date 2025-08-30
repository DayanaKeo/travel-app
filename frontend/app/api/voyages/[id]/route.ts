// frontend/app/api/voyages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/requireUser";
import { VoyageUpdateSchema } from "../../../../lib/validation/voyage";

export const runtime = "nodejs";


async function assertOwner(voyageId: number, userId: number) {
  const v = await prisma.voyage.findUnique({ where: { id: voyageId }, select: { userId: true } });
  if (!v) throw new Error("NOT_FOUND");
  if (v.userId !== userId) throw new Error("FORBIDDEN");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const id = Number(params.id);
    const voyage = await prisma.voyage.findFirst({
      where: { id, userId: user.id },
    });
    if (!voyage) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json(voyage, { status: 200 });
  } catch (e: any) {
    const msg = e?.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const id = Number(params.id);
    await assertOwner(id, user.id);

    const body = await req.json();
    const parsed = VoyageUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_DATA", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.voyage.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (e: any) {
    const msg = e?.message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "NOT_FOUND") return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}


export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const id = Number(params.id);
    await assertOwner(id, user.id);

    await prisma.voyage.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message;
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "NOT_FOUND") return NextResponse.json({ error: msg }, { status: 404 });
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}
