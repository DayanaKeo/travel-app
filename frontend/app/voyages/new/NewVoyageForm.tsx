"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVoyageJSON, createVoyageWithCover } from "@/app/services/voyages";

// ✅ Schéma CLIENT (indépendant), pas d'extend sur createVoyageSchema
const clientSchema = z
  .object({
    titre: z.string().min(2).max(120),
    description: z.string().max(2000).optional().nullable(),
    dateDebut: z.string().min(4, "date invalide"),
    dateFin: z.string().min(4, "date invalide"),
    isPublic: z.coerce.boolean().optional().default(false),
    cover: z.any().optional().nullable(), // FileList fourni par RHF
  })
  .superRefine((v, ctx) => {
    const d1 = new Date(v.dateDebut);
    const d2 = new Date(v.dateFin);
    if (Number.isNaN(d1.getTime()))
      ctx.addIssue({ code: "custom", path: ["dateDebut"], message: "date invalide (YYYY-MM-DD)" });
    if (Number.isNaN(d2.getTime()))
      ctx.addIssue({ code: "custom", path: ["dateFin"], message: "date invalide (YYYY-MM-DD)" });
    if (!Number.isNaN(d1.getTime()) && !Number.isNaN(d2.getTime()) && d2 < d1) {
      ctx.addIssue({ code: "custom", path: ["dateFin"], message: "La date de fin doit être ≥ la date de début" });
    }
  });

type FormValues = z.input<typeof clientSchema>;

function toDateInput(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NewVoyageForm() {
  const router = useRouter();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(clientSchema),
      defaultValues: {
        titre: "",
        description: "",
        dateDebut: toDateInput(), // strings pour les <input type="date">
        dateFin: toDateInput(),
        isPublic: false,
        cover: null,
      },
    });

  const coverFileList = watch("cover") as unknown as FileList | undefined;

  React.useEffect(() => {
    if (coverFileList && coverFileList[0]) {
      const file = coverFileList[0];
      const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
      if (!ok) {
        setErr("Formats couverts: jpg, png, webp, gif");
        setPreview(null);
        return;
      }
      setErr(null);
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [coverFileList]);

  async function onSubmit(values: FormValues) {
    setErr(null);
    try {
      const base = {
        titre: values.titre,
        description: values.description || null,
        dateDebut: values.dateDebut, // l’API convertit en Date via createVoyageSchema
        dateFin: values.dateFin,
        isPublic: Boolean(values.isPublic),
      };

      const file = (values.cover as unknown as FileList | undefined)?.[0] ?? null;

      if (file) {
        const { data } = await createVoyageWithCover({ ...base, cover: file });
        router.replace(`/voyages/${data.id}`);
      } else {
        const { data } = await createVoyageJSON(base);
        router.replace(`/voyages/${data.id}`);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Création impossible");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Titre</label>
        <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" {...register("titre")} />
        {errors.titre && <p className="text-xs text-red-600">{String(errors.titre.message)}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description (optionnel)</label>
        <textarea rows={4} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" {...register("description")} />
        {errors.description && <p className="text-xs text-red-600">{String(errors.description.message)}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Début</label>
          <input type="date" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" {...register("dateDebut")} />
          {errors.dateDebut && <p className="text-xs text-red-600">{String((errors as any).dateDebut?.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fin</label>
          <input type="date" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" {...register("dateFin")} />
          {errors.dateFin && <p className="text-xs text-red-600">{String((errors as any).dateFin?.message)}</p>}
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300" {...register("isPublic")} />
            Public
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Couverture (optionnel)</label>
        <input type="file" accept="image/*" {...register("cover")} />
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        {preview && (
          <div className="mt-3 relative aspect-[16/9] overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Aperçu couverture" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 font-medium shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? "Création..." : "Créer le voyage"}
        </button>
      </div>
    </form>
  );
}
