import { headers, cookies } from "next/headers";

export type Media = {
  id: number;
  voyageId?: number | null;
  etapeId?: number | null;
  url: string;
  type: "image" | "video" | string;
  takenAt?: string | null;
  mongoRef?: string | null;
  createdAt?: string;
};


async function buildBaseAndHeaders() {
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

export async function listMediasByEtape(etapeId: number): Promise<Media[]> {
  const { base, commonHeaders } = await buildBaseAndHeaders();
  const res = await fetch(`${base}/api/medias/list?etapeId=${etapeId}`, {
    cache: "no-store",
    headers: commonHeaders,
  });
  if (!res.ok) {
    let msg = "Impossible de charger les médias";
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  const { data } = (await res.json()) as { data: Media[] };
  return data;
}

export async function uploadMedia(etapeId: number, file: File): Promise<{ data: Media }> {
  const form = new FormData();
  form.append("etapeId", String(etapeId));
  form.append("file", file);
  const res = await fetch("/api/medias", { method: "POST", body: form });
  if (!res.ok) {
    let msg = "Upload échoué";
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
