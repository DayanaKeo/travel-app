"use client";
import Link from "next/link";

export default function CommandPalette({
  open,
  onClose,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-950 border border-black/10 dark:border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 pt-3">
          <label htmlFor="palette" className="sr-only">Rechercher</label>
          <input id="palette" autoFocus placeholder="Rechercher…" className="w-full bg-transparent px-3 py-2 text-sm outline-none" />
        </div>
        <div className="px-3 pb-3">
          <div className="text-xs text-neutral-500 px-3 py-2">Raccourcis</div>
          <ul className="grid gap-1 px-1 pb-2">
            <li><Link href="/voyages/listing" onClick={onClose} className="block px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">Mes voyages</Link></li>
            <li><Link href="/explorer" onClick={onClose} className="block px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">Explorer</Link></li>
            {isAdmin && <li><Link href="/admin/dashboard" onClick={onClose} className="block px-3 py-2 rounded-xl hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-sm">Espace admin</Link></li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
