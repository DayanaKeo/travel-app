import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPinned, CalendarDays, PlusSquareIcon, Edit3, Eye, EyeOff, Clock } from "lucide-react";
import SharePanel from "./SharePanel";

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

  const dateRange = `${new Date(voyage.dateDebut).toLocaleDateString()} → ${new Date(
    voyage.dateFin
  ).toLocaleDateString()}`;

  const msPerDay = 24 * 60 * 60 * 1000;
  const durationDays =
    Math.max(1, Math.round((new Date(voyage.dateFin).getTime() - new Date(voyage.dateDebut).getTime()) / msPerDay) + 1);

  const cover =
    typeof voyage.image === "string" && /^https?:\/\//i.test(voyage.image.trim()) ? voyage.image.trim() : null;

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {cover ? (
          <section className="relative w-full h-64 sm:h-80 overflow-hidden rounded-2xl border border-orange-100 shadow">
            <img
              src={cover}
              alt={voyage.titre}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-xs bg-white/90 text-gray-900 px-2 py-1 rounded-full shadow border border-orange-100">
              {voyage.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
              {voyage.isPublic ? "Public" : "Privé"}
            </span>

            <div className="absolute bottom-3 left-4 right-4">
              <h1 className="text-white text-2xl sm:text-3xl font-semibold drop-shadow">{voyage.titre}</h1>
              <p className="mt-1 text-white/90 text-sm flex flex-wrap items-center gap-3 drop-shadow">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {dateRange}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPinned className="h-4 w-4" /> {etapes.length} étape{etapes.length > 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </section>
        ) : (
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#E63946]">{voyage.titre}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <CalendarDays size={16} /> {dateRange}
                <span className="ml-3 inline-flex items-center gap-1">
                  <MapPinned size={16} /> {etapes.length} étape{etapes.length > 1 ? "s" : ""}
                </span>
              </p>
            </div>
            <span className="text-xs bg-white border border-orange-200 text-gray-700 px-2 py-1 rounded-full h-fit inline-flex items-center gap-1.5">
              {voyage.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
              {voyage.isPublic ? "Public" : "Privé"}
            </span>
          </header>
        )}

        <div className="sticky top-3 z-10">
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-orange-100 shadow px-4 py-3 flex items-center justify-between">
            <a href={`/voyages/${voyageId}/share`}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm">
              Partager
            </a>
            {/* <a href="#share" className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-orange-50 text-[#E63946] px-3 py-1.5 text-xs font-medium shadow-sm border border-orange-100">
              Partager
            </a> */}
            <div className="text-xs text-gray-600 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {dateRange}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {durationDays} jour{durationDays > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinned className="h-4 w-4" /> {etapes.length} étape{etapes.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/etapes/new?voyageId=${voyageId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-xs font-medium shadow-sm"
              >
                <PlusSquareIcon className="h-4 w-4" /> Ajouter une étape
              </a>

              <a
                href={`/voyages/${voyageId}/edit`}
                className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-orange-50 text-[#E63946] px-3 py-1.5 text-xs font-medium shadow-sm border border-orange-100"
              >
                <Edit3 className="h-4 w-4" /> Modifier le voyage
              </a>
            </div>
          </div>
        </div>

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

              {etapes.length === 0 ? (
                <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 text-sm text-gray-700">
                  Aucune étape pour le moment.
                  <Link
                    href={`/etapes/new?voyageId=${voyageId}`}
                    className="ml-2 underline decoration-orange-400 hover:text-[#E63946]"
                  >
                    Créer la première étape
                  </Link>
                  .
                </div>
              ) : (
                <ol className="relative border-l-2 border-orange-200 pl-4 space-y-4">
                  {etapes.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-[#E63946] ring-4 ring-[#FFF5F5]" />
                      <Link href={`/etapes/${e.id}`} className="block rounded-xl hover:bg-orange-50/50 p-3 -ml-3">
                        <p className="text-xs text-gray-500">
                          {new Date(e.date).toLocaleDateString()} · {e.adresse}
                        </p>
                        <p className="font-medium text-[#E63946]">{e.titre}</p>
                        {e.texte && <p className="text-sm text-gray-700 mt-1 line-clamp-3">{e.texte}</p>}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
              <h3 className="font-semibold text-[#E63946] mb-2">Infos</h3>
              <p className="text-sm text-gray-600">Créé le : {new Date(voyage.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">
                Visibilité : {voyage.isPublic ? "Public" : "Privé"}
              </p>
              <p className="text-sm text-gray-600">
                Durée : {durationDays} jour{durationDays > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-gray-600">
                Étapes : {etapes.length}
              </p>
            </div>
          </aside>
        </section>
        <section id="share" className="md:col-span-2">
          <SharePanel voyageId={voyageId} />
        </section>
      </div>
    </div>
  );
}
