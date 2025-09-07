"use client";
import * as React from "react";

export default function ExpireCountdown({ iso }: { iso: string }) {
  const [left, setLeft] = React.useState<number>(() => Math.max(0, new Date(iso).getTime() - Date.now()));

  React.useEffect(() => {
    const id = setInterval(() => {
      setLeft(Math.max(0, new Date(iso).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [iso]);

  const s = Math.floor(left / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      Expire dans <span className="font-mono">{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(sec).padStart(2,"0")}</span>
    </span>
  );
}
// Affiche un compte à rebours jusqu'à la date d'expiration