import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MongoClient, Db } from "mongodb";

type Migration = { id: string; up: (db: Db) => Promise<void> };

async function getDb(): Promise<{ db: Db; client: MongoClient }> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "travelbook";
  if (!uri) throw new Error("MONGODB_URI manquant");

  const client = new MongoClient(uri, { maxPoolSize: 5 });
  await client.connect();
  return { db: client.db(dbName), client };
}

async function loadMigrations(dir: string): Promise<Migration[]> {
  const absDir = path.resolve(dir); // => C:\...\scripts\migrations (Windows OK)
  if (!fs.existsSync(absDir)) return [];

  const files = fs
    .readdirSync(absDir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
    .sort(); // ex: 20250904-001-xxx.ts

  const migrations: Migration[] = [];
  for (const file of files) {
    const absFile = path.join(absDir, file);
    const fileUrl = pathToFileURL(absFile).href;
    const mod = await import(fileUrl);
    if (typeof mod.up !== "function") {
      console.warn(`↷ skip ${file} (pas d'export up)`);
      continue;
    }
    migrations.push({ id: file, up: mod.up });
  }
  return migrations;
}

async function main() {
  const { db, client } = await getDb();
  try {
    await db.createCollection("migrations").catch(() => {});
    const appliedIds = new Set(
      (await db.collection("migrations").find().toArray()).map((d) => d.id)
    );

    const migrations = await loadMigrations("scripts/migrations");
    for (const m of migrations) {
      if (appliedIds.has(m.id)) {
        console.log(`↷ skip ${m.id}`);
        continue;
      }
      console.log(`▶ up ${m.id}`);
      await m.up(db);
      await db.collection("migrations").insertOne({ id: m.id, appliedAt: new Date() });
      console.log(`✔ done ${m.id}`);
    }

    console.log("✅ migrations terminées");
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
