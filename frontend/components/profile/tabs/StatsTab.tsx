"use client";
import React, { useEffect, useMemo, useState } from "react";

/* ----------------------- Types ----------------------- */
type Stats = {
  voyages: number;
  etapes: number;
  pays: number;
  photos: number;
  videos: number;
  topPays: { country: string; count: number }[];
  monthly: { month: string; voyages: number; medias: number }[];
};

/* ----------------------- Vue ------------------------ */
export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/users/stats", { cache: "no-store" });
        const data = await r.json();
        if (alive) setStats(data);
      } catch {
        if (alive) setStats(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!stats)   return <ErrorCard />;

  const nf = new Intl.NumberFormat("fr-FR");

  const kpis = [
    { label: "Voyages", value: nf.format(stats.voyages), hue: "from-orange-100 to-amber-100" },
    { label: "Étapes",  value: nf.format(stats.etapes),  hue: "from-rose-100 to-red-100" },
    { label: "Pays",    value: nf.format(stats.pays),    hue: "from-sky-100 to-cyan-100" },
    { label: "Photos",  value: nf.format(stats.photos),  hue: "from-violet-100 to-fuchsia-100" },
  ];

  const topMax = Math.max(1, ...stats.topPays.map(p => p.count));

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <article
            key={k.label}
            className={`rounded-2xl p-4 shadow-sm ring-1 ring-black/5 bg-gradient-to-br ${k.hue}`}
          >
            <div className="text-xs text-neutral-600">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{k.value}</div>
          </article>
        ))}
      </section>

      {/* Chart mensuel */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
        <header className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-neutral-500">12 derniers mois</p>
            <h3 className="text-base font-medium">Voyages & médias ajoutés</h3>
          </div>
          <Legend />
        </header>
        <BarChart monthly={stats.monthly} />
      </section>

      {/* Top pays */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-4">
        <h3 className="text-base font-medium mb-3">Top destinations (étapes)</h3>
        {stats.topPays.length === 0 ? (
          <p className="text-sm text-neutral-500">Pas encore de destinations.</p>
        ) : (
          <ul className="grid gap-2">
            {stats.topPays.map((p) => {
              const ratio = Math.max(0.05, p.count / topMax); // toujours visible
              return (
                <li key={p.country} className="grid gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{p.country}</span>
                    <span className="text-neutral-600">{nf.format(p.count)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      aria-hidden
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Détail médias */}
      <section className="grid grid-cols-2 gap-3">
        <DataCard title="Vidéos" value={nf.format(stats.videos)} hue="from-blue-50 to-indigo-50" />
        <DataCard title="Photos" value={nf.format(stats.photos)} hue="from-pink-50 to-rose-50" />
      </section>
    </div>
  );
}

/* -------------------- Petits composants -------------------- */

function DataCard({ title, value, hue }: { title: string; value: string | number; hue: string }) {
  return (
    <article className={`rounded-2xl p-4 shadow-sm ring-1 ring-black/5 bg-gradient-to-br ${hue}`}>
      <p className="text-sm text-neutral-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
      <div className="h-[240px] rounded-2xl bg-neutral-100 animate-pulse" />
      <div className="h-44 rounded-2xl bg-neutral-100 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
      </div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 text-red-700 p-4 text-sm">
      Impossible de charger les statistiques.
    </div>
  );
}

/* Légende */
function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="inline-flex items-center gap-1">
        <i className="inline-block w-3 h-3 rounded-sm bg-neutral-900" /> Voyages
      </span>
      <span className="inline-flex items-center gap-1">
        <i className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Médias
      </span>
    </div>
  );
}

/* -------------------- Chart SVG responsive -------------------- */

function BarChart({ monthly }: { monthly: { month: string; voyages: number; medias: number }[] }) {
  // Garde-fous pour listes vides
  if (!monthly || monthly.length === 0) {
    return (
      <div className="h-40 grid place-items-center text-sm text-neutral-500">
        Aucune donnée pour le moment.
      </div>
    );
  }

  // Échelle
  const maxVal = Math.max(1, ...monthly.map(m => Math.max(m.voyages, m.medias)));

  // Dimensions (chart responsive via viewBox)
  const H = 200;                 // hauteur totale
  const BOTTOM = 28;             // espace labels
  const TOP = 8;
  const innerH = H - BOTTOM - TOP;

  const barW = 12;               // largeur d'une barre
  const gapInGroup = 6;          // écart entre les 2 barres
  const groupW = barW * 2 + gapInGroup;
  const groupGap = 12;           // écart entre groupes
  const W = monthly.length * groupW + (monthly.length - 1) * groupGap;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block min-w-full">
        {/* Axes (légers) */}
        <line x1={0} y1={H - BOTTOM} x2={W} y2={H - BOTTOM} stroke="#e5e7eb" />
        {/* Groupes */}
        {monthly.map((m, i) => {
          const x0 = i * (groupW + groupGap);
          const h1 = (m.voyages / maxVal) * innerH;
          const h2 = (m.medias / maxVal) * innerH;
          const yBase = H - BOTTOM;

          return (
            <g key={m.month} transform={`translate(${x0},${TOP})`}>
              {/* voyages */}
              <rect
                x={0}
                y={yBase - h1 - TOP}
                width={barW}
                height={h1}
                rx={3}
                fill="#0a0a0a"
              >
                <title>{`${formatMonth(m.month)} • Voyages: ${m.voyages}`}</title>
              </rect>

              {/* médias */}
              <rect
                x={barW + gapInGroup}
                y={yBase - h2 - TOP}
                width={barW}
                height={h2}
                rx={3}
                fill="#ef4444"
              >
                <title>{`${formatMonth(m.month)} • Médias: ${m.medias}`}</title>
              </rect>

              {/* label mois */}
              <text
                x={groupW / 2}
                y={H - BOTTOM + 18 - TOP}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {formatMonth(m.month)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatMonth(key: string) {
  // "YYYY-MM" → "MM/YY"
  const [y, m] = key.split("-");
  return `${m}/${String(y).slice(2)}`;
}
