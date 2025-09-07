import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "travelbook";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongo(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,   // limite de connexions simultanées
      retryWrites: true, // sécurité sur les écritures
    });
  }

  
  await client.connect();

  db = client.db(dbName);

  if (process.env.NODE_ENV === "development") {
    await db.command({ ping: 1 });
    console.log(`✅ Connecté à MongoDB : ${dbName}`);
  }

  return db!;
}
