import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative">
      {/* ====== Background global : gradient + blobs ====== */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* grand dégradé de marque */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-rose-50 to-white" />
        {/* blobs doux */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-red-300/25 blur-3xl" />
      </div>

      {/* ====== HERO ====== */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-10 md:pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Texte */}
          <div className="grid gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50/70 px-3 py-1 text-xs text-orange-700">
              ✨ Nouveau : Partage sécurisé 48h + PIN chiffré
            </span>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Votre{" "}
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                Carnet de Voyage
              </span>{" "}
              numérique
            </h1>

            <p className="text-neutral-600 text-lg max-w-[560px]">
              Créez vos voyages, cartes et galeries. Partagez en toute sécurité. Revivez vos souvenirs, partout et sur tous vos appareils.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="px-4 py-2 rounded-full text-white shadow-sm hover:opacity-95 outline-none focus-visible:ring-2 focus-visible:ring-red-400
                           bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
              >
                Ouvrir l’app
              </Link>
              <Link
                href="/explore"
                className="px-4 py-2 rounded-full border border-neutral-200 hover:bg-neutral-50 outline-none focus-visible:ring-2 focus-visible:ring-red-400"
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

          {/* Visuel "glass" */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-400/40 via-red-400/40 to-pink-400/40 blur-2xl" />
            <div className="relative rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-xl overflow-hidden ring-1 ring-black/5">
              <div className="aspect-[16/10] grid place-items-center">
                <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 grid place-items-center text-neutral-400">
                  <span>📸 Aperçu de l’application</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau social proof */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["+12k", "voyages créés"],
            ["98%", "partages privés"],
            ["< 2 min", "pour démarrer"],
            ["#1", "souvenirs centralisés"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl bg-white/70 border border-orange-100/60 p-4 text-center shadow-sm"
            >
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {k}
              </div>
              <div className="text-xs text-neutral-600">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section className="border-t bg-neutral-50/70">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Voyages & étapes",
              d: "Structurez vos trips avec des étapes, dates et adresses géocodées.",
              i: "🧭",
              c: "from-orange-500 to-amber-500",
            },
            {
              t: "Galerie médias",
              d: "Classez vos photos/vidéos par voyage et par étape.",
              i: "🖼️",
              c: "from-rose-500 to-red-500",
            },
            {
              t: "Partage sécurisé",
              d: "Lien temporaire 48h + PIN chiffré (Argon2/bcrypt).",
              i: "🔒",
              c: "from-red-500 to-pink-500",
            },
          ].map(({ t, d, i, c }) => (
            <article
              key={t}
              className="group relative rounded-2xl bg-white shadow-sm p-5 transition-shadow hover:shadow-md border"
            >
              {/* Accent dégradé */}
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${c}`} />
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 grid place-items-center rounded-xl text-lg text-white bg-gradient-to-br ${c}`} aria-hidden>
                  {i}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{d}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 grid md:grid-cols-3 gap-6">
          {[
            ["Alicia", "Mes souvenirs sont enfin organisés. Le partage privé est top."],
            ["Benoît", "J’adore la carte interactive : parfait pour revoir l’itinéraire."],
            ["Chiara", "Upload d’avatar + galerie : simple et efficace !"],
          ].map(([name, quote]) => (
            <figure
              key={name}
              className="relative rounded-2xl border bg-neutral-50 p-5 overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-orange-200/40 to-red-200/40 blur-2xl" />
              <blockquote className="text-neutral-700 text-sm relative">{`“${quote}”`}</blockquote>
              <figcaption className="mt-3 text-xs text-neutral-500 relative">— {name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ====== CTA FINAL ====== */}
      <section className="border-t">
        <div className="relative mx-auto max-w-6xl px-4 md:px-6 py-12">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-100/60 via-rose-100/60 to-white" />
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold">Prêt·e à partir ?</h2>
              <p className="text-neutral-600">
                Créez votre premier voyage en quelques secondes.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link
                href="/app"
                className="px-5 py-2.5 rounded-full text-white shadow-sm hover:opacity-95 outline-none focus-visible:ring-2 focus-visible:ring-red-400
                           bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
