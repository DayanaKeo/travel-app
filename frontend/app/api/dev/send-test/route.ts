import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const to = process.env.TEST_EMAIL || "dummy@local.test";
  await sendMail({
    to,
    subject: "Mailtrap OK ✔",
    html: `<p>Test Mailtrap depuis TravelBook</p>`,
    text: "Test Mailtrap depuis TravelBook",
  });
  return NextResponse.json({ ok: true });
}

export const runtime = "nodejs";
