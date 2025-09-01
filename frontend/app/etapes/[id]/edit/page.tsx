import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getEtape } from "@/app/services/etapes";
import EditEtapeForm from "./EditEtapeForm";

export const dynamic = "force-dynamic";

export default async function EditEtapePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // Next 15: params est un Promise
  const etapeId = Number(id);
  if (!Number.isInteger(etapeId) || etapeId <= 0) notFound();

  const { data: e } = await getEtape(etapeId);
  if (!e) notFound();

  return (
    <div className="min-h-screen bg-[#fff6f1]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href={`/etapes/${e.id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour au détail
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12">
        <h1 className="text-2xl font-semibold text-gray-900">Modifier l’étape</h1>
        <p className="text-sm text-gray-600 mt-1">
          Voyage #{e.voyageId} — <span className="font-medium">{e.titre}</span>
        </p>

        <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <EditEtapeForm etape={e} voyageId={e.voyageId} />
        </div>
      </div>
    </div>
  );
}
