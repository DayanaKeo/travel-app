import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative">
      {/* ===== Background global (dégradés + halos) ===== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,179,71,.25),transparent),radial-gradient(1200px_800px_at_110%_20%,rgba(255,99,132,.22),transparent),linear-gradient(to_bottom,#fff,rgba(255,255,255,.9))]" />
      </div>

      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-12 md:pt-16 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Texte */}
          <div className="grid gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-rose-100 text-orange-700 px-3 py-1 text-xs shadow-sm">
              ✨ Nouveau : Partage sécurisé 48h + PIN chiffré
            </span>

            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Votre{" "}
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Carnet de Voyage
              </span>{" "}
              numérique
            </h1>

            <p className="text-neutral-600 text-lg max-w-[560px]">
              Créez vos voyages, cartes et galeries. Partagez en toute sécurité.
              Revivez vos souvenirs, partout et sur tous vos appareils.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="px-5 py-2.5 rounded-full text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition
                           bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Ouvrir l’app
              </Link>
              <Link
                href="/explore"
                className="px-5 py-2.5 rounded-full bg-white/70 backdrop-blur border border-white/60 text-neutral-700 hover:bg-white transition
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Explorer
              </Link>
            </div>

            <ul className="text-sm text-neutral-600 grid gap-1.5 pt-1">
              <li className="flex items-center gap-2">✅ PWA + Desktop (Next.js)</li>
              <li className="flex items-center gap-2">🔒 Partage sécurisé (lien 48h + PIN)</li>
              <li className="flex items-center gap-2">🗺️ Cartes interactives (Mapbox/Leaflet)</li>
            </ul>
          </div>

          {/* Visuel glass */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-orange-400/40 via-red-400/40 to-pink-400/40 blur-2xl" />
            <div className="relative rounded-[28px] bg-white/60 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/60">
              <div className="aspect-[16/10] grid place-items-center">
                <div className="w-full h-full bg-[conic-gradient(at_0%_0%,#fafafa,white,#f7f7f7)] grid place-items-center text-neutral-400">
                  <span>📸 Aperçu de l’application</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof (cartes glassy, sans lignes) */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["+12k", "voyages créés"],
            ["98%", "partages privés"],
            ["< 2 min", "pour démarrer"],
            ["#1", "souvenirs centralisés"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-4 text-center shadow-sm hover:shadow-md transition"
            >
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {k}
              </div>
              <div className="text-xs text-neutral-600">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES (blocs colorés, pas de séparateurs) ===== */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Voyages & étapes",
              d: "Structurez vos trips avec des étapes, dates et adresses géocodées.",
              i: "🧭",
              bg: "from-orange-50 to-amber-50",
              badge: "from-orange-500 to-amber-500",
            },
            {
              t: "Galerie médias",
              d: "Classez vos photos/vidéos par voyage et par étape.",
              i: "🖼️",
              bg: "from-rose-50 to-red-50",
              badge: "from-rose-500 to-red-500",
            },
            {
              t: "Partage sécurisé",
              d: "Lien temporaire 48h + PIN chiffré (Argon2/bcrypt).",
              i: "🔒",
              bg: "from-pink-50 to-rose-50",
              badge: "from-red-500 to-pink-500",
            },
          ].map(({ t, d, i, bg, badge }) => (
            <article
              key={t}
              className={`relative rounded-3xl p-5 shadow-sm hover:shadow-md transition
                          bg-gradient-to-br ${bg} ring-1 ring-black/5`}
            >
              <div
                className={`mb-3 h-10 w-10 grid place-items-center rounded-xl text-lg text-white bg-gradient-to-br ${badge}`}
                aria-hidden
              >
                {i}
              </div>
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="text-sm text-neutral-600 mt-1">{d}</p>

              {/* halo décoratif */}
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/50 blur-3xl" />
            </article>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS (cartes colorées légères) ===== */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6 grid md:grid-cols-3 gap-6">
          {[
            ["Alicia", "Mes souvenirs sont enfin organisés. Le partage privé est top."],
            ["Benoît", "J’adore la carte interactive : parfait pour revoir l’itinéraire."],
            ["Chiara", "Upload d’avatar + galerie : simple et efficace !"],
          ].map(([name, quote]) => (
            <figure
              key={name}
              className="relative rounded-3xl p-5 shadow-sm ring-1 ring-black/5 bg-gradient-to-br from-white to-neutral-50"
            >
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-orange-200/40 to-red-200/40 blur-2xl" />
              <blockquote className="text-neutral-700 text-sm relative">{`“${quote}”`}</blockquote>
              <figcaption className="mt-3 text-xs text-neutral-500 relative">— {name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ===== CTA final (bandeau dégradé, pas de lignes) ===== */}
      <section className="pb-14">
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-lg bg-gradient-to-r from-orange-100 via-rose-100 to-white">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="grid gap-2">
                <h2 className="text-2xl font-bold">Prêt·e à partir ?</h2>
                <p className="text-neutral-700">
                  Créez votre premier voyage en quelques secondes.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Link
                  href="/app"
                  className="px-5 py-2.5 rounded-full text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition
                             bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Commencer
                </Link>
              </div>
            </div>

            {/* halos décoratifs */}
            <div aria-hidden className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-orange-300/30 blur-3xl" />
            <div aria-hidden className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-red-300/25 blur-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
