import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req.headers);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, premium: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
