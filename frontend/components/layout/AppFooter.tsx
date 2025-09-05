"use client";

import Link from "next/link";

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        d="M18.9 3H22l-7.7 8.8L22.6 21h-6.1l-4.8-6.2L5.9 21H2.8l8.3-9.5L2.4 3h6.2l4.4 5.8L18.9 3Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconLinkedIn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.4 23.6h4.2V7.9H.4v15.7ZM8.1 23.6h4.2v-8.8c0-2.33.84-3.92 2.93-3.92 1.6 0 2.4 1.08 2.4 3.2v9.5h4.2v-10c0-4.26-2.27-6.23-5.3-6.23-2.53 0-3.63 1.4-4.25 2.38h.03V7.9H8.1v15.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconGitHub(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.07 3.29 9.36 7.86 10.88.58.1.8-.26.8-.57 0-.28-.01-1.04-.02-2.04-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.46.12-3.04 0 0 .97-.31 3.18 1.19.92-.26 1.9-.4 2.88-.4.98 0 1.96.14 2.88.4 2.2-1.5 3.17-1.19 3.17-1.19.64 1.58.24 2.75.12 3.04.75.81 1.2 1.85 1.2 3.11 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.03.78 2.09 0 1.51-.01 2.72-.01 3.09 0 .31.21.68.81.56A11.51 11.51 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
    >
      {children}
    </Link>
  );
}


export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-red-300/40 to-transparent" />

      <div className="bg-white/75 dark:bg-neutral-950/70 backdrop-blur-xl">
        <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-normal opacity-80 md:opacity-100 bg-[radial-gradient(1000px_400px_at_5%_-10%,rgba(255,179,71,.22),transparent),radial-gradient(1000px_600px_at_105%_0%,rgba(255,99,132,.18),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 md:px-6 py-12 grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2 grid gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 rounded-2xl overflow-hidden" aria-hidden>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
                <div className="absolute inset-0 opacity-35 mix-blend-overlay bg-[radial-gradient(700px_120px_at_50%_-50%,rgba(255,255,255,.9),transparent)]" />
                <div className="absolute inset-0 grid place-items-center text-white font-bold">TB</div>
              </div>
              <span className="font-semibold tracking-tight">TravelBook</span>
            </div>

            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              Le carnet de voyage moderne : créez, partagez et revivez vos aventures.
            </p>

            <div className="flex items-center gap-2 pt-1" aria-label="Réseaux sociaux">
              <Link
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ouvrir X dans un nouvel onglet"
                className="w-9 h-9 grid place-items-center rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                title="X (ex-Twitter)"
              >
                <IconX className="w-4 h-4" />
              </Link>
              <Link
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ouvrir LinkedIn dans un nouvel onglet"
                className="w-9 h-9 grid place-items-center rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                title="LinkedIn"
              >
                <IconLinkedIn className="w-4 h-4" />
              </Link>
              <Link
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ouvrir GitHub dans un nouvel onglet"
                className="w-9 h-9 grid place-items-center rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                title="GitHub"
              >
                <IconGitHub className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <nav className="grid gap-2 text-sm" aria-labelledby="footer-product">
            <span id="footer-product" className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Produit
            </span>
            <FooterLink href="/app">Application</FooterLink>
            <FooterLink href="/explore">Explorer</FooterLink>
            <FooterLink href="/pricing">Offres</FooterLink>
          </nav>

          <nav className="grid gap-2 text-sm" aria-labelledby="footer-legal">
            <span id="footer-legal" className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Légal
            </span>
            <FooterLink href="/legal/cgu">CGU</FooterLink>
            <FooterLink href="/legal/confidentialite">Confidentialité</FooterLink>
            <FooterLink href="/legal/rgpd">RGPD</FooterLink>
          </nav>

          <div className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Rester informé·e
            </span>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-stretch gap-2"
              aria-label="Inscription newsletter"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Votre email"
                className="flex-1 border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400"
                autoComplete="email"
                inputMode="email"
              />
              <button
                className="px-3 py-2 rounded-xl text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                aria-label="S’inscrire à la newsletter"
              >
                S’inscrire
              </button>
            </form>
            <p className="text-xs text-neutral-500">Pas de spam. Désinscription en 1 clic.</p>

            <a
              href="#top"
              className="justify-self-start mt-1 px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
            >
              ↑ Retour en haut
            </a>
          </div>
        </div>
      </div>

      {/* Bas de page */}
      <div className="border-t border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-5 text-xs text-neutral-600 dark:text-neutral-400 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} TravelBook.</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Made with ❤️ & Next.js</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/status" className="underline-offset-2 hover:underline">
              Status
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/legal/confidentialite" className="underline-offset-2 hover:underline">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
