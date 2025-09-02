import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { ChevronLeft, CalendarDays, Eye, EyeOff } from "lucide-react";

import { getVoyageSSR } from "@/app/services/voyage.server";
import EditVoyageForm from "./EditVoyageForm";

export const dynamic = "force-dynamic";

function fmt(d: string | Date) {
  return format(new Date(d), "d MMM yyyy", { locale: fr });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const voyageId = Number(id);
  if (!Number.isInteger(voyageId) || voyageId <= 0) notFound();

  const { data: v } = await getVoyageSSR(voyageId);
  if (!v) notFound();

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/voyages/${v.id}`}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour au voyage
            </Link>

            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-[#E63946]">
              Modifier le voyage
            </h1>

            <p className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {fmt(v.dateDebut)} → {fmt(v.dateFin)}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2 py-1 border border-orange-200 bg-white">
                {v.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {v.isPublic ? "Public" : "Privé"}
              </span>
            </p>
          </div>

          {v.image && (
            <div className="hidden sm:block">
              <div className="relative w-48 h-28 overflow-hidden rounded-xl border border-orange-100 shadow bg-gray-100">
                <img src={v.image} alt={v.titre} className="w-full h-full object-cover" />
              </div>
              <p className="mt-1 text-xs text-gray-500 text-center">Couverture actuelle</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-12">
        <div className="rounded-2xl bg-white border border-orange-100 shadow p-5">
          <EditVoyageForm voyage={v} />
        </div>
      </div>
    </div>
  );
}
