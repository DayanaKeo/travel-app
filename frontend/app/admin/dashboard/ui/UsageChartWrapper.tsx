"use client";

import dynamic from "next/dynamic";

const UsageChart = dynamic(() => import("./UsageChart"), { ssr: false });

export function UsageChartWrapper({ source, range }: { source: "usage" | "audit"; range: 7 | 30 }) {
  const { useMetrics } = require("@/hooks/admin/useMetrics");
  const { data, isLoading } = useMetrics(source, range);

  if (isLoading || !data) {
    return <div className="h-[300px] rounded-2xl bg-neutral-100 animate-pulse" />;
  }
  return <UsageChart data={data} />;
}
