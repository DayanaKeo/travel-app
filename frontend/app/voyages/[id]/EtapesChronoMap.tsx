"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";

type Etape = {
  id: number;
  titre: string;
  adresse: string;
  texte: string | null;
  latitude: number;
  longitude: number;
  date: string;
};

const SAT_URL = process.env.NEXT_PUBLIC_SAT_TILES_URL || "";
const SAT_ATTR = process.env.NEXT_PUBLIC_SAT_ATTR || "";

export default function EtapesChronoMap({ etapes }: { etapes: Etape[] }) {
  // Tri par date
  const steps = React.useMemo(
    () => [...etapes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [etapes]
  );

  const [activeIndex, setActiveIndex] = React.useState(0);

  const mapDivRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  const LRef = React.useRef<any>(null);
  const mapRef = React.useRef<any>(null);
  const baseOSMRef = React.useRef<any>(null);
  const baseSATRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const polyAllRef = React.useRef<any>(null);
  const polyDoneRef = React.useRef<any>(null);

  const totalKm = React.useMemo(() => {
    if (steps.length < 2) return "0.0";
    let meters = 0;
    for (let i = 1; i < steps.length; i++) {
      meters += haversine(
        { lat: steps[i - 1].latitude, lng: steps[i - 1].longitude },
        { lat: steps[i].latitude, lng: steps[i].longitude }
      );
    }
    return (meters / 1000).toFixed(1);
  }, [steps]);

  // ---- Init Leaflet map
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapDivRef.current || mapRef.current) return;
      const leaflet = await import("leaflet");
      if (cancelled) return;
      const L = leaflet.default ?? leaflet;
      LRef.current = L;

      const map = L.map(mapDivRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      const el = mapDivRef.current;
      const enableWheel = () => map.scrollWheelZoom.enable();
      const disableWheel = () => map.scrollWheelZoom.disable();
      el.addEventListener("mouseenter", enableWheel);
      el.addEventListener("mouseleave", disableWheel);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconAnchor: [12, 41],
        popupAnchor: [0, -28],
      });

      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      baseOSMRef.current = osm;

      if (SAT_URL) {
        baseSATRef.current = L.tileLayer(SAT_URL, {
          maxZoom: 19,
          attribution: SAT_ATTR,
        });
      }

      if (!steps.length) {
        map.setView([48.8566, 2.3522], 5);
        return;
      }

      const latlngs: [number, number][] = [];
      steps.forEach((s) => {
        const m = L.marker([s.latitude, s.longitude], { icon }).addTo(map);
        m.bindPopup(
          `<strong>${escapeHtml(s.titre)}</strong><br/>${escapeHtml(
            new Date(s.date).toLocaleDateString("fr-FR")
          )}`
        );
        markersRef.current.push(m);
        latlngs.push([s.latitude, s.longitude]);
      });

      polyAllRef.current = L.polyline(latlngs, { weight: 3, opacity: 0.35 }).addTo(map);
      polyDoneRef.current = L.polyline([], { weight: 4, opacity: 0.95, color: "#fb923c" }).addTo(map);

      map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20] });

      const first = steps[0];
      if (first) map.setView([first.latitude, first.longitude], 12, { animate: false });

      return () => {
        el.removeEventListener("mouseenter", enableWheel);
        el.removeEventListener("mouseleave", disableWheel);
      };
    })();

    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove();
        mapRef.current = null;
        markersRef.current = [];
        polyAllRef.current = null;
        polyDoneRef.current = null;
      } catch {}
    };
  }, [steps]);

  React.useEffect(() => {
    panMapToIndex(activeIndex);
  }, [activeIndex, steps]);

  function panMapToIndex(idx: number) {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !steps.length) return;
    const i = clamp(idx, 0, steps.length - 1);
    const s = steps[i];

    map.panTo([s.latitude, s.longitude], { animate: true });

    const doneLatLngs = steps.slice(0, i + 1).map((st) => [st.latitude, st.longitude]);
    if (polyDoneRef.current) polyDoneRef.current.setLatLngs(doneLatLngs);

    const marker = markersRef.current[i];
    try {
      marker?.openPopup();
    } catch {}
  }

  const onScrollRafRef = React.useRef(false);
  const handleScroll = React.useCallback(() => {
    if (onScrollRafRef.current) return;
    onScrollRafRef.current = true;
    requestAnimationFrame(() => {
      const container = listRef.current;
      if (!container) return;
      const center = container.scrollLeft + container.clientWidth / 2;

      let bestIdx = 0;
      let bestDist = Infinity;
      steps.forEach((s, i) => {
        const el = cardRefs.current.get(s.id);
        if (!el) return;
        const mid = el.offsetLeft + el.clientWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      if (bestIdx !== activeIndex) setActiveIndex(bestIdx);
      onScrollRafRef.current = false;
    });
  }, [activeIndex, steps]);

  // ---- Fonctions de navigation / focus
  function scrollToIndex(idx: number) {
    const container = listRef.current;
    const target = cardRefs.current.get(steps[idx]?.id!);
    if (!container || !target) return;
    container.scrollTo({
      left: target.offsetLeft - container.clientWidth / 2 + target.clientWidth / 2,
      behavior: "smooth",
    });
  }

  function focusIndex(idx: number, opts: { scroll?: boolean } = { scroll: true }) {
    const i = clamp(idx, 0, steps.length - 1);
    setActiveIndex(i);         // 1) MAJ état
    if (opts.scroll) scrollToIndex(i); // 2) Scroll centré
    panMapToIndex(i);          // 3) Pan immédiat + popup + polyline
  }

  function prev() { focusIndex(activeIndex - 1); }
  function next() { focusIndex(activeIndex + 1); }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, steps.length]);

  function setBase(layer: "osm" | "sat") {
    const map = mapRef.current;
    if (!map) return;
    const osm = baseOSMRef.current;
    const sat = baseSATRef.current;

    if (layer === "osm") {
      sat?.remove();
      osm?.addTo(map);
    } else {
      osm?.remove();
      sat?.addTo(map);
    }
  }

  if (!steps.length) {
    return (
      <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 text-sm text-gray-700">
        Aucune étape pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {SAT_URL && (
          <div className="absolute left-3 top-3 z-[500] flex gap-1 rounded-xl border border-orange-200 bg-white/90 p-1 shadow">
            <button
              type="button"
              onClick={() => setBase("osm")}
              className="px-2 py-1 text-xs rounded hover:bg-orange-50"
              aria-label="Basculer vers la carte OpenStreetMap"
            >
              OSM
            </button>
            <button
              type="button"
              onClick={() => setBase("sat")}
              className="px-2 py-1 text-xs rounded hover:bg-orange-50"
              aria-label="Basculer vers la vue Satellite"
            >
              Satellite
            </button>
          </div>
        )}

        <div className="absolute right-3 top-3 z-[500]">
          <button
            type="button"
            onClick={() => {
              const el = mapDivRef.current;
              if (!el) return;
              if (!document.fullscreenElement) el.requestFullscreen?.();
              else document.exitFullscreen?.();
            }}
            className="rounded-lg bg-white/90 border border-orange-200 px-2 py-1 text-xs shadow hover:bg-orange-50"
            aria-label="Basculer en plein écran"
          >
            Plein écran
          </button>
        </div>

        <div
          ref={mapDivRef}
          className="w-full h-[46vh] sm:h-[52vh] rounded-2xl border border-orange-100 overflow-hidden"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-600">
          Étape <span className="font-medium">{activeIndex + 1}</span> / {steps.length}
        </div>
        <div className="text-xs text-gray-600">
          Parcours total ≈ <span className="font-medium">{totalKm} km</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={activeIndex === 0}
            className="rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={next}
            disabled={activeIndex === steps.length - 1}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-sm"
          >
            Suivant
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="relative overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100 snap-x snap-mandatory"
        style={{ scrollBehavior: "smooth" }}
        aria-label="Timeline des étapes"
      >
        <div className="flex gap-3 pr-3">
          {steps.map((e, i) => {
            const active = i === activeIndex;
            return (
              <div
                key={e.id}
                ref={(el) => { if (el) cardRefs.current.set(e.id, el); }}
                className={`snap-center min-w-[260px] sm:min-w-[320px] max-w-[85vw] rounded-2xl border p-3 transition-all ${
                  active ? "border-orange-300 bg-white shadow" : "border-orange-100 bg-white/70 hover:bg-white"
                }`}
                onClick={() => focusIndex(i)}
                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); focusIndex(i); } }}
                role="button"
                tabIndex={0}
              >
                <p className="text-[11px] text-gray-500">
                  {new Date(e.date).toLocaleDateString("fr-FR")} · {e.adresse}
                </p>
                <p className="font-medium text-[#E63946]">{e.titre}</p>
                {e.texte && <p className="text-sm text-gray-700 mt-1 line-clamp-3">{e.texte}</p>}
                <a
                  href={`/etapes/${e.id}`}
                  className="mt-2 inline-block text-xs text-orange-700 hover:text-[#E63946] underline decoration-orange-300"
                >
                  Voir l’étape
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));
}

// distance en mètres
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dφ = toRad(b.lat - a.lat);
  const dλ = toRad(b.lng - a.lng);
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const x = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
