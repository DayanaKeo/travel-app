import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMongo } from "@/lib/mongo";

function ymd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST() {
  const [nb_users, nb_voyages, nb_medias] = await Promise.all([
    prisma.user.count(),
    prisma.voyage.count(),
    prisma.media.count(),
  ]);
  const db = await getMongo();
  await db.collection("stats_snapshots").updateOne(
    { date: ymd() },
    { $set: { date: ymd(), nb_users, nb_voyages, nb_medias, computed_at: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
