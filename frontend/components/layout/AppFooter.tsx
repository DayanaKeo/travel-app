"use client";
import Link from "next/link";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
    >
      {children}
    </Link>
  );
}

export default function AppFooter() {
  return (
    <footer className="border-t bg-white/70 dark:bg-neutral-950/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 grid gap-10 md:grid-cols-5">
        {/* Brand */}
        <div className="md:col-span-2 grid gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
              <div className="absolute inset-0 opacity-35 mix-blend-overlay bg-[radial-gradient(700px_120px_at_50%_-50%,rgba(255,255,255,.9),transparent)]" />
              <div className="absolute inset-0 grid place-items-center text-white font-bold">TB</div>
            </div>
            <span className="font-semibold tracking-tight">TravelBook</span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Le carnet de voyage moderne : créez, partagez et revivez vos aventures.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {/* socials (placeholders) */}
            {["✕","in","gh"].map((s)=>(
              <button key={s} className="w-8 h-8 rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 text-xs">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Produit */}
        <nav className="grid gap-2 text-sm" aria-label="Produit">
          <span className="font-medium text-neutral-800 dark:text-neutral-100">Produit</span>
          <FooterLink href="/app">Application</FooterLink>
          <FooterLink href="/explore">Explorer</FooterLink>
          <FooterLink href="/pricing">Offres</FooterLink>
        </nav>

        {/* Légal */}
        <nav className="grid gap-2 text-sm" aria-label="Légal">
          <span className="font-medium text-neutral-800 dark:text-neutral-100">Légal</span>
          <FooterLink href="/legal/cgu">CGU</FooterLink>
          <FooterLink href="/legal/confidentialite">Confidentialité</FooterLink>
          <FooterLink href="/legal/rgpd">RGPD</FooterLink>
        </nav>

        {/* CTA newsletter (factice) */}
        <div className="grid gap-2">
          <span className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">Rester informé·e</span>
          <form onSubmit={(e)=>e.preventDefault()} className="flex items-stretch gap-2">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-400"
            />
            <button className="px-3 py-2 rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
              S’inscrire
            </button>
          </form>
          <p className="text-xs text-neutral-500">Pas de spam. Désinscription en 1 clic.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="justify-self-start mt-1 px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
          >
            ↑ Retour en haut
          </button>
        </div>
      </div>

      <div className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-5 text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-3 justify-between">
          <span>© {new Date().getFullYear()} TravelBook.</span>
          <span>Made with ❤️ & Next.js</span>
        </div>
      </div>
    </footer>
  );
}
