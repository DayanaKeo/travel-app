"use client";
import React, { useEffect, useMemo, useState } from "react";

type Stats = {
  voyages: number;
  etapes: number;
  pays: number;
  photos: number;
  videos: number;
  topPays: { country: string; count: number }[];
  monthly: { month: string; voyages: number; medias: number }[];
};

export default function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/users/stats");
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

  if (loading) return <div className="p-4 text-sm text-neutral-500">Chargement des statistiques…</div>;
  if (!stats)   return <div className="p-4 text-sm text-red-600">Impossible de charger les statistiques.</div>;

  const kpis = [
    { label: "Voyages", value: stats.voyages },
    { label: "Étapes",  value: stats.etapes },
    { label: "Pays",    value: stats.pays },
    { label: "Photos",  value: stats.photos },
  ];

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl bg-white shadow-sm p-4">
            <div className="text-sm text-neutral-500">{k.label}</div>
            <div className="text-2xl font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Chart mensuel */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-neutral-500">12 derniers mois</div>
            <div className="text-base font-medium">Voyages & médias ajoutés</div>
          </div>
          <Legend />
        </div>
        <BarChart monthly={stats.monthly} />
      </div>

      {/* Top pays */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="text-base font-medium mb-3">Top destinations (étapes)</div>
        {stats.topPays.length === 0 ? (
          <div className="text-sm text-neutral-500">Pas encore de destinations.</div>
        ) : (
          <ul className="grid gap-2">
            {stats.topPays.map((p) => (
              <li key={p.country} className="flex items-center justify-between">
                <span className="text-sm">{p.country}</span>
                <span className="text-sm text-neutral-600">{p.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Détail médias */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Vidéos</div>
          <div className="text-2xl font-semibold">{stats.videos}</div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-4">
          <div className="text-sm text-neutral-500">Photos</div>
          <div className="text-2xl font-semibold">{stats.photos}</div>
        </div>
      </div>
    </div>
  );
}

/* Légende simple */
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

/* Bar chart SVG minimaliste (responsive) */
function BarChart({ monthly }: { monthly: { month: string; voyages: number; medias: number }[] }) {
  const maxVal = Math.max(
    1,
    ...monthly.map(m => Math.max(m.voyages, m.medias))
  );

  // Taille chart
  const H = 160;
  const barW = 12;          // largeur d'une barre
  const gap = 10;           // espace inter-groupes
  const groupW = barW * 2 + 6; // deux barres par mois + espace interne
  const W = monthly.length * (groupW + gap);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={H} className="block">
        {monthly.map((m, i) => {
          const x0 = i * (groupW + gap);
          const h1 = Math.round((m.voyages / maxVal) * (H - 20));
          const h2 = Math.round((m.medias   / maxVal) * (H - 20));
          const y1 = H - h1;
          const y2 = H - h2;

          return (
            <g key={m.month} transform={`translate(${x0},0)`}>
              {/* mois */}
              <text x={groupW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
                {formatMonth(m.month)}
              </text>
              {/* voyages */}
              <rect x={0} y={y1 - 12} width={barW} height={h1} rx="3" fill="#0a0a0a" />
              {/* medias */}
              <rect x={barW + 6} y={y2 - 12} width={barW} height={h2} rx="3" fill="#ef4444" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  return `${m}/${String(y).slice(2)}`;
}
