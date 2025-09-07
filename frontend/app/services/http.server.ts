// app/services/http.server.ts
import "server-only";
import { headers, cookies } from "next/headers";

export async function buildBaseAndHeaders() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host ?? process.env.NEXT_PUBLIC_APP_URL ?? "localhost:3000"}`;

  const auth = h.get("authorization") ?? undefined;
  const commonHeaders: HeadersInit = auth
    ? { cookie: cookieHeader, authorization: auth }
    : { cookie: cookieHeader };

  return { base, commonHeaders };
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { base, commonHeaders } = await buildBaseAndHeaders();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, { cache: "no-store", ...init, headers: { ...(init?.headers || {}), ...commonHeaders } });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j?.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
