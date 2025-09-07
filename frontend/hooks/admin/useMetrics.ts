"use client";
import useSWR from "swr";
const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function useMetrics(source: "usage" | "audit", range: 7 | 30) {
  const key = `/api/admin/metrics?source=${source}&range=${range}`;
  const { data, error, isLoading } = useSWR(key, fetcher, { refreshInterval: 30000 });
  // adapter au composant UsageChart
  return { data: data?.data as { day: string; total: number }[] | undefined, error, isLoading };
}
