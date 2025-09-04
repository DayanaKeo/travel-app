import { getMongo } from "./mongo";

export async function ensureMongoIndexes() {
  const db = await getMongo();

  await db.collection("feedbacks").createIndexes([
    { key: { created_at: -1 } },
    { key: { type: 1, created_at: -1 } },
    { key: { user_id: 1, created_at: -1 } },
  ]);

  await db.collection("stats_snapshots").createIndexes([
    { key: { date: 1 }, unique: true },
  ]);

  await db.collection("ia_history").createIndexes([
    { key: { user_id: 1, created_at: -1 } },
    { key: { voyage_id: 1, created_at: -1 } },
    { key: { created_at: -1 } },
  ]);

  await db.collection("audit_logs").createIndexes([
    { key: { at: -1 } },
    { key: { admin_id: 1, at: -1 } },
    { key: { action: 1, at: -1 } },
    { key: { entity: 1, entity_id: 1, at: -1 } },
  ]);

  await db.collection("usage_events").createIndexes([
    { key: { at: -1 } },
    { key: { type: 1, at: -1 } },
    { key: { user_id: 1, at: -1 } },
    // { key: { at: 1 }, expireAfterSeconds: 60*60*24*180 },
  ]);
}
