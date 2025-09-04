"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useMetrics } from "@/hooks/admin/useMetrics";
const UsageChart = dynamic(() => import("@/app/admin/dashboard/ui/UsageChart"), { ssr: false });
const AdminStatsOverview = dynamic(() => import("@/app/admin/dashboard/ui/AdminStatsOverview"), { ssr: false });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm text-neutral-500 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function UsageChartWrapper({ source, range }: { source: "usage" | "audit"; range: 7 | 30 }) {
  const { data, isLoading } = useMetrics(source, range);
  if (isLoading || !data) return <div className="h-[300px] rounded-2xl bg-neutral-100 animate-pulse" />;
  return <UsageChart data={data} />;
}

export default function AdminDashboardClient() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <AdminStatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Activité (7 jours) – usage_events">
          <Suspense>
            <UsageChartWrapper source="usage" range={7} />
          </Suspense>
        </Section>

        <Section title="Actions sensibles (7 jours) – audit_logs">
          <Suspense>
            <UsageChartWrapper source="audit" range={7} />
          </Suspense>
        </Section>

        <Section title="Activité (30 jours) – usage_events">
          <Suspense>
            <UsageChartWrapper source="usage" range={30} />
          </Suspense>
        </Section>

        <Section title="Actions sensibles (30 jours) – audit_logs">
          <Suspense>
            <UsageChartWrapper source="audit" range={30} />
          </Suspense>
        </Section>
      </div>
    </div>
  );
}
