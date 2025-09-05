"use client";
import Link from "next/link";

export default function Brand() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2 outline-none rounded-xl px-1 focus-visible:ring-2 focus-visible:ring-red-400"
    >
      <span className="sr-only">Accueil TravelBook</span>
      <div className="relative w-9 h-9 rounded-2xl overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
        <div className="absolute inset-0 opacity-35 mix-blend-overlay bg-[radial-gradient(700px_120px_at_50%_-50%,rgba(255,255,255,.9),transparent)]" />
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold">TB</div>
      </div>
      <span className="font-semibold tracking-tight group-hover:translate-x-0.5 transition-transform">
        TravelBook
      </span>
    </Link>
  );
}
