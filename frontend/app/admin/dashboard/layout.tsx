import { prisma } from "@/lib/prisma";
import { getMongo } from "@/lib/mongo";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { cookies, headers } from "next/headers";
import { LineChart, Users, Globe2, MessageSquare } from "lucide-react";
import clsx from "clsx";

async function getCounts() {
  // Compteurs pour les badges d’onglets
  const [users, voyages] = await Promise.all([
    prisma.user.count(),
    prisma.voyage.count(),
  ]);
  const db = await getMongo();
  const support = await db.collection("feedbacks").countDocuments({});
  return { users, voyages, support };
}

export default async function AdminDashboardLayout({ children }: PropsWithChildren) {
  // Sécurité côté serveur (le middleware protège déjà, ceci est un plus)
  const role = ((await headers()).get("x-user-role") || "").toUpperCase();
  if (role !== "ADMIN") {
    // Simple garde : évite de rendre quoi que ce soit si pas admin
    return <div className="p-6 text-sm text-red-600">Accès administrateur requis.</div>;
  }

  const { users, voyages, support } = await getCounts();

  // Active tab
  const pathname = (await headers()).get("x-invoke-path") || ""; // Next 15
  const active = (p: string) =>
    (pathname.includes("/admin/dashboard/") && pathname.endsWith(p)) ||
    pathname.includes(`/admin/dashboard/${p}`);

  const tabs = [
    { key: "stats", label: "Statistiques", href: "/admin/dashboard/stats", icon: LineChart, count: undefined },
    { key: "users", label: `Utilisateurs (${users})`, href: "/admin/dashboard/users", icon: Users, count: users },
    { key: "voyages", label: "Voyages", href: "/admin/dashboard/voyages", icon: Globe2, count: voyages },
    { key: "support", label: "Messages support", href: "/admin/dashboard/support", icon: MessageSquare, count: support },
  ];

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tableau de bord administrateur</h1>
        <p className="text-sm text-neutral-500">Gestion et statistiques de la plateforme</p>
      </header>

      {/* Onglets */}
      <nav className="rounded-2xl bg-white/70 backdrop-blur border border-neutral-200 p-1 flex justify-center gap-2 overflow-x-auto bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(255,179,71,.25),transparent),radial-gradient(1200px_800px_at_110%_20%,rgba(255,99,132,.22),transparent),linear-gradient(to_bottom,#fff,rgba(255,255,255,.9))]">
        {tabs.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition",
              active(key)
                ? "bg-gradient-to-r from-rose-50 to-orange-50 text-rose-600 border border-rose-200"
                : "text-neutral-600 hover:bg-neutral-50"
            )}
            prefetch
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  );
}
