"use client";
import { useEffect, useState } from "react";

export function useUserStats() {
  const [stats, setStats] = useState<{ voyages:number; pays:number; photos:number }|null>(null);

  useEffect(() => {
    fetch("/api/users/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats({ voyages: 0, pays: 0, photos: 0 }));
  }, []);

  return stats;
}
