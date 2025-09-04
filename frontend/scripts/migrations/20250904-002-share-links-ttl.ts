import { Db } from "mongodb";

export async function up(db: Db) {
  const existing = new Set((await db.listCollections().toArray()).map(c => c.name));
  if (!existing.has("share_links")) await db.createCollection("share_links");

  await db.command({
    collMod: "share_links",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["token","voyageId","ownerId","pinHash","createdAt","expiresAt","revoked"],
        properties: {
          token: { bsonType: "string", minLength: 16 },
          voyageId: { bsonType: "int" },
          ownerId: { bsonType: "int" },
          pinHash: { bsonType: "string" },
          createdAt: { bsonType: "date" },
          expiresAt: { bsonType: "date" },
          revoked: { bsonType: "bool" },
          scopes: { bsonType: ["array","null"], items: { bsonType: "string" } },
          hits: { bsonType: ["int","long","null"] }
        }
      }
    }
  }).catch(()=>{});

  // TTL index : supprime doc quand expiresAt < now
  await db.collection("share_links").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "ttl_expiresAt" }
  );

  // Unicité du token
  await db.collection("share_links").createIndex(
    { token: 1 },
    { unique: true, name: "uniq_token" }
  );
}
