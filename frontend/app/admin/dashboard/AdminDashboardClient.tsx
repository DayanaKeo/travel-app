"use client";

import dynamic from "next/dynamic";
import { Suspense, useId, useMemo, useState, useCallback, useEffect } from "react";
import { useMetrics } from "@/hooks/admin/useMetrics";

const UsageChart = dynamic(() => import("@/app/admin/dashboard/ui/UsageChart"), { ssr: false });
const AdminStatsOverview = dynamic(() => import("@/app/admin/dashboard/ui/AdminStatsOverview"), { ssr: false });

/* -------------------- UI helpers -------------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm text-neutral-500 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function SkeletonChart() {
  return <div className="h-[280px] sm:h-[320px] rounded-xl bg-neutral-100 animate-pulse" />;
}

function UsageChartWrapper({ source, range }: { source: "usage" | "audit"; range: 7 | 30 }) {
  const { data, isLoading } = useMetrics(source, range);
  if (isLoading || !data) return <SkeletonChart />;
  // Conteneur avec hauteur fixe pour éviter le "layout shift" en mobile
  return (
    <div className="h-[280px] sm:h-[320px]">
      <UsageChart data={data} />
    </div>
  );
}

/* -------------------- Onglets responsives -------------------- */
type TabKey = "usage7" | "audit7" | "usage30" | "audit30";
const TABS: { key: TabKey; label: string; title: string; source: "usage" | "audit"; range: 7 | 30 }[] = [
  { key: "usage7",  label: "Usage 7 j",  title: "Activité (7 jours) – usage_events",  source: "usage", range: 7  },
  { key: "audit7",  label: "Audit 7 j",  title: "Actions sensibles (7 jours) – audit_logs", source: "audit", range: 7  },
  { key: "usage30", label: "Usage 30 j", title: "Activité (30 jours) – usage_events", source: "usage", range: 30 },
  { key: "audit30", label: "Audit 30 j", title: "Actions sensibles (30 jours) – audit_logs", source: "audit", range: 30 },
];

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function AdminDashboardClient() {
  const [active, setActive] = useState<TabKey>("usage7");
  const tablistId = useId();

  // Gestion clavier pour les onglets (Accessibilité)
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = TABS.findIndex(t => t.key === active);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % TABS.length;
    if (e.key === "ArrowLeft")  nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End")  nextIndex = TABS.length - 1;
    if (nextIndex !== currentIndex) {
      e.preventDefault();
      setActive(TABS[nextIndex].key);
    }
  }, [active]);

  // Contenu unique des 4 cartes (réutilisé pour mobile/desktop)
  const cards = useMemo(() => (
    TABS.map(({ key, title, source, range }) => (
      <Section key={key} title={title}>
        <Suspense>
          <UsageChartWrapper source={source} range={range} />
        </Suspense>
      </Section>
    ))
  ), []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      {/* Résumé (déjà responsive côté composant) */}
      <AdminStatsOverview />

      {/* ===== Mobile: onglets visibles ; Desktop: masqués ===== */}
      <div
        role="tablist"
        aria-label="Graphiques d'activité"
        id={tablistId}
        className="lg:hidden -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1.5 rounded-xl border border-neutral-200 bg-white/70"
        onKeyDown={onKeyDown}
        style={{ scrollbarWidth: "none" as any, msOverflowStyle: "none" as any }}
      >
        {TABS.map((t) => {
          const selected = active === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              aria-controls={`${tablistId}-${t.key}`}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition",
                selected
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              )}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== Contenu mobile: un seul panneau actif ===== */}
      <div className="lg:hidden">
        {TABS.map(({ key, title, source, range }) => (
          <div
            key={key}
            role="tabpanel"
            id={`${tablistId}-${key}`}
            aria-labelledby={tablistId}
            hidden={active !== key}
          >
            <Section title={title}>
              <Suspense>
                <UsageChartWrapper source={source} range={range} />
              </Suspense>
            </Section>
          </div>
        ))}
      </div>

      {/* ===== Desktop: grille 2 colonnes (les 4 cartes visibles) ===== */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards}
      </div>
    </div>
  );
}
