import { prisma } from "@/lib/prisma";

export default async function VoyagesPage() {
  const voyages = await prisma.voyage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { etapes: true } },
    },
    take: 50,
  });

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-medium mb-4">Gestion des voyages</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-neutral-500">
            <tr className="[&>th]:py-2 [&>th]:px-3 text-left">
              <th>Voyage</th>
              <th>Auteur</th>
              <th>Créé le</th>
              <th>Étapes</th>
              <th>Visibilité</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {voyages.map(v => (
              <tr key={v.id} className="[&>td]:py-2 [&>td]:px-3">
                <td>
                  <div className="font-medium">{v.titre}</div>
                  {v.description && <div className="text-neutral-500 line-clamp-1">{v.description}</div>}
                </td>
                <td>{v.user?.name ?? `#${v.user?.id}`}</td>
                <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                <td>{v._count.etapes}</td>
                <td>
                  <span className="inline-flex rounded-full bg-neutral-100 text-neutral-600 px-2 py-0.5 text-xs border border-neutral-200">
                    Privé
                  </span>
                </td>
              </tr>
            ))}
            {voyages.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-neutral-500">Aucun voyage.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
