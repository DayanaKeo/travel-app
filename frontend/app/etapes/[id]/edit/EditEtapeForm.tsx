// app/etapes/[id]/edit/EditEtapeForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEtapeSchema } from "@/lib/validation/etape";
import type { Etape } from "@/app/services/etapes";

type FormValues = z.input<typeof updateEtapeSchema>;

function toDateInputValue(isoOrDateStr: string) {
  const d = new Date(isoOrDateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditEtapeForm({ etape, voyageId }: { etape: Etape; voyageId: number }) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(updateEtapeSchema),
    defaultValues: {
      titre: etape.titre,
      adresse: etape.adresse,
      texte: etape.texte ?? "",
      latitude: etape.latitude,
      longitude: etape.longitude,
      date: toDateInputValue(etape.date),
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {};

      if (values.titre !== etape.titre) payload.titre = values.titre;
      if (values.adresse !== etape.adresse) payload.adresse = values.adresse;
      if ((values.texte ?? null) !== (etape.texte ?? null)) payload.texte = values.texte ?? null;

      const latNum = Number(values.latitude);
      const lngNum = Number(values.longitude);
      if (latNum !== etape.latitude) payload.latitude = latNum;
      if (lngNum !== etape.longitude) payload.longitude = lngNum;

      const newDateIso = new Date(values.date!).toISOString();
      const oldDateIso = new Date(etape.date).toISOString();
      if (newDateIso !== oldDateIso) payload.date = values.date;

      const res = await fetch(`/api/etapes/${etape.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Mise à jour impossible";
        try {
          const j = await res.json();
          msg = j?.error ? (typeof j.error === "string" ? j.error : JSON.stringify(j.error)) : msg;
        } catch {}
        throw new Error(msg);
      }

      reset(values, { keepDirty: false });
      router.push(`/etapes/${etape.id}`);
      router.refresh();
    } catch (e: any) {
      setServerError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm("Supprimer définitivement cette étape ?")) return;
    setServerError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/etapes/${etape.id}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = "Suppression impossible";
        try {
          const j = await res.json();
          msg = j?.error ? (typeof j.error === "string" ? j.error : JSON.stringify(j.error)) : msg;
        } catch {}
        throw new Error(msg);
      }
      router.replace(`/voyages/${voyageId}`);
      router.refresh();
    } catch (e: any) {
      setServerError(e?.message ?? "Erreur inconnue");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
      {/* ... champs comme avant ... */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Titre</label>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          {...register("titre")}
        />
        {errors.titre && <p className="mt-1 text-sm text-red-600">{errors.titre.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adresse</label>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          {...register("adresse")}
        />
        {errors.adresse && <p className="mt-1 text-sm text-red-600">{errors.adresse.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            {...register("date")}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Latitude</label>
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            {...register("latitude", { valueAsNumber: true })}
          />
          {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Longitude</label>
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            {...register("longitude", { valueAsNumber: true })}
          />
          {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude.message as string}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          rows={4}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          {...register("texte")}
        />
        {errors.texte && <p className="mt-1 text-sm text-red-600">{errors.texte.message as string}</p>}
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>

        <button
          type="button"
          onClick={() => history.back()}
          className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Annuler
        </button>

        <div className="ml-auto" />

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Suppression..." : "Supprimer"}
        </button>
      </div>
    </form>
  );
}
