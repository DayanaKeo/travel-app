"use client";
import useSWR from "swr";
const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function useKPI() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/kpi", fetcher, {
    refreshInterval: 30000,
  });
  return { data, error, isLoading, refresh: mutate };
}
