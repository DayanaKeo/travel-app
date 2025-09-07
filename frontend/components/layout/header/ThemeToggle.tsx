"use client";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Basculer en mode clair" : "Basculer en mode sombre"}
      className="p-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      title={dark ? "Mode clair" : "Mode sombre"}
    >
      <span aria-hidden>{dark ? "🌙" : "☀️"}</span>
    </button>
  );
}
