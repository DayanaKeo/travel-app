import { getMongo } from "@/lib/mongo";

export const RATE_CONST = {
  WINDOW_SECONDS: 300,   // fenêtre tentative PIN (5 min)
  MAX_ATTEMPTS: 5,       // essais avant lock
  LOCK_SECONDS: 900,     // lock 15 min
};

type Doc = {
  _id: string;
  attempts: number;
  firstAttemptAt: Date;
  lockedUntil?: Date | null;
  updatedAt: Date;
};

function key(token: string, ip: string) {
  return `share-pin:${token}:${ip}`;
}

export async function isLocked(token: string, ip: string) {
  const db = await getMongo();
  const k = key(token, ip);
  const doc = (await db.collection<Doc>("rate_limits").findOne({ _id: k })) as Doc | null;
  const now = new Date();
  if (doc?.lockedUntil && doc.lockedUntil > now) {
    const retryAfter = Math.ceil((doc.lockedUntil.getTime() - now.getTime()) / 1000);
    return { locked: true, retryAfter };
  }
  return { locked: false, retryAfter: 0 };
}

export async function onFailAttempt(token: string, ip: string) {
  const db = await getMongo();
  const k = key(token, ip);
  const now = new Date();

  const col = db.collection<Doc>("rate_limits");
  const doc = await col.findOne({ _id: k });

  if (!doc) {
    await col.insertOne({
      _id: k, attempts: 1, firstAttemptAt: now, lockedUntil: null, updatedAt: now
    } as Doc);
    return { remaining: RATE_CONST.MAX_ATTEMPTS - 1, lockedNow: false };
  }

  // fenêtre dépassée → reset
  const windowMs = RATE_CONST.WINDOW_SECONDS * 1000;
  if (now.getTime() - doc.firstAttemptAt.getTime() > windowMs) {
    await col.updateOne({ _id: k }, { $set: {
      attempts: 1, firstAttemptAt: now, lockedUntil: null, updatedAt: now
    }});
    return { remaining: RATE_CONST.MAX_ATTEMPTS - 1, lockedNow: false };
  }

  const attempts = (doc.attempts ?? 0) + 1;
  if (attempts >= RATE_CONST.MAX_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + RATE_CONST.LOCK_SECONDS * 1000);
    await col.updateOne({ _id: k }, { $set: {
      attempts: 0, firstAttemptAt: now, lockedUntil, updatedAt: now
    }});
    return { remaining: 0, lockedNow: true };
  }

  await col.updateOne({ _id: k }, { $set: { attempts, updatedAt: now } });
  return { remaining: Math.max(0, RATE_CONST.MAX_ATTEMPTS - attempts), lockedNow: false };
}

export async function clearRate(token: string, ip: string) {
  const db = await getMongo();
  await db.collection("rate_limits").deleteOne({ id: key(token, ip) });
}
