import { Db } from "mongodb";

export async function up(db: Db) {
  // Assure collections
  const existing = new Set((await db.listCollections().toArray()).map(c => c.name));
  for (const name of ["audit_logs", "usage_events"]) {
    if (!existing.has(name)) await db.createCollection(name);
  }

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
          entity: { enum: ["user","voyage","media","share","system"] },
          entity_id: { bsonType: ["int","long","string","null"] },
          ip: { bsonType: ["string","null"] },
          ua: { bsonType: ["string","null"] },
          meta: { bsonType: ["object","null"] }
        }
      }
    }
  }).catch(()=>{});

  await db.command({
    collMod: "usage_events",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["at", "type"],
        properties: {
          at: { bsonType: "date" },
          type: { bsonType: "string", minLength: 2 },
          user_id: { bsonType: ["int","null"] },
          meta: { bsonType: ["object","null"] }
        }
      }
    }
  }).catch(()=>{});

  // Indexes (idempotents)
  await db.collection("audit_logs").createIndexes([
    { key: { at: -1 } },
    { key: { admin_id: 1, at: -1 } },
    { key: { action: 1, at: -1 } },
    { key: { entity: 1, entity_id: 1, at: -1 } }
  ]);

  await db.collection("usage_events").createIndexes([
    { key: { at: -1 } },
    { key: { type: 1, at: -1 } },
    { key: { user_id: 1, at: -1 } },
    { key: { at: 1 }, expireAfterSeconds: 60*60*24*180 }
  ]);
}
