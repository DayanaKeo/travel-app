import { getMongo } from "./mongo";

export async function ensureMongoCollectionsAndIndexes() {
  const db = await getMongo();

  const wanted = ["audit_logs", "usage_events", "stats_snapshots", "feedbacks", "ia_history", "rate_limits"];
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  for (const name of wanted) {
    if (!existing.has(name)) await db.createCollection(name).catch(() => {});
  }

  // --- Validations (renforcent la qualité des données)
  await db.command({
    collMod: "audit_logs",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["at", "admin_id", "action", "entity"],
        properties: {
          at: { bsonType: "date" },
          admin_id: { bsonType: "int" },
          action: { bsonType: "string", minLength: 2 },
          entity: { enum: ["user", "voyage", "media", "share", "system"] },
          entity_id: { bsonType: ["int", "long", "string", "null"] },
          ip: { bsonType: ["string", "null"] },
          ua: { bsonType: ["string", "null"] },
          meta: { bsonType: ["object", "null"] }
        }
      }
    }
  }).catch(() => {});

  await db.command({
    collMod: "usage_events",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["at", "type"],
        properties: {
          at: { bsonType: "date" },
          type: { bsonType: "string", minLength: 2 }, // ex: 'signin', 'voyage.view'
          user_id: { bsonType: ["int", "null"] },
          meta: { bsonType: ["object", "null"] }
        }
      }
    }
  }).catch(() => {});

  // --- Indexes
  await db.collection("feedbacks").createIndexes([
    { key: { created_at: -1 } },
    { key: { type: 1, created_at: -1 } },
    { key: { user_id: 1, created_at: -1 } },
  ]);

  await db.collection("stats_snapshots").createIndexes([
    { key: { date: 1 }, unique: true }, // "YYYY-MM-DD"
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
    // TTL facultatif : conserve 180 jours
    // { key: { at: 1 }, expireAfterSeconds: 60 * 60 * 24 * 180 },
  ]);

  await db.collection("rate_limits").createIndexes([
    { key: { updatedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 7 },
  ]);
}

// SEED
export async function seedMongoDemoData() {
  const db = await getMongo();

  await db.collection("audit_logs").insertOne({
    at: new Date(),
    admin_id: 1,
    action: "admin.bootstrap",
    entity: "system",
    entity_id: null,
    ip: null,
    ua: "bootstrap-script",
    meta: { note: "Initial audit entry" },
  });

  await db.collection("usage_events").insertMany([
    { at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), type: "signin", user_id: 1 },
    { at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), type: "media.upload", user_id: 1, meta: { count: 3 } },
    { at: new Date(), type: "voyage.view", user_id: 1, meta: { voyageId: 10 } },
  ]);

  await db.collection("stats_snapshots").updateOne(
    { date: ymd(new Date()) },
    { $set: { date: ymd(new Date()), nb_users: 1, nb_voyages: 0, nb_medias: 0, computed_at: new Date() } },
    { upsert: true }
  );

  await db.collection("feedbacks").insertOne({
    user_id: 1,
    message: "Super UX !",
    type: "rating",
    rating: 5,
    created_at: new Date(),
    context: { path: "/", ua: "seed" },
  });

  await db.collection("ia_history").insertOne({
    user_id: 1,
    voyage_id: null,
    prompt: "Propose une légende pour cette photo de plage à Bali",
    completion: "Coucher de soleil flamboyant sur l'océan Indien 🌅",
    provider: "openai",
    tokens: { prompt: 12, completion: 14, total: 26 },
    latency_ms: 420,
    created_at: new Date(),
    meta: { model: "gpt-4o-mini" },
  });
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
