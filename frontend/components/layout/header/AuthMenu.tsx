"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import IconLogIn from "@/components/icons/IconLogIn";

/** Renvoie la 1ère chaîne non vide et non "null"/"undefined" */
function firstNonEmpty(...vals: Array<string | null | undefined>) {
  for (const v of vals) {
    const s = (v ?? "").toString().trim();
    if (s && s !== "null" && s !== "undefined") return s;
  }
  return "";
}

export default function AuthMenu() {
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated";
  const user = isAuth ? (session?.user as any) : undefined;

  // Détection admin souple
  const role = user?.role;
  const isAdmin =
    role === "admin" ||
    (Array.isArray(role) && role.includes("admin")) ||
    (typeof role === "string" && role.toLowerCase?.() === "admin");

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  // Candidats d'avatar — tout en optionnel
  const candidates = useMemo(() => {
    return [
      firstNonEmpty(user?.image),
      firstNonEmpty(user?.picture),
      firstNonEmpty(user?.profil?.avatarUrl),
      firstNonEmpty(user?.avatarUrl),
      "/avatar-placeholder.png", // fallback local garanti
    ].filter(Boolean);
  }, [user?.image, user?.picture, user?.profil?.avatarUrl, user?.avatarUrl]);

  const [idx, setIdx] = useState(0);
  const avatarSrc = candidates[Math.min(idx, candidates.length - 1)] ?? "/avatar-placeholder.png";

  // Reset index si l’utilisateur change
  useEffect(() => setIdx(0), [candidates.join("|")]);

  // Fermer au clic extérieur + focus 1er item
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => { if (open) firstItemRef.current?.focus(); }, [open]);

  if (status === "loading") {
    return <div aria-hidden className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />;
  }

  if (!isAuth) {
    return (
      <Link
        href="/auth/signin"
        className="p-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label="Se connecter"
        title="Se connecter"
      >
        <IconLogIn className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={user?.name ? `Avatar de ${user.name}` : "Avatar"}
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setIdx(i => Math.min(i + 1, candidates.length - 1))}
          className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 bg-neutral-100"
        />
        <span className="hidden sm:block text-sm">
          {user?.name || user?.email?.split("@")[0] || "Moi"}
        </span>
        {isAdmin && (
          <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Admin
          </span>
        )}
      </button>

      {open && (
        <div
          id="user-menu"
          role="menu"
          aria-label="Menu utilisateur"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl shadow-xl p-1"
        >
          <Link
            ref={firstItemRef}
            href="/profil"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            👤 Mon profil
          </Link>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              🛠️ Espace admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            role="menuitem"
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            ⎋ Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
