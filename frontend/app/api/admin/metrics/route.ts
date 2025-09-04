import { NextRequest, NextResponse } from "next/server";
import { getMongo } from "@/lib/mongo";
import { getToken } from "next-auth/jwt";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function ymd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.uid || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  // source = "usage" | "audit"
  const source = (searchParams.get("source") || "usage") as "usage" | "audit";
  const range = Number(searchParams.get("range") || "7"); // 7 | 30
  const col = source === "usage" ? "usage_events" : "audit_logs";

  const db = await getMongo();
  const from = startOfDay(new Date(Date.now() - (range - 1) * 24 * 3600 * 1000));

  const pipeline = [
    { $match: { at: { $gte: from } } },
    {
      $group: {
        _id: { y: { $year: "$at" }, m: { $month: "$at" }, d: { $dayOfMonth: "$at" } },
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        day: {
          $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" },
        },
        total: 1,
        _id: 0,
      },
    },
    { $sort: { day: 1 } },
  ];

  const raw = await db.collection(col).aggregate(pipeline).toArray();
  // normaliser -> [{ day: "YYYY-MM-DD", total }]
  const days: { day: string; total: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = startOfDay(new Date(Date.now() - i * 24 * 3600 * 1000));
    const key = ymd(d);
    const hit = raw.find((r) => ymd(r.day) === key);
    days.push({ day: key, total: hit?.total ?? 0 });
  }

  return NextResponse.json({ source, range, data: days });
}
