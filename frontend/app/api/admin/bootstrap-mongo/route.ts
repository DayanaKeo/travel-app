import { NextRequest, NextResponse } from "next/server";
import { ensureMongoCollectionsAndIndexes, seedMongoDemoData } from "@/lib/mongo-init";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const doSeed = url.searchParams.get("seed") === "1";

    await ensureMongoCollectionsAndIndexes();

    if (doSeed) {
      await seedMongoDemoData();
    }

    return NextResponse.json({ ok: true, seeded: doSeed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
