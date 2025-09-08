import { MongoClient } from "mongodb";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("⚠️ MONGODB_URI n'est pas défini");
}

const uri = process.env.MONGODB_URI;

client = new MongoClient(uri);
clientPromise = client.connect();

export async function getMongo() {
  return (await clientPromise).db("travelbook"); // nom de la DB
}
