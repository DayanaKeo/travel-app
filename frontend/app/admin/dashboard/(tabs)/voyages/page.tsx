import { prisma } from "@/lib/prisma";
import { CalendarDays, MapPinned, Lock, Globe2, Hash } from "lucide-react";

/* Helpers */
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const initials = (name?: string | null, fallback = "U") =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || fallback;

export default async function VoyagesPage() {
  const voyages = await prisma.voyage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { etapes: true } },
    },
    take: 50,
  });

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/70 dark:bg-neutral-950/60 backdrop-blur p-4 sm:p-5 shadow-sm">
      {/* En-tête simple (sans CTA) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold">Gestion des voyages</h2>
          <p className="text-sm text-neutral-500">
            {voyages.length} voyage{voyages.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Grille de cartes (lecture seule) */}
      {voyages.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {voyages.map((v) => (
            <article
              key={v.id}
              className="relative rounded-3xl border border-black/5 dark:border-white/10
                         bg-white/80 dark:bg-neutral-950/70 backdrop-blur
                         shadow-sm transition overflow-hidden"
            >
              {/* Bande visuelle */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,179,71,.20),transparent),radial-gradient(1200px_800px_at_110%_20%,rgba(255,99,132,.18),transparent),linear-gradient(to_bottom,#fff,rgba(255,255,255,.9))]" />
                <div className="absolute inset-0 opacity-60 bg-[conic-gradient(at_20%_10%,#ffffff,#fafafa,#f7f7f7)]" />
                {/* Badges visibilité + ID */}
                <div className="absolute left-3 top-3 flex gap-2">
                  {v.isPublic ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 text-white text-[11px] px-2 py-1 shadow">
                      <Globe2 className="h-3.5 w-3.5" /> Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 text-white text-[11px] px-2 py-1 shadow">
                      <Lock className="h-3.5 w-3.5" /> Privé
                    </span>
                  )}
                </div>
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-neutral-900/70 text-[11px] px-2 py-1 ring-1 ring-black/10 dark:ring-white/10">
                  <Hash className="h-3.5 w-3.5" /> {v.id}
                </div>
              </div>

              {/* Contenu */}
              <div className="p-4">
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#E63946] line-clamp-1">
                  {v.titre}
                </h3>
                {v.description && (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                    {v.description}
                  </p>
                )}

                {/* Métadonnées */}
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    <span>Créé le {fmtDate(v.createdAt)}</span>
                  </div>
                  {/* Si ton modèle possède dateDebut/dateFin, elles seront présentes par défaut */}
                  {"dateDebut" in v && "dateFin" in v && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        Période : {fmtDate((v as any).dateDebut)} → {fmtDate((v as any).dateFin)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPinned className="h-4 w-4" />
                    <span>
                      {v._count.etapes} étape{v._count.etapes > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Auteur (initiales) */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-200 to-rose-200 text-[11px] font-semibold text-neutral-800 ring-1 ring-black/10 dark:ring-white/10">
                    {initials(v.user?.name ?? v.user?.email?.split("@")[0])}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {v.user?.name ?? `#${v.user?.id}`}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">Auteur</p>
                  </div>
                </div>
              </div>

              {/* halo décoratif */}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl"
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid place-items-center rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 p-10 text-center">
          <p className="text-neutral-600 dark:text-neutral-300">Aucun voyage.</p>
        </div>
      )}
    </section>
  );
}
