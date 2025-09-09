"use client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // empêche la pré-rendu SSG
export const revalidate = 0;            // pas de cache
export const runtime = "nodejs";  

type Role = "admin" | "user" | undefined;

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  const role: Role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session || role !== "admin") redirect("/app");
  return session;
}

async function getStats() {
  return {
    users: 128,
    voyages: 342,
    medias: 12984,
    lastSignup: new Date().toISOString(),
    growth: [12,18,10,22,28,31,30,26,33,38,41,45], // fake
    topCountries: [
      { country: "France", count: 523 },
      { country: "Espagne", count: 311 },
      { country: "Italie", count: 210 },
    ],
    latestUsers: [
      { id: 1, email: "alice@example.com", createdAt: new Date().toISOString() },
      { id: 2, email: "bob@example.com", createdAt: new Date().toISOString() },
    ],
  };
}

export default async function AdminPage() {
  await getAdminSession();
  const stats = await getStats();
  const lastSignupFR = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stats.lastSignup));

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin — Dashboard</h1>
          <p className="text-sm text-neutral-600">Vue d’ensemble de la plateforme</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">Mode admin</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Utilisateurs" value={stats.users} emoji="👥" />
        <KpiCard label="Voyages" value={stats.voyages} emoji="🧭" />
        <KpiCard label="Médias" value={stats.medias} emoji="🖼️" />
        <KpiCard label="Dernière inscription" value={lastSignupFR} emoji="⏱️" />
      </div>

      {/* Growth mini-chart */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-medium">Croissance (inscriptions mensuelles)</div>
          <span className="text-xs text-neutral-500">12 derniers mois</span>
        </div>
        <MiniArea data={stats.growth} />
      </div>

      {/* Top pays */}
      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="text-base font-medium mb-3">Top pays</div>
        <ul className="grid md:grid-cols-3 gap-3">
          {stats.topCountries.map((c) => (
            <li key={c.country} className="rounded-xl border p-4 flex items-center justify-between">
              <span className="text-sm">{c.country}</span>
              <span className="text-sm text-neutral-600">{c.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-4">
        <div className="text-base font-medium mb-3">Derniers inscrits</div>
        <div className="overflow-x-auto">
          <table className="min-w-[580px] w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-2 px-2">ID</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {stats.latestUsers.map((u) => (
                <tr key={u.id} className="bg-neutral-50 hover:bg-neutral-100/70 transition-colors">
                  <td className="py-2 px-2 rounded-l-lg">{u.id}</td>
                  <td className="py-2 px-2">{u.email}</td>
                  <td className="py-2 px-2 rounded-r-lg">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(u.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function KpiCard({ label, value, emoji }: { label: string; value: React.ReactNode; emoji: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 border border-transparent hover:border-red-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">{label}</div>
        <div className="text-lg">{emoji}</div>
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function MiniArea({ data }: { data: number[] }) {
  const W = 560, H = 120, pad = 4;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => {
    const x = pad + (i * (W - pad*2)) / (data.length - 1);
    const y = H - pad - (v / max) * (H - pad*2);
    return `${x},${y}`;
  }).join(" ");

  const path = `M ${pad},${H - pad} L ${pts} L ${W - pad},${H - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={W} height={H} className="block">
        <path d={path} fill="url(#g)" stroke="none" />
        <polyline points={pts} fill="none" stroke="#ef4444" strokeWidth="2" />
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
