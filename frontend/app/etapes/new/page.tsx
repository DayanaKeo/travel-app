import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import CreateEtapeForm from "./CreateEtapeForm";

export const dynamic = "force-dynamic";

export default async function NewEtapePage({
  searchParams,
}: {
  searchParams: Promise<{ voyageId?: string }>;
}) {
  const sp = await searchParams;
  const voyageId = Number(sp?.voyageId);
  if (!Number.isInteger(voyageId) || voyageId <= 0) notFound();

  return (
    <div className="min-h-screen bg-[#fff6f1]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href={`/voyages/${voyageId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour au voyage
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        <h1 className="text-2xl font-semibold text-gray-900">Ajouter une étape</h1>
        <p className="text-sm text-gray-600 mt-1">Voyage #{voyageId}</p>

        <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <CreateEtapeForm voyageId={voyageId} />
        </div>
      </div>
    </div>
  );
}
