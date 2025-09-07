"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Brand from "./header/Brand";
import NavPill from "./header/NavPill";
import NetworkBadge from "./header/NetworkBadge";
import ThemeToggle from "./header/ThemeToggle";
import AuthMenu from "./header/AuthMenu";
import CommandPalette from "./header/CommandPalette";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { usePalette } from "@/hooks/usePalette";
import { usePWAInstall } from "@/hooks/usePWAInstall";

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function AppHeader() {
  const pathname = usePathname();
  const scrolled = useScrollShadow();
  const { open, setOpen } = usePalette();
  const { canInstall, promptInstall, iosTip, closeIosTip } = usePWAInstall();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const lock = mobileOpen || open;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen, open]);

  useEffect(() => {
    setMobileOpen(false);
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[999] focus:top-2 focus:left-2 px-3 py-1.5 rounded-lg bg-neutral-900 text-white">
        Aller au contenu
      </a>

      <header
        id="top"
        className={cn(
          "sticky top-0 z-50 border-b",
          "bg-white/60 dark:bg-neutral-950/40 backdrop-blur-xl",
          scrolled ? "shadow-[0_10px_30px_-12px_rgba(0,0,0,.15)]" : "shadow-none"
        )}
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden -ml-1 p-2 rounded-xl hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Ouvrir le menu"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <span className="block w-5 h-0.5 bg-neutral-900 dark:bg-neutral-100 mb-1" />
                <span className="block w-5 h-0.5 bg-neutral-900 dark:bg-neutral-100 mb-1" />
                <span className="block w-5 h-0.5 bg-neutral-900 dark:bg-neutral-100" />
              </button>
              <Brand />
            </div>

            <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Navigation principale">
              <NavPill href="/voyages/listing">Mes voyages</NavPill>
              <NavPill href="/explore">Explorer</NavPill>
            </nav>

            <div className="flex items-center gap-2">
              <NetworkBadge />

              <button
                onClick={() => setOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-neutral-200/70 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Ouvrir la palette de commande"
                title="Rechercher (⌘K)"
              >
                ⌘K <span className="hidden md:inline text-neutral-500">Rechercher</span>
              </button>

              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="hidden sm:inline-flex px-3 py-2 rounded-xl border text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  aria-label="Installer l’application"
                  title="Installer l’app"
                >
                  Installer
                </button>
              )}

              <ThemeToggle />
              <AuthMenu />
            </div>
          </div>

          {/* Mobile drawer */}
          <div
            id="mobile-menu"
            className={cn(
              "md:hidden grid gap-2 py-2 transition-all duration-200 ease-out",
              mobileOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
            )}
          >
            <NavPill href="/voyages/listing" onClick={() => setMobileOpen(false)}>Mes voyages</NavPill>
            <NavPill href="/explore" onClick={() => setMobileOpen(false)}>Explorer</NavPill>
            {canInstall && (
              <button
                onClick={promptInstall}
                className="w-full text-left px-3.5 py-2 rounded-full text-sm border hover:bg-neutral-50 dark:hover:bg-neutral-900"
                aria-label="Installer l’application"
              >
                ⬇️ Installer l’app
              </button>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={open} onClose={() => setOpen(false)} isAdmin={false} />

      {iosTip && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-end p-4 sm:place-items-center bg-black/40 backdrop-blur-sm"
          onClick={closeIosTip}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 border border-black/10 dark:border-white/10 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold">Installer sur l’écran d’accueil (iOS)</h2>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Ouvrez le menu <strong>Partager</strong> de Safari puis choisissez <strong>“Sur l’écran d’accueil”</strong>.
            </p>
            <div className="mt-3 flex justify-end">
              <button onClick={closeIosTip} className="px-3 py-1.5 rounded-lg text-sm border hover:bg-neutral-50 dark:hover:bg-neutral-900">
                J’ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
