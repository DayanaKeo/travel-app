// app/explorer/ui/ExplorerClient.tsx
"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// --- types existants inchangés ---
type VoyageCard = {
  id: number;
  titre: string;
  description?: string | null;
  dateDebut: string;
  dateFin: string;
  image?: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    image: string | null;
    profil?: { localisation?: string | null; biographie?: string | null; avatarUrl?: string | null } | null;
  };
  _count: { etapes: number; media: number };
};

type Etape = {
  id: number;
  titre: string;
  texte?: string | null;
  latitude: string;   // Prisma Decimal → string
  longitude: string;  // Prisma Decimal → string
  adresse: string;
  date: string;
};

type ExplorerData = {
  page: number;
  limit: number;
  total: number;
  voyages: VoyageCard[];
  authors: any[];
  error?: boolean;
};

// --- Map components via dynamic import (évite SSR) ---
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Polyline     = dynamic(() => import("react-leaflet").then(m => m.Polyline), { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

// Pour éviter le warning des icônes Leaflet sous Next
import L from "leaflet";
const DefaultIcon = L.icon({
  iconUrl: "/_next/static/media/marker-icon.d577052a.png",
  iconRetinaUrl: "/_next/static/media/marker-icon.d577052a.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ExplorerClient({ initial }: { initial: ExplorerData }) {
  const [data, setData] = React.useState<ExplorerData>(initial);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<"recent" | "older" | "medias" | "etapes">("recent");
  const [loading, setLoading] = React.useState(false);

  // NEW: état pour modal + cache des étapes
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<VoyageCard | null>(null);
  const [loadingEtapes, setLoadingEtapes] = React.useState(false);
  const [etapesCache, setEtapesCache] = React.useState<Record<number, Etape[]>>({});

  async function fetchEtapes(voyageId: number) {
    if (etapesCache[voyageId]) return etapesCache[voyageId];
    setLoadingEtapes(true);
    try {
      const res = await fetch(`/api/explorer/voyage/${voyageId}`, { cache: "no-store" });
      const json = await res.json();
      const etapes: Etape[] = json?.etapes || [];
      setEtapesCache(prev => ({ ...prev, [voyageId]: etapes }));
      return etapes;
    } finally {
      setLoadingEtapes(false);
    }
  }

  function openQuickView(v: VoyageCard) {
    setSelected(v);
    setOpen(true);
    // Pré-chargement des étapes (non bloquant)
    fetchEtapes(v.id).catch(() => {});
  }
  function closeQuickView() {
    setOpen(false);
    setSelected(null);
  }

  async function load(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(p));
      params.set("limit", String(data.limit || 12));
      const res = await fetch(`/api/explorer?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  const voyagesSorted = React.useMemo(() => {
    const list = [...(data?.voyages || [])];
    switch (sort) {
      case "older":  return list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      case "medias": return list.sort((a, b) => (b._count?.media || 0)  - (a._count?.media || 0));
      case "etapes": return list.sort((a, b) => (b._count?.etapes || 0) - (a._count?.etapes || 0));
      default:       return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [data?.voyages, sort]);

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / (data?.limit || 12)));

  return (
    <div className="space-y-8">

      {/* Grille voyages (bouton Voir le voyage ouvre le modal) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {voyagesSorted.map((v) => (
          <article key={v.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
            {v.image ? (
              <img src={v.image} alt={v.titre} className="h-40 w-full object-cover transition group-hover:opacity-95" />
            ) : (
              <div className="h-40 w-full bg-neutral-100 dark:bg-neutral-800" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 font-medium tracking-tight">{v.titre}</h3>
                <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                  {v._count.media} médias
                </span>
              </div>
              {v.description && <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{v.description}</p>}
              <div className="mt-3 flex items-center gap-2">
                <img src={v.user?.profil?.avatarUrl || v.user?.image || "/avatar-placeholder.png"} className="h-7 w-7 rounded-full object-cover" alt={v.user?.name || "Auteur"} />
                <div className="min-w-0">
                  <div className="truncate text-sm">{v.user?.name || "Utilisateur"}</div>
                  <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(v.dateDebut).toLocaleDateString()} – {new Date(v.dateFin).toLocaleDateString()} · {v._count.etapes} étapes
                  </div>
                </div>
              </div>
              <button
                onClick={() => openQuickView(v)}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-1.5 text-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
              >
                Voir le voyage
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button
          className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
          onClick={() => load(Math.max(1, (data?.page || 1) - 1))}
          disabled={loading || (data?.page || 1) <= 1}
        >
          Précédent
        </button>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Page {data?.page || 1} / {totalPages}
        </span>
        <button
          className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
          onClick={() => load(Math.min(totalPages, (data?.page || 1) + 1))}
          disabled={loading || (data?.page || 1) >= totalPages}
        >
          Suivant
        </button>
      </div>

      {/* MODAL : affiche avec ETAPES + CARTE */}
      <QuickViewModal
        open={open}
        onClose={closeQuickView}
        v={selected}
        etapes={selected ? etapesCache[selected.id] : undefined}
        loadingEtapes={loadingEtapes}
        onFetchEtapes={() => selected ? fetchEtapes(selected.id) : Promise.resolve([])}
      />
    </div>
  );
}

/* ---------------- Modal d’aperçu  ---------------- */

function QuickViewModal({
  open,
  onClose,
  v,
  etapes,
  loadingEtapes,
  onFetchEtapes,
}: {
  open: boolean;
  onClose: () => void;
  v: VoyageCard | null;
  etapes?: Etape[];
  loadingEtapes: boolean;
  onFetchEtapes: () => Promise<Etape[]>;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open && v && !etapes) { onFetchEtapes().catch(() => {}); }
  }, [open, v, etapes, onFetchEtapes]);

  if (!open || !v) return null;

  // centre carte : 1) moyenne des points, 2) fallback Paris
  const points = (etapes || []).map(e => [Number(e.latitude), Number(e.longitude)] as [number, number]);
  const center: [number, number] =
    points.length
      ? [
          points.reduce((sum, p) => sum + p[0], 0) / points.length,
          points.reduce((sum, p) => sum + p[1], 0) / points.length,
        ]
      : [48.8566, 2.3522];

  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full sm:max-w-xl md:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
        {/* Cover */}
        {v.image ? <img src={v.image} alt={v.titre} className="h-40 w-full object-cover" /> : <div className="h-40 w-full bg-neutral-100 dark:bg-neutral-800" />}
        <div className="p-4">
          {/* Header */}
           <div className="sticky top-0 z-10 mb-3 flex items-start justify-between gap-3 bg-white/80 pb-2 backdrop-blur dark:bg-neutral-900/80">
            <h3 className="text-lg font-semibold leading-tight">{v.titre}</h3>
            <button onClick={onClose} className="rounded-lg border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60">
              Fermer
            </button>
          </div>
          {v.description && <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{v.description}</p>}

          {/* Auteur + dates */}
          <div className="mt-4 flex items-center gap-3">
            <img src={v.user?.profil?.avatarUrl || v.user?.image || "/avatar-placeholder.png"} className="h-9 w-9 rounded-full object-cover" alt={v.user?.name || "Auteur"} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{v.user?.name || "Utilisateur"}</div>
              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                {new Date(v.dateDebut).toLocaleDateString()} – {new Date(v.dateFin).toLocaleDateString()} · {v._count.etapes} étapes · {v._count.media} médias
              </div>
            </div>
          </div>

          {/* Carte + Étapes */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-3 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <MapContainer center={center} zoom={points.length ? 6 : 3} style={{ height: 240, width: "100%" }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {points.length > 1 && <Polyline positions={points} />}
                {etapes?.map((e, idx) => (
                  <Marker key={e.id} position={[Number(e.latitude), Number(e.longitude)]}>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-medium">{e.titre}</div>
                        <div className="text-xs text-neutral-500">
                          {new Date(e.date).toLocaleDateString()}<br />
                          {e.adresse}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="md:col-span-2">
              <h4 className="mb-2 text-sm font-medium">Étapes</h4>
              <div className="max-h-[240px] space-y-2 overflow-auto pr-1">
                {loadingEtapes && (!etapes || etapes.length === 0) && (
                  <div className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    Chargement des étapes…
                  </div>
                )}
                {!!etapes?.length
                  ? etapes.map((e, i) => (
                      <div key={e.id} className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium">{i + 1}. {e.titre}</div>
                          <div className="text-xs text-neutral-500">{new Date(e.date).toLocaleDateString()}</div>
                        </div>
                        <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{e.adresse}</div>
                      </div>
                    ))
                  : !loadingEtapes && (
                      <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        Aucune étape publiée.
                      </div>
                    )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
