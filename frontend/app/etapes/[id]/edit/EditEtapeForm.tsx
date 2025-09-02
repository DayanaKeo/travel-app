"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEtape, deleteEtape } from "@/app/services/etapes.client";
import { Calendar, MapPin, Save, Trash2, Loader2, FileText, MapPinned } from "lucide-react";

type Etape = {
  id: number;
  voyageId: number;
  titre: string;
  adresse: string;
  texte: string | null;
  latitude: number;
  longitude: number;
  date: string; // ISO
};

function toDateInput(d: string | Date) {
  const dd = new Date(d);
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const schema = z.object({
  titre: z.string().min(2, "2 caractères min").max(120),
  adresse: z.string().min(3, "3 caractères min").max(255),
  texte: z.string().max(2000, "2000 caractères max").optional().nullable(),
  latitude: z
    .string()
    .refine((s) => s === "" || (!Number.isNaN(Number(s)) && Number(s) >= -90 && Number(s) <= 90), {
      message: "Latitude invalide (–90 à 90)",
    })
    .optional(),
  longitude: z
    .string()
    .refine((s) => s === "" || (!Number.isNaN(Number(s)) && Number(s) >= -180 && Number(s) <= 180), {
      message: "Longitude invalide (–180 à 180)",
    })
    .optional(),
  date: z.string().min(4, "Date invalide"),
});

type FormValues = z.input<typeof schema>;

export default function EditEtapeForm({ etape, voyageId }: { etape: Etape; voyageId: number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    getValues,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titre: etape.titre,
      adresse: etape.adresse,
      texte: etape.texte ?? "",
      latitude: String(etape.latitude),
      longitude: String(etape.longitude),
      date: toDateInput(etape.date),
    },
  });

  const texteVal = watch("texte") ?? "";

  function buildPayload(initial: Etape, current: FormValues) {
    const p: any = {};
    if (current.titre !== initial.titre) p.titre = current.titre;
    if (current.adresse !== initial.adresse) p.adresse = current.adresse;
    const txt = current.texte ?? null;
    if ((initial.texte ?? "") !== (txt ?? "")) p.texte = txt;
    if (current.date && toDateInput(initial.date) !== current.date) p.date = current.date;

    const latChanged = current.latitude !== String(initial.latitude);
    const lngChanged = current.longitude !== String(initial.longitude);
    if (latChanged && current.latitude !== "") p.latitude = Number(current.latitude);
    if (lngChanged && current.longitude !== "") p.longitude = Number(current.longitude);

    return p;
  }

  async function onSubmit(values: FormValues) {
    setErr(null);
    setSubmitting(true);
    try {
      const payload = buildPayload(etape, values);
      if (Object.keys(payload).length === 0) {
        router.replace(`/etapes/${etape.id}`);
        return;
      }
      await updateEtape(etape.id, payload);
      router.replace(`/etapes/${etape.id}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Enregistrement impossible");
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!confirm("Supprimer définitivement cette étape ?")) return;
    setErr(null);
    setDeleteLoading(true);
    try {
      await deleteEtape(etape.id);
      router.replace(`/voyages/${voyageId}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Suppression impossible");
      setDeleteLoading(false);
    }
  }

  const inputBase =
    "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#E63946]">Modifier l’étape</h1>
          <p className="text-xs text-gray-500">{etape.titre} · </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.replace(`/etapes/${etape.id}`)}
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {err}
        </div>
      )}

      <section className="rounded-2xl bg-white border border-orange-100 shadow p-4">
        <h2 className="font-semibold text-[#E63946] mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Informations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre</label>
            <input {...register("titre")} className={inputBase} />
            {errors.titre && <p className="text-xs text-red-600 mt-1">{errors.titre.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <input type="date" {...register("date")} className={`${inputBase} pr-9`} />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date.message as string}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <div className="relative">
              <input {...register("adresse")} className={`${inputBase} pr-9`} />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.adresse && <p className="text-xs text-red-600 mt-1">{errors.adresse.message as string}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes personnelles</label>
            <textarea rows={5} {...register("texte")} className={inputBase} />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Conseil : garde tes souvenirs bruts 😉</span>
              <span className="text-gray-400">{(texteVal?.length ?? 0)}/2000</span>
            </div>
            {errors.texte && <p className="text-xs text-red-600 mt-1">{errors.texte.message as string}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-orange-100 shadow p-4">
        <h2 className="font-semibold text-[#E63946] mb-3 flex items-center gap-2">
          <MapPinned className="h-4 w-4" /> Localisation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input inputMode="decimal" placeholder="48.8584" {...register("latitude")} className={inputBase} />
            {errors.latitude && <p className="text-xs text-red-600 mt-1">{errors.latitude.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input inputMode="decimal" placeholder="2.2945" {...register("longitude")} className={inputBase} />
            {errors.longitude && <p className="text-xs text-red-600 mt-1">{errors.longitude.message as string}</p>}
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mt-2">
          Astuce : si tu modifies les coordonnées, la carte du voyage zoomera sur cette étape.
        </p>
      </section>

      <section className="rounded-2xl bg-red-50 border border-red-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-red-700 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer l’étape
            </h3>
            <p className="text-xs text-red-600 mt-1">
              Cette action est irréversible. Les médias liés seront dissociés.
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-60"
          >
            {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Supprimer
          </button>
        </div>
      </section>

      <footer className="flex items-center justify-between text-xs text-gray-500">
        <span>{isDirty ? "Modifications non enregistrées" : "Tout est à jour"}</span>
        <span>Étape {etape.id}</span>
      </footer>
    </form>
  );
}
