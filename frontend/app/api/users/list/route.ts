import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest } from "@/app/api/_utils/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdminFromRequest(req);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, premium: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
