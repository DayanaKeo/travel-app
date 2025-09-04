import { NextResponse } from "next/server";
import { getMongo } from "@/lib/mongo";

export async function GET() {
  try {
    const db = await getMongo();
    const colls = await db.listCollections().toArray();
    return NextResponse.json({ ok: true, collections: colls.map(c => c.name) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
