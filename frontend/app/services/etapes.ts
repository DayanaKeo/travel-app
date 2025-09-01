import { headers, cookies } from "next/headers";

type Order = "asc" | "desc";

export type Etape = {
  id: number;
  voyageId: number;
  titre: string;
  adresse: string;
  texte: string | null;
  latitude: number;
  longitude: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListEtapesResponse = { data: Etape[]; pagination: Pagination };
export type SingleEtapeResponse = { data: Etape };
export type DeleteResponse = { ok: true };

type Ctx = { baseUrl?: string };

function buildUrl(path: string, baseUrl?: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return (baseUrl ?? "") + path;
}

async function fetchJson<T>(path: string, init?: RequestInit, baseUrl?: string): Promise<T> {
  const url = buildUrl(path, baseUrl);
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.error ? JSON.stringify(j) : String(j));
    } catch {
      throw new Error(await res.text());
    }
  }
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | undefined>) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return query ? `?${query}` : "";
}

async function buildBaseAndHeaders() {
  // Next 15: cookies() & headers() sont async
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  const base =
    host ?? process.env.NEXT_PUBLIC_APP_URL
      ? `${proto}://${host ?? process.env.NEXT_PUBLIC_APP_URL}`
      : "http://localhost:3000";

  const auth = h.get("authorization") ?? undefined;
  const commonHeaders: HeadersInit = auth
    ? { cookie: cookieHeader, authorization: auth }
    : { cookie: cookieHeader };

  return { base, commonHeaders };
}

export async function getEtape(id: number): Promise<{ data: Etape | null }> {
  const { base, commonHeaders } = await buildBaseAndHeaders();

  const res = await fetch(`${base}/api/etapes/${id}`, {
    cache: "no-store",
    headers: commonHeaders,
  });

  if (res.status === 404) return { data: null };
  if (!res.ok) {
    let msg = `Impossible de charger l’étape #${id}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }

  const { data } = (await res.json()) as { data: Etape };
  return { data };
}

export async function listEtapes(
  options: { voyageId: number; order?: Order; page?: number; limit?: number; q?: string },
  ctx?: Ctx
): Promise<ListEtapesResponse> {
  const { voyageId, order = "asc", page = 1, limit = 20, q } = options;
  return fetchJson<ListEtapesResponse>(`/api/etapes${qs({ voyageId, order, page, limit, q })}`, undefined, ctx?.baseUrl);
}

// export async function getEtape(id: number, ctx?: Ctx): Promise<SingleEtapeResponse> {
//   return fetchJson<SingleEtapeResponse>(`/api/etapes/${id}`, undefined, ctx?.baseUrl);
// }

export async function createEtape(
  payload: {
    voyageId: number;
    titre: string;
    adresse: string;
    texte?: string | null;
    latitude: number | string;
    longitude: number | string;
    date: string;
  },
  ctx?: Ctx
): Promise<SingleEtapeResponse> {
  return fetchJson<SingleEtapeResponse>(
    `/api/etapes`,
    { method: "POST", body: JSON.stringify(payload) },
    ctx?.baseUrl
  );
}

export async function updateEtape(
  id: number,
  payload: Partial<{ titre: string; adresse: string; texte: string | null; latitude: number | string; longitude: number | string; date: string }>,
  ctx?: Ctx
): Promise<SingleEtapeResponse> {
  return fetchJson<SingleEtapeResponse>(
    `/api/etapes/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    ctx?.baseUrl
  );
}

export async function deleteEtape(id: number, ctx?: Ctx): Promise<DeleteResponse> {
  return fetchJson<DeleteResponse>(`/api/etapes/${id}`, { method: "DELETE" }, ctx?.baseUrl);
}
