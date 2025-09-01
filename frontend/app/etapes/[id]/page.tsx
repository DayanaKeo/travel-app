import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ChevronLeft, Edit3 } from "lucide-react";
import { getEtape } from "@/app/services/etapes";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { notFound } from "next/navigation";

function fmt(d: string | Date) {
  return format(new Date(d), "d MMM yyyy", { locale: fr });
}

export default async function EtapeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const etapeId = Number(id);
  if (!Number.isInteger(etapeId) || etapeId <= 0) notFound();

  const { data: e } = await getEtape(etapeId);
  if (!e) notFound();

  return (
    <div className="min-h-screen bg-[#fff6f1]">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href={`/voyages/${e.voyageId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" /> Retour au voyage
        </Link>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-12">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{e.titre}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {e.adresse}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {fmt(e.date)}
              </span>
            </div>
          </div>

          <Link
            href={`/etapes/${e.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            <Edit3 className="h-4 w-4" /> Modifier
          </Link>
        </header>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={"/images/placeholder-etape.jpg"}
              alt={e.titre}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Notes personnelles</h3>
              <p className="text-sm text-gray-700">{e.texte ?? "—"}</p>
            </div>

            <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">Coordonnées</h3>
              <p className="text-sm text-gray-700">
                Latitude: <span className="font-mono">{e.latitude}</span>
                <br />
                Longitude: <span className="font-mono">{e.longitude}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-indigo-50 text-indigo-900 border border-indigo-100 p-5">
          <h4 className="font-semibold mb-2">Suggestions IA</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Monument emblématique construit pour l’Exposition universelle de 1889</li>
            <li>Hauteur de 330 mètres</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
