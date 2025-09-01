// app/voyages/[id]/page.tsx
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MapPinned, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

type Voyage = {
  id: number;
  titre: string;
  description?: string | null;
  dateDebut: string;
  dateFin: string;
  isPublic: boolean;
  image?: string | null;
  createdAt: string;
  _count?: { etapes: number };
};

type Etape = {
  id: number;
  voyageId: number;
  titre: string;
  adresse: string;
  texte: string | null;
  latitude: number;
  longitude: number;
  date: string;
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default async function VoyageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voyageId = Number(id);
  if (!Number.isInteger(voyageId) || voyageId <= 0) notFound();

  // Next 15: cookies() & headers() doivent être await
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

  // On forward aussi un éventuel Authorization (utile en dev/proxy)
  const auth = h.get("authorization") ?? undefined;
  const commonHeaders: HeadersInit = auth
    ? { cookie: cookieHeader, authorization: auth }
    : { cookie: cookieHeader };

  // URLs absolues + cookies/authorization forwardés
  const [voyageRes, etapesRes] = await Promise.all([
    fetch(`${base}/api/voyages/${voyageId}`, {
      cache: "no-store",
      headers: commonHeaders,
    }),
    fetch(`${base}/api/etapes?voyageId=${voyageId}&order=asc`, {
      cache: "no-store",
      headers: commonHeaders,
    }),
  ]);

  if (voyageRes.status === 404) notFound();

  if (!voyageRes.ok) {
    const j = await safeJson(voyageRes);
    throw new Error(j?.error || `Impossible de charger le voyage #${voyageId}`);
  }
  if (!etapesRes.ok) {
    const j = await safeJson(etapesRes);
    throw new Error(j?.error || `Impossible de charger les étapes du voyage #${voyageId}`);
  }

  const { data: voyage }: { data: Voyage } = (await voyageRes.json()) as any;
  const { data: etapes }: { data: Etape[] } = (await etapesRes.json()) as any;

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#E63946]">{voyage.titre}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <CalendarDays size={16} />
              {new Date(voyage.dateDebut).toLocaleDateString()} →{" "}
              {new Date(voyage.dateFin).toLocaleDateString()}
              <span className="ml-3 inline-flex items-center gap-1">
                <MapPinned size={16} /> {etapes.length} étape{etapes.length > 1 ? "s" : ""}
              </span>
            </p>
          </div>
          {voyage.isPublic && (
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full h-fit">
              Public
            </span>
          )}
        </header>

        {voyage.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voyage.image}
            alt={voyage.titre}
            className="w-full h-56 object-cover rounded-2xl border border-orange-100 shadow"
          />
        )}

        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {voyage.description && (
              <article className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
                <h2 className="font-semibold text-[#E63946] mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{voyage.description}</p>
              </article>
            )}

            <article className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
              <h2 className="font-semibold text-[#E63946] mb-3">Étapes</h2>
              <ul className="space-y-3">
                {etapes.map((e) => (
                  <li key={e.id} className="border border-orange-100 rounded-xl p-3">
                    <p className="font-medium text-[#E63946]">{e.titre}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(e.date).toLocaleDateString()} · {e.adresse}
                    </p>
                    {e.texte && <p className="text-sm text-gray-700 mt-1">{e.texte}</p>}
                  </li>
                ))}
                {etapes.length === 0 && (
                  <li className="text-gray-500 text-sm">Aucune étape pour le moment.</li>
                )}
              </ul>
            </article>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
              <h3 className="font-semibold text-[#E63946] mb-2">Infos</h3>
              <p className="text-sm text-gray-600">Crée le : {new Date(voyage.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">
                Visibilité: {voyage.isPublic ? "Public" : "Privé"}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
