"use client";
import { useEffect, useState } from "react";

export function usePalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mac = /Mac|iPhone|iPad/.test(navigator.platform);
      const k = e.key?.toLowerCase?.();
      if ((mac && e.metaKey && k === "k") || (!mac && e.ctrlKey && k === "k")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
