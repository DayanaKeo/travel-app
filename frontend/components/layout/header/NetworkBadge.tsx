"use client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
export default function NetworkBadge() {
  const online = useOnlineStatus();
  return (
    <span
      className={cn(
        "hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px]",
        online ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
      )}
      aria-live="polite"
    >
      <span className={cn("inline-block w-2 h-2 rounded-full", online ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
      {online ? "En ligne" : "Hors-ligne"}
    </span>
  );
}
