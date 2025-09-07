"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Globe2, MapPin, Share2, CalendarDays, Eye, MapPinned } from "lucide-react";

type Item = {
  id: number;
  titre: string;
  description?: string | null;
  dateDebut: string;
  dateFin: string;
  isPublic: boolean;
  etapesCount: number;
  isShared: boolean;
  coverUrl: string | null;
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1280&auto=format&fit=crop";

export default function VoyagesListingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/voyages/listing", { cache: "no-store" });
      if (res.ok) {
        const { items } = await res.json();
        setItems(items);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((v) => {
      const inSearch =
        !q ||
        v.titre.toLowerCase().includes(q.toLowerCase()) ||
        (v.description ?? "").toLowerCase().includes(q.toLowerCase());
      const inFilter = filter === "all" ? true : filter === "public" ? v.isPublic : !v.isPublic;
      return inSearch && inFilter;
    });
  }, [items, q, filter]);

  const total = items.length;
  const shared = items.filter((i) => i.isShared).length;

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex-col items-center justify-center gap-3 md:flex-row md:gap-6  flex md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#E63946]">Mes Carnets de Voyage</h1>
            <p className="text-sm text-gray-500">
              {total} voyage{total > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/voyages/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl shadow hover:opacity-90 transition"
          >
            <Plus size={18} /> Nouveau Voyage
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              className="w-full rounded-xl border border-orange-200 bg-white/70 px-4 py-3 outline-none focus:ring-2 focus:ring-[#E63946]"
              placeholder="Rechercher un voyage…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Globe2 className="absolute right-3 top-3.5 opacity-50" size={20} />
          </div>
          <select
            className="rounded-xl border border-orange-200 bg-white/70 px-3 py-3 outline-none focus:ring-2 focus:ring-[#E63946]"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="public">Publics</option>
            <option value="private">Privés</option>
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <StatCard icon={<Globe2 />} label="Total voyages" value={total} />
          <StatCard icon={<MapPin />} label="Pays visités" value={Math.max(1, Math.min(12, total))} />
          <StatCard icon={<Share2 />} label="Partagés" value={shared} />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => (
            <article
              key={v.id}
              role="button"
              tabIndex={0}
              aria-label={`Ouvrir le voyage ${v.titre}`}
              onClick={() => router.push(`/voyages/${v.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/voyages/${v.id}`);
                }
              }}
              className="rounded-2xl overflow-hidden bg-white shadow border border-orange-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E63946] hover:shadow-md transition"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.coverUrl || FALLBACK_COVER}
                  alt={v.titre}
                  className="h-40 w-full object-cover"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  {v.isPublic && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Public</span>
                  )}
                  {v.isShared && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Partagé</span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-[#E63946]">{v.titre}</h3>
                {v.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{v.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={14} />
                    {new Date(v.dateDebut).toLocaleDateString()} → {new Date(v.dateFin).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinned size={14} /> {v.etapesCount} étape{v.etapesCount > 1 ? "s" : ""}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    <Eye size={14} /> 0
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-16">Aucun voyage ne correspond à la recherche.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow p-5 border border-orange-100">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#E63946] grid place-items-center">{icon}</div>
    </div>
  );
}
