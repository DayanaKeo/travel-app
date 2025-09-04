"use client";

import { Users, Activity, Globe2, Image as ImageIcon, TrendingUp } from "lucide-react";
import { useUserStatus } from "@/hooks/admin/useUserStatus";
import { useKPI } from "@/hooks/admin/useKPI";

function GrowthPlaceholder() {
  return (
    <div className="h-[260px] grid place-items-center rounded-2xl bg-neutral-50 text-neutral-500">
      <div className="flex flex-col items-center gap-2">
        <TrendingUp className="w-8 h-8" />
        <div className="text-sm font-medium">Graphique de croissance</div>
        <div className="text-xs">Intégration Recharts à venir</div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon, accent, foot
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: "rose" | "amber" | "sky" | "green";
  foot?: string;
}) {
  const accentMap: Record<string, string> = {
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className="rounded-2xl p-5 bg-white shadow-sm border border-neutral-200 flex items-start justify-between">
      <div>
        <div className="text-sm text-neutral-500">{label}</div>
        <div className="text-3xl font-semibold mt-1">{value}</div>
        {foot && <div className="text-xs text-emerald-600 mt-2">{foot}</div>}
      </div>
      <div className={`p-3 rounded-xl border ${accentMap[accent]}`}>{icon}</div>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${className}`} />;
}

export default function AdminStatsOverview() {
  const { data: status, isLoading: loadingStatus } = useUserStatus();
  const { data: kpi, isLoading: loadingKPI } = useKPI();

  const loading = loadingStatus || loadingKPI || !status || !kpi;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            <div className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
            <div className="h-28 rounded-2xl bg-neutral-100 animate-pulse" />
          </>
        ) : (
          <>
            <KpiCard
              label="Utilisateurs totaux"
              value={status!.total}
              icon={<Users className="w-5 h-5" />}
              accent="rose"
              foot="+12% ce mois"
            />
            <KpiCard
              label="Utilisateurs actifs"
              value={status!.active30d}
              icon={<Activity className="w-5 h-5" />}
              accent="amber"
              foot="+8% ce mois"
            />
            <KpiCard
              label="Voyages créés"
              value={kpi!.voyages}
              icon={<Globe2 className="w-5 h-5" />}
              accent="sky"
              foot="+15% ce mois"
            />
            <KpiCard
              label="Photos uploadées"
              value={kpi!.medias}
              icon={<ImageIcon className="w-5 h-5" />}
              accent="green"
              foot="+20% ce mois"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3">Croissance des utilisateurs</h2>
          <GrowthPlaceholder />
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-medium mb-3">Répartition des statuts utilisateur</h2>
          {loading ? (
            <div className="h-[260px] rounded-2xl bg-neutral-100 animate-pulse" />
          ) : (
            <div className="h-[260px] flex items-center">
              <ul className="w-full text-sm space-y-4">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dot className="bg-green-500" /> <span>Actifs</span>
                  </span>
                  <span className="text-neutral-700">{status!.active30d}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dot className="bg-neutral-500" /> <span>Inactifs</span>
                  </span>
                  <span className="text-neutral-700">{status!.inactive30d}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Dot className="bg-red-500" /> <span>Suspendus</span>
                  </span>
                  <span className="text-neutral-700">{status!.suspended}</span>
                </li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
