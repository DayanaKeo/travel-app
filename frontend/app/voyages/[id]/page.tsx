import Link from "next/link";
import Image from "next/image";
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MapPinned, CalendarDays, PlusSquareIcon, Edit3, Eye, EyeOff, Clock } from "lucide-react";
import SharePanel from "./SharePanel";
import EtapesChronoMap from "./EtapesChronoMap";

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

// Utilitaires
function safeJson(res: Response) {
  return res.json().catch(() => null);
}
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const plural = (n: number, s: string, p = s + "s") => `${n} ${n > 1 ? p : s}`;

export default async function VoyageDetailPage({ params }: { params: { id: string } }) {
  // ✅ params n'est pas une Promise dans l'App Router
  const voyageId = Number(params.id);
  if (!Number.isInteger(voyageId) || voyageId <= 0) notFound();

  // ✅ cookies()/headers() ne sont pas async
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`).join("; ");

  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host") ?? process.env.NEXT_PUBLIC_APP_URL ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (forwardedHost.includes("localhost") ? "http" : "https");
  const base = forwardedHost.startsWith("http") ? forwardedHost : `${proto}://${forwardedHost}`;

  const auth = h.get("authorization") ?? undefined;
  const commonHeaders: HeadersInit = auth
    ? { cookie: cookieHeader, authorization: auth }
    : { cookie: cookieHeader };

  // ✅ pas de cache, cookies forwardés
  const [voyageRes, etapesRes] = await Promise.all([
    fetch(`${base}/api/voyages/${voyageId}`, { cache: "no-store", headers: commonHeaders }),
    fetch(`${base}/api/etapes?voyageId=${voyageId}&order=asc`, { cache: "no-store", headers: commonHeaders }),
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

  const dateRange = `${fmtDate(voyage.dateDebut)} → ${fmtDate(voyage.dateFin)}`;
  const msPerDay = 24 * 60 * 60 * 1000;
  const durationDays = Math.max(
    1,
    Math.round((new Date(voyage.dateFin).getTime() - new Date(voyage.dateDebut).getTime()) / msPerDay) + 1
  );

  const cover =
    typeof voyage.image === "string" && /^https?:\/\//i.test(voyage.image.trim())
      ? voyage.image.trim()
      : null;

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ===== COVER ===== */}
        {cover ? (
          <section className="relative h-56 sm:h-80 overflow-hidden rounded-2xl border border-orange-100 shadow">
            <Image
              src={cover}
              alt={voyage.titre}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 960px"
              className="object-cover"
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
                  <MapPinned className="h-4 w-4" /> {plural(etapes.length, "étape")}
                </span>
              </p>
            </div>
          </section>
        ) : (
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#E63946]">{voyage.titre}</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <CalendarDays size={16} /> {dateRange}
                <span className="ml-3 inline-flex items-center gap-1">
                  <MapPinned size={16} /> {plural(etapes.length, "étape")}
                </span>
              </p>
            </div>
            <span className="text-xs bg-white border border-orange-200 text-gray-700 px-2 py-1 rounded-full h-fit inline-flex items-center gap-1.5">
              {voyage.isPublic ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-500" />}
              {voyage.isPublic ? "Public" : "Privé"}
            </span>
          </header>
        )}

        {/* ===== BARRE STICKY (responsive) ===== */}
        <div className="sticky top-2 sm:top-3 z-10">
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-orange-100 shadow p-2.5 sm:p-3">
            <div
              role="toolbar"
              aria-label="Actions du voyage"
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Zone actions principales (mobile : icônes à côté) */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/voyages/${voyageId}/share`}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 text-sm font-medium shadow-sm"
                >
                  Partager
                </Link>

                {/* Icônes d’action en mobile uniquement */}
                <Link
                  href={`/etapes/new?voyageId=${voyageId}`}
                  className="sm:hidden inline-flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white p-2 shadow-sm"
                  aria-label="Ajouter une étape"
                  title="Ajouter une étape"
                >
                  <PlusSquareIcon className="h-5 w-5" />
                </Link>
                <Link
                  href={`/voyages/${voyageId}/edit`}
                  className="sm:hidden inline-flex items-center justify-center rounded-xl border border-orange-100 bg-white hover:bg-orange-50 text-[#E63946] p-2 shadow-sm"
                  aria-label="Modifier le voyage"
                  title="Modifier le voyage"
                >
                  <Edit3 className="h-5 w-5" />
                </Link>
              </div>

              {/* Stats — scroll horizontal en mobile pour éviter la casse */}
              <div
                className="min-w-0 -mx-1 sm:mx-0 overflow-x-auto"
                style={{ scrollbarWidth: "none" as any, msOverflowStyle: "none" as any }}
              >
                <div
                  className="flex items-center gap-2 sm:gap-3 px-1 sm:px-0 text-[11px] sm:text-xs text-gray-700 whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span className="hidden xs:inline">{dateRange}</span>
                    <span className="xs:hidden">{fmtDate(voyage.dateDebut)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" /> {plural(durationDays, "jour")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinned className="h-4 w-4 shrink-0" /> {plural(etapes.length, "étape")}
                  </span>
                </div>
              </div>

              {/* Boutons texte en desktop/tablette */}
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href={`/etapes/new?voyageId=${voyageId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-sm font-medium shadow-sm"
                >
                  <PlusSquareIcon className="h-4 w-4" />
                  Ajouter une étape
                </Link>
                <Link
                  href={`/voyages/${voyageId}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-orange-50 text-[#E63946] px-3 py-1.5 text-sm font-medium shadow-sm border border-orange-100"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier le voyage
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ===== DESCRIPTION ===== */}
        {voyage.description && (
          <article className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
            <h2 className="font-semibold text-[#E63946] mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{voyage.description}</p>
          </article>
        )}

        {/* ===== MAP + TIMELINE ===== */}
        <article className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
          <h2 className="font-semibold text-[#E63946] mb-3">Itinéraire & étapes</h2>
          {/* EtapesChronoMap s’adapte, prévois une min-height pour mobile */}
          <div className="min-h-64">
            <EtapesChronoMap etapes={etapes} />
          </div>
          {!etapes?.length && (
            <p className="mt-3 text-sm text-gray-500">
              Aucune étape. <Link href={`/etapes/new?voyageId=${voyageId}`} className="underline underline-offset-2">Ajouter une étape</Link>.
            </p>
          )}
        </article>

        {/* ===== INFOS ===== */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow">
            <h3 className="font-semibold text-[#E63946] mb-2">Infos</h3>
            <ul className="text-sm text-gray-700 grid gap-1.5">
              <li>Créé le : {fmtDate(voyage.createdAt)}</li>
              <li>Visibilité : {voyage.isPublic ? "Public" : "Privé"}</li>
              <li>Durée : {plural(durationDays, "jour")}</li>
              <li>Étapes : {etapes.length}</li>
            </ul>
          </div>
        </aside>

        {/* ===== PARTAGE ===== */}
        <section id="share">
          <SharePanel voyageId={voyageId} />
        </section>
      </div>
    </div>
  );
}
