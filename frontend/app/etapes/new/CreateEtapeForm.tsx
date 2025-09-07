"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createEtapeSchema } from "@/lib/validation/etape";

const extendedCreateEtapeSchema = createEtapeSchema.extend({ date: z.string() });

type FormValues = z.input<typeof createEtapeSchema>;

function todayForInput() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateEtapeForm({ voyageId }: { voyageId: number }) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(extendedCreateEtapeSchema),
    defaultValues: {
      voyageId,
      titre: "",
      adresse: "",
      texte: "",
      latitude: undefined as unknown as number, // champ requis, on force l'entrée
      longitude: undefined as unknown as number,
      date: todayForInput(),
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/etapes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          // latitude/longitude depuis inputs number => s'assurer nombre
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
        }),
      });

      if (!res.ok) {
        let msg = "Création impossible";
        try {
          const j = await res.json();
          msg = j?.error ? (typeof j.error === "string" ? j.error : JSON.stringify(j.error)) : msg;
        } catch {}
        throw new Error(msg);
      }

      const j = (await res.json()) as { data: { id: number } };
      reset(); // nettoyage
      router.replace(`/etapes/${j.data.id}`);
      router.refresh();
    } catch (e: any) {
      setServerError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
      <input type="hidden" value={voyageId} {...register("voyageId", { valueAsNumber: true })} />

      <div>
        <label className="block text-sm font-medium text-gray-700">Titre</label>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          {...register("titre")}
          placeholder="Ex: Visite de la Tour Eiffel"
        />
        {errors.titre && <p className="mt-1 text-sm text-red-600">{errors.titre.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Adresse</label>
        <input
          type="text"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          {...register("adresse")}
          placeholder="Champ de Mars, 5 Av. Anatole France, 75007 Paris"
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
          placeholder="Tes notes personnelles…"
        />
        {errors.texte && <p className="mt-1 text-sm text-red-600">{errors.texte.message as string}</p>}
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer l’étape"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
