import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(50, Number(searchParams.get("pageSize") || 20)));

    const where = q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
            { profil: { is: { nomComplet: { contains: q } } } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, email: true, name: true, role: true, premium: true,
          createdAt: true, updatedAt: true,
          profil: { select: { nomComplet: true, avatarUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({ total, page, pageSize, items });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Erreur liste users" }, { status: 500 });
  }
}
