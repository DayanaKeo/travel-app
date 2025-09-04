import "dotenv/config";
import { MongoClient } from "mongodb";

function ymd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB || "travelbook";
  if (!uri) throw new Error("MONGODB_URI manquant");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  for (const c of ["audit_logs","usage_events","stats_snapshots","feedbacks","ia_history"]) {
    try { await db.createCollection(c); } catch {}
  }

  const usage: any[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(12,0,0,0);
    d.setDate(d.getDate() - i);
    const n = Math.floor(Math.random()*8)+2; // 2..9 events / jour
    for (let k=0;k<n;k++) {
      usage.push({
        at: new Date(d.getTime() + k*15*60*1000), // toutes les 15 min
        type: ["signin","voyage.view","media.upload","share.open"][k%4],
        user_id: [1,2,3][k%3],
        meta: k%4===2 ? { count: Math.floor(Math.random()*3)+1 } : undefined
      });
    }
  }
  if (usage.length) await db.collection("usage_events").insertMany(usage);

  const audit: any[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date();
    d.setHours(10,0,0,0);
    d.setDate(d.getDate() - i);
    audit.push(
      { at: new Date(d), admin_id: 1, action: "voyage.create", entity: "voyage", entity_id: 100+i, ip: "127.0.0.1", ua: "seed", meta: { title: "Demo" } },
      { at: new Date(d.getTime()+60*60*1000), admin_id: 1, action: "user.update",   entity: "user",   entity_id: 1, ip: "127.0.0.1", ua: "seed" }
    );
  }
  if (audit.length) await db.collection("audit_logs").insertMany(audit);

  await db.collection("stats_snapshots").updateOne(
    { date: ymd() },
    { $set: { date: ymd(), nb_users: 12, nb_voyages: 7, nb_medias: 42, computed_at: new Date() } },
    { upsert: true }
  );

  await db.collection("feedbacks").insertOne({
    user_id: 1, message: "Super UX !", type: "rating", rating: 5,
    created_at: new Date(), context: { path: "/admin", ua: "seed" },
  });
  await db.collection("ia_history").insertOne({
    user_id: 1, voyage_id: null, prompt: "Idée d'étape à Lisbonne ?",
    completion: "Miradouro da Senhora do Monte au coucher du soleil.",
    provider: "openai", tokens: { prompt: 10, completion: 12, total: 22 },
    latency_ms: 320, created_at: new Date(), meta: { model: "gpt-4o-mini" },
  });

  console.log("✅ Seed Mongo terminé");
  await client.close();
}
main().catch((e)=>{ console.error(e); process.exit(1); });
