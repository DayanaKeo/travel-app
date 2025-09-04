import { getMongo } from "@/lib/mongo";

export async function logAdminAction(entry: {
  by: number; action: "promote" | "suspend" | "restore" | "delete"; targetUserId: number;
}) {
  const db = await getMongo();
  await db.collection("audit_logs").insertOne({
    ...entry,
    scope: "admin_users",
    at: new Date(),
  });
}
