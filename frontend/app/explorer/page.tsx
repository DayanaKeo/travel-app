import { headers } from "next/headers";
import ExplorerClient from "@/components/ui/ExplorerClient";

export const metadata = {
  title: "Explorer | TravelBook",
  description: "Découvrez les profils publics et les voyages partagés par la communauté.",
};

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function fetchExplorer() {
  const origin = await getOrigin();
  const res = await fetch(`${origin}/api/explorer`, { cache: "no-store" });
  if (!res.ok) {
    return { page: 1, limit: 12, total: 0, voyages: [], authors: [], error: true };
  }
  return res.json();
}

export default async function ExplorerPage() {
  const initial = await fetchExplorer();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Explorer</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Profils publics et voyages partagés par la communauté.
          </p>
        </div>
      </header>

      <ExplorerClient initial={initial} />
    </section>
  );
}
