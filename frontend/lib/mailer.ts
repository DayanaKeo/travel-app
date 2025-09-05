import "server-only";
import nodemailer from "nodemailer";

type MailOpts = { to: string; subject: string; html: string; text?: string };

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(
      `Missing env ${name}. Add it to your .env.local (ex: SMTP_HOST=sandbox.smtp.mailtrap.io).`
    );
  }
  return v;
}

function getTransporter() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 2525);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  console.log("SMTP_TARGET", { host, port, NODE_ENV: process.env.NODE_ENV });

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });
}

function toErrMsg(e: unknown) {
  try {
    if (!e) return "unknown";
    if (typeof e === "string") return e;
    if (e instanceof Error) return e.message;
    return JSON.stringify(e);
  } catch {
    return "unserializable_error";
  }
}

export async function sendMail({ to, subject, html, text }: MailOpts) {
  const from = process.env.MAIL_FROM || "TravelBook <no-reply@travelbook.dev>";
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log("SMTP_SENT", { messageId: info.messageId, to, subject });
    return String(info.messageId);
  } catch (error) {
    console.error("SMTP_ERROR", error);
    throw new Error(`SMTP failed: ${toErrMsg(error)}`);
  }
}
