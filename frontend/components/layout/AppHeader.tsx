"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

/* ---------- helpers UI ---------- */
function useScrollShadow() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}
function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }

/* ---------- command palette (lightweight) ---------- */
function usePalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mac = /Mac|iPhone|iPad/.test(navigator.platform);
      if ((mac && e.metaKey && e.key.toLowerCase()==="k") || (!mac && e.ctrlKey && e.key.toLowerCase()==="k")) {
        e.preventDefault(); setOpen((v)=>!v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

function NavPill({ href, children, onClick }:{
  href: string; children: React.ReactNode; onClick?: ()=>void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative px-3.5 py-2 rounded-full text-sm transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-red-400",
        active
          ? "text-neutral-900 bg-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,.04)]"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-1 ring-black/5 pointer-events-none"
        />
      )}
    </Link>
  );
}

/* ---------- Theme toggle (instant) ---------- */
function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const d = stored ? stored === "dark" : prefers;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  const toggle = () => {
    setDark((d)=>{
      const nd = !d;
      document.documentElement.classList.toggle("dark", nd);
      localStorage.setItem("theme", nd ? "dark" : "light");
      return nd;
    });
  };
  return { dark, toggle };
}

export default function AppHeader() {
  const { data: session } = useSession();
  const user = session?.user as any | undefined;
  const isAdmin = user?.role === "admin";
  const scrolled = useScrollShadow();
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = usePalette();
  const { dark, toggle } = useTheme();

  // close on outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <>
      {/* Skip link */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[999] focus:top-2 focus:left-2 px-3 py-1.5 rounded-lg bg-neutral-900 text-white">
        Aller au contenu
      </a>

      <header
        className={cn(
          "sticky top-0 z-50 border-b",
          "bg-white/60 dark:bg-neutral-950/40 backdrop-blur-xl",
          scrolled ? "shadow-[0_10px_30px_-12px_rgba(0,0,0,.15)]" : "shadow-none"
        )}
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="h-16 flex items-center justify-between gap-2">
            {/* Brand + burger */}
            <div className="flex items-center gap-2">
              <button
                className="md:hidden -ml-1 p-2 rounded-xl hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Menu"
                aria-expanded={mobile}
                onClick={() => setMobile(v=>!v)}
              >
                <span className="block w-5 h-0.5 bg-neutral-900 dark:bg-neutral-100 mb-1" />
                <span className="block w-5 h-0.5 bg-neutral-900 dark:bg-neutral-100 mb-1" />
                <span className="block w-5 h-0.5 bg-neutral-900 dark:bg-neutral-100" />
              </button>

              <Link href="/" className="group flex items-center gap-2 outline-none rounded-xl px-1 focus-visible:ring-2 focus-visible:ring-red-400">
                <div className="relative w-9 h-9 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
                  <div className="absolute inset-0 opacity-35 mix-blend-overlay bg-[radial-gradient(700px_120px_at_50%_-50%,rgba(255,255,255,.9),transparent)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold">TB</div>
                </div>
                <span className="font-semibold tracking-tight group-hover:translate-x-0.5 transition-transform">TravelBook</span>
              </Link>
            </div>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <NavPill href="/app">Mes voyages</NavPill>
              <NavPill href="/explore">Explorer</NavPill>
              {isAdmin && <NavPill href="/admin">Admin</NavPill>}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={()=>setOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-neutral-200/70 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Ouvrir la palette de commande"
                title="Rechercher (⌘K)"
              >
                ⌘K <span className="hidden md:inline text-neutral-500">Rechercher</span>
              </button>

              <button
                onClick={toggle}
                aria-label="Changer de thème"
                className="p-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                title={dark ? "Mode clair" : "Mode sombre"}
              >
                {dark ? "🌙" : "☀️"}
              </button>

              {!session ? (
                <button
                  onClick={() => signIn()}
                  className="px-3.5 py-2 text-sm rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                >
                  Se connecter
                </button>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={()=>setMenuOpen(v=>!v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <img
                      src={user?.image || user?.profil?.avatarUrl || "/avatar-placeholder.png"}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10"
                    />
                    <span className="hidden sm:block text-sm">{user?.name || user?.email?.split("@")[0] || "Moi"}</span>
                    {isAdmin && <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Admin</span>}
                  </button>

                  {menuOpen && (
                    <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl shadow-xl p-1">
                      <Link href="/profil" onClick={()=>setMenuOpen(false)} role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">
                        👤 Mon profil
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={()=>setMenuOpen(false)} role="menuitem"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">
                          🛠️ Espace admin
                        </Link>
                      )}
                      <button onClick={()=>signOut()} role="menuitem"
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm text-red-600">
                        ⎋ Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* mobile drawer */}
          <div
            className={cn(
              "md:hidden grid gap-2 py-2 transition-all duration-200 ease-out motion-reduce:transition-none",
              mobile ? "max-h-44 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
            )}
          >
            <NavPill href="/app" onClick={()=>setMobile(false)}>Mes voyages</NavPill>
            <NavPill href="/explore" onClick={()=>setMobile(false)}>Explorer</NavPill>
            {isAdmin && <NavPill href="/admin" onClick={()=>setMobile(false)}>Admin</NavPill>}
          </div>
        </div>
      </header>

      {/* Command palette (ultra simple) */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={()=>setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-950 border border-black/10 dark:border-white/10 shadow-2xl"
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="px-3 pt-3">
              <input
                autoFocus
                placeholder="Rechercher…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="px-3 pb-3">
              <div className="text-xs text-neutral-500 px-3 py-2">Raccourcis</div>
              <ul className="grid gap-1 px-1 pb-2">
                <li><Link href="/app" onClick={()=>setOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">Ouvrir l’app</Link></li>
                <li><Link href="/explore" onClick={()=>setOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">Explorer</Link></li>
                {isAdmin && <li><Link href="/admin" onClick={()=>setOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">Espace admin</Link></li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
