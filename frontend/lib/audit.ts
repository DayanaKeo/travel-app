import { getMongo } from "./mongo";
import type { NextRequest } from "next/server";

export type AuditLog = {
  at: Date;
  admin_id: number;                
  action: string;
  entity: "user" | "voyage" | "media" | "share" | "system";
  entity_id?: number | string | null;
  ip?: string | null;
  ua?: string | null;
  meta?: Record<string, any>;
};

export async function logAudit(entry: AuditLog) {
  const db = await getMongo();
  await db.collection("audit_logs").insertOne(entry);
}

export async function logUsage(event: {
  at: Date;
  user_id?: number | null;
  type: string;
  meta?: Record<string, any>;
}) {
  const db = await getMongo();
  await db.collection("usage_events").insertOne(event);
}

/** Helpers orientés Next.js — remplissent at/ip/ua/admin automatiquement */
export async function logAuditFromRequest(req: NextRequest, data: Omit<AuditLog, "at" | "ip" | "ua">) {
  const ip = req.headers.get("x-forwarded-for") || (req as any).ip || null;
  const ua = req.headers.get("user-agent") || null;
  return logAudit({ ...data, at: new Date(), ip, ua });
}

export async function logUsageFromRequest(req: NextRequest, data: Omit<Parameters<typeof logUsage>[0], "at">) {
  return logUsage({ ...data, at: new Date() });
}
