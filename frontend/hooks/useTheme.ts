"use client";
import { useEffect, useState } from "react";

/** Simple thème light/dark. (Option: remplacer par `next-themes`) */
export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const d = stored ? stored === "dark" : prefers;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const nd = !d;
      document.documentElement.classList.toggle("dark", nd);
      localStorage.setItem("theme", nd ? "dark" : "light");
      return nd;
    });
  };
  return { dark, toggle };
}
