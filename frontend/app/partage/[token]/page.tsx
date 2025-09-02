import { cookies, headers } from "next/headers";
import ShareGate from "./ShareGate";
import ExpireCountdown from "./ExpireCountdown";

type PublicVoyage = {
  id: number;
  titre: string;
  description?: string | null;
  image?: string | null;
  dateDebut: string;
  dateFin: string;
  etapes: { id: number; titre: string; date: string; adresse: string; texte: string | null }[];
};

export const dynamic = "force-dynamic";

function shareCookieCandidates(token: string) {
  return [`share_${token}`, `share:${token}`];
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...(init || {}) });
  if (!res.ok) {
    const j = await res.json().catch(() => null as unknown);
    throw new Error((j as any)?.error || "Erreur");
  }
  return res.json() as Promise<T>;
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const envBase = process.env.NEXT_PUBLIC_APP_URL;
  const base =
    host
      ? `${proto}://${host}`
      : envBase
      ? (envBase.startsWith("http") ? envBase : `http://${envBase}`)
      : "http://localhost:3000";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
    .join("; ");
  const commonHeaders: HeadersInit = cookieHeader ? { cookie: cookieHeader } : {};

  type StatusPayload = {
    data: {
      status: "active" | "expired" | "revoked";
      titre: string;
      voyageId: number;
      hasCookie: boolean;
      expiresAt: string;
    };
  };

  const status = await fetchJson<StatusPayload>(
    `${base}/api/share-links/check?token=${encodeURIComponent(token)}`,
    { headers: commonHeaders }
  ).catch(() => null as unknown as StatusPayload);

  if (!status?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl bg-white border p-6 text-center">
          <p className="text-sm text-gray-600">Lien invalide ou introuvable.</p>
        </div>
      </div>
    );
  }

  const { status: st, hasCookie, titre, expiresAt } = status.data;

  if (st !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl bg-white border p-6 text-center">
          <p className="text-sm text-gray-600">
            {st === "revoked" ? "Ce lien a été révoqué." : "Ce lien a expiré."}
          </p>
        </div>
      </div>
    );
  }

  const localHasCookie = shareCookieCandidates(token).some((name) => cookieStore.get(name)?.value === "1");
  const canAccess = hasCookie || localHasCookie;

  if (!canAccess) {
    return (
        <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
            <h1 className="text-xl font-semibold text-[#E63946]">{titre}</h1>
            <div className="flex items-center justify-center">
                <ExpireCountdown iso={expiresAt} />
            </div>
            <ShareGate token={token} expiresAt={expiresAt} />
        </div>
        </div>
    );
    }

  let data: PublicVoyage | null = null;
  try {
    const pub = await fetchJson<{ data: PublicVoyage }>(`${base}/api/public/voyages/${token}`, {
      headers: commonHeaders,
    });
    data = pub.data;
  } catch (e: any) {
    const msg = String(e?.message || "").toLowerCase();
    if (msg.includes("pin")) {
      return (
        <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <h1 className="text-xl font-semibold text-[#E63946]">{titre}</h1>
            <ShareGate token={token} />
            <p className="text-[11px] text-gray-500 mt-2">
              Astuce : si tu viens d’entrer le PIN, recharge la page.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl bg-white border p-6 text-center">
          <p className="text-sm text-gray-600">Impossible de charger le voyage public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center">
            <ExpireCountdown iso={expiresAt} />
        </div>
        {data?.image && (
          <img
            src={data.image}
            alt={data.titre}
            className="w-full h-56 object-cover rounded-2xl border border-orange-100 shadow"
          />
        )}

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#E63946] text-center">{data?.titre}</h1>
          {data && (
            <p className="text-center text-sm text-gray-500">
              {new Date(data.dateDebut).toLocaleDateString("fr-FR")} →{" "}
              {new Date(data.dateFin).toLocaleDateString("fr-FR")}
            </p>
          )}
        </header>

        {data?.description && (
          <article className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
            <h2 className="font-semibold text-[#E63946] mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
          </article>
        )}

        <article className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
          <h2 className="font-semibold text-[#E63946] mb-3">Étapes</h2>
          {!data || data.etapes.length === 0 ? (
            <p className="text-sm text-gray-600">Aucune étape pour le moment.</p>
          ) : (
            <ol className="relative border-l-2 border-orange-200 pl-4 space-y-4">
              {data.etapes.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-[#E63946] ring-4 ring-[#FFF5F5]" />
                  <div className="block rounded-xl p-3 -ml-3">
                    <p className="text-xs text-gray-500">
                      {new Date(e.date).toLocaleDateString("fr-FR")} · {e.adresse}
                    </p>
                    <p className="font-medium text-[#E63946]">{e.titre}</p>
                    {e.texte && <p className="text-sm text-gray-700 mt-1">{e.texte}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>
    </div>
  );
}
