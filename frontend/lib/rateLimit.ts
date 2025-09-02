// Anti-brute-force pour /api/share-links/verify
// 5 tentatives / 10 min -> verrou 15 min (par token + IP)

const WINDOW_SECONDS = 10 * 60;   // 10 min
const MAX_ATTEMPTS   = 5;         // 5 essais
const LOCK_SECONDS   = 15 * 60;   // 15 min

type Limiter = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<void>;
  set: (key: string, value: string, exSeconds?: number) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  del: (...keys: string[]) => Promise<void>;
  ttl: (key: string) => Promise<number>;
  exists: (key: string) => Promise<boolean>;
};

let client: Limiter;

function createMemory(): Limiter {
  const store = new Map<string, { v: string; exp: number }>();
  const now = () => Date.now();

  function cleanup(key: string) {
    const it = store.get(key);
    if (it && it.exp > 0 && it.exp < now()) store.delete(key);
  }

  return {
    async incr(key) {
      cleanup(key);
      const cur = Number((await this.get(key)) ?? "0");
      const next = cur + 1;
      store.set(key, { v: String(next), exp: store.get(key)?.exp ?? 0 });
      return next;
    },
    async expire(key, seconds) {
      cleanup(key);
      const it = store.get(key);
      if (!it) return;
      store.set(key, { v: it.v, exp: now() + seconds * 1000 });
    },
    async set(key, value, exSeconds) {
      store.set(key, { v: value, exp: exSeconds ? now() + exSeconds * 1000 : 0 });
    },
    async get(key) {
      cleanup(key);
      return store.get(key)?.v ?? null;
    },
    async del(...keys) {
      keys.forEach((k) => store.delete(k));
    },
    async ttl(key) {
      const it = store.get(key);
      if (!it || it.exp === 0) return -1;
      const ms = it.exp - now();
      return ms <= 0 ? -2 : Math.ceil(ms / 1000);
    },
    async exists(key) {
      cleanup(key);
      return store.has(key);
    },
  };
}

async function createUpstash(): Promise<Limiter | null> {
  try {
    const { Redis } = require("@upstash/redis");
    const r = Redis.fromEnv();
    return {
      async incr(key) { return await r.incr(key); },
      async expire(key, seconds) { await r.expire(key, seconds); },
      async set(key, value, exSeconds) { await r.set(key, value, { ex: exSeconds }); },
      async get(key) { return await r.get(key); },
      async del(...keys) { await r.del(...keys); },
      async ttl(key) { return await r.ttl(key); },
      async exists(key) { return (await r.exists(key)) > 0; },
    };
  } catch {
    return null;
  }
}

// init
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // @ts-ignore
  createUpstash().then((u) => (client = u ?? createMemory()));
} else {
  client = createMemory();
}

// ---- Public helpers
function keys(token: string, ip: string) {
  return {
    attempts: `share:attempts:${token}:${ip}`,
    lock: `share:lock:${token}:${ip}`,
  };
}

export async function isLocked(token: string, ip: string) {
  const { lock } = keys(token, ip);
  const ttl = await client.ttl(lock);
  return { locked: ttl > 0, retryAfter: ttl > 0 ? ttl : 0 };
}

export async function onFailAttempt(token: string, ip: string) {
  const { attempts, lock } = keys(token, ip);
  const count = await client.incr(attempts);
  if (count === 1) await client.expire(attempts, WINDOW_SECONDS);
  if (count >= MAX_ATTEMPTS) {
    await client.set(lock, "1", LOCK_SECONDS);
    return { lockedNow: true, retryAfter: LOCK_SECONDS, remaining: 0, count };
  }
  return { lockedNow: false, retryAfter: 0, remaining: Math.max(0, MAX_ATTEMPTS - count), count };
}

export async function clearRate(token: string, ip: string) {
  const { attempts, lock } = keys(token, ip);
  await client.del(attempts, lock);
}

export const RATE_CONST = { WINDOW_SECONDS, MAX_ATTEMPTS, LOCK_SECONDS };
