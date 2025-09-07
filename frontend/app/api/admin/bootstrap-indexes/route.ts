import { NextResponse } from "next/server";
import { ensureMongoIndexes } from "@/lib/mongo-setup";

export async function POST() {
  await ensureMongoIndexes();
  return NextResponse.json({ ok: true });
}
