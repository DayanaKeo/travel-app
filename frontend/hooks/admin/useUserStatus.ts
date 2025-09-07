"use client";
import useSWR from "swr";
const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function useUserStatus() {
  const { data, error, isLoading } = useSWR("/api/admin/users/status", fetcher, {
    refreshInterval: 30000,
  });
  return {
    data: data as
      | { total: number; windowDays: number; cutoffISO: string; active30d: number; inactive30d: number; suspended: number }
      | undefined,
    error,
    isLoading,
  };
}
