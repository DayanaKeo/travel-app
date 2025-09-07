import { notFound } from "next/navigation";
import { getEtapeSSR } from "@/app/services/etapes.server";
import EditEtapeForm from "./EditEtapeForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const etapeId = Number(id);
  if (!Number.isInteger(etapeId) || etapeId <= 0) notFound();

  const { data: e } = await getEtapeSSR(etapeId);
  if (!e) notFound();

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/etapes/${e.id}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à l’étape
          </Link>

          <span className="text-xs text-gray-500">Voyage #{e.voyageId}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-12">
        <div className="rounded-2xl bg-white border border-orange-100 shadow p-5">
          <EditEtapeForm etape={e} voyageId={e.voyageId} />
        </div>
      </div>
    </div>
  );
}
