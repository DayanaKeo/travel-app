"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVoyageJSON,
  createVoyageWithCover,
} from "@/app/services/voyages.client";
import {
  CalendarDays,
  Image as ImageIcon,
  Save,
  Loader2,
  FileText,
  RotateCcw,
  ArrowLeftRight,
  Upload,
} from "lucide-react";

const ACCEPT_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 10;
const MIN_W = 99200;
const MIN_H = 2975;

function toDateInput(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(d1: string, d2: string) {
  const a = new Date(d1);
  const b = new Date(d2);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / msPerDay) + 1);
}

const schema = z
  .object({
    titre: z.string().min(2, "2 caractères min").max(120),
    description: z.string().max(2000, "2000 caractères max").optional().nullable(),
    dateDebut: z.string().min(4, "Date invalide"),
    dateFin: z.string().min(4, "Date invalide"),
    isPublic: z.coerce.boolean().optional().default(false),
    cover: z.any().optional().nullable(),
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

type FormValues = z.input<typeof schema>;

export default function NewVoyageForm() {
  const router = useRouter();

  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [dropActive, setDropActive] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [coverError, setCoverError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    setValue,
    getValues,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titre: "",
      description: "",
      dateDebut: toDateInput(),
      dateFin: toDateInput(),
      isPublic: false,
      cover: null,
    },
  });

  const coverFileList = watch("cover") as unknown as FileList | undefined;
  const wDateDebut = watch("dateDebut");
  const wDateFin = watch("dateFin");
  const duration = daysBetween(wDateDebut, wDateFin);
  const descVal = watch("description") ?? "";

  React.useEffect(() => {
    let revoked: string | null = null;
    async function validatePreview() {
      setCoverError(null);
      const f = coverFileList?.[0];
      if (!f) {
        setPreview(null);
        return;
      }

      if (!ACCEPT_IMG.includes(f.type)) {
        setCoverError("Formats acceptés : JPG, PNG, WEBP, GIF.");
        setPreview(null);
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setCoverError(`Fichier trop lourd (max ${MAX_MB} Mo).`);
        setPreview(null);
        return;
      }

      const blobUrl = URL.createObjectURL(f);
      revoked = blobUrl;

      const ok = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width >= MIN_W && img.height >= MIN_H);
        img.onerror = () => resolve(false);
        img.src = blobUrl;
      });

      if (!ok) {
        setCoverError(`Image trop petite (min ${MIN_W}×${MIN_H}px, 16:9 recommandé).`);
        setPreview(null);
        return;
      }

      setPreview(blobUrl);
    }

    validatePreview();
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [coverFileList]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mac = navigator.platform.toLowerCase().includes("mac");
      if ((mac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSubmit]);

  React.useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  function swapDates() {
    const a = getValues("dateDebut");
    const b = getValues("dateFin");
    setValue("dateDebut", b, { shouldDirty: true });
    setValue("dateFin", a, { shouldDirty: true });
  }

  function resetForm() {
    reset({
      titre: "",
      description: "",
      dateDebut: toDateInput(),
      dateFin: toDateInput(),
      isPublic: false,
      cover: null,
    });
    setPreview(null);
    setCoverError(null);
    setErr(null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDropActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    const file = files[0];
    const dt = new DataTransfer();
    dt.items.add(file);
    setValue("cover", dt.files as any, { shouldDirty: true });
  }

  async function onSubmit(values: FormValues) {
    setErr(null);
    setSubmitting(true);
    try {
      const base = {
        titre: values.titre,
        description: values.description || null,
        dateDebut: values.dateDebut,
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
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Création impossible");
      setSubmitting(false);
    }
  }

  const inputBase =
    "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300";

  const canSave = !submitting && !coverError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          {/* <h2 className="text-xl sm:text-2xl font-semibold text-[#E63946]">Nouveau voyage</h2> */}
        </div>

        <div className="flex-col items-center gap-3 sm:flex-row sm:flex">
          <p className="text-xs text-gray-500">Renseigne les infos de base et ajoute une couverture (optionnel).</p>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
            title="Réinitialiser le formulaire"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? "Création..." : "Créer (⌘/Ctrl+S)"}
          </button>
        </div>
      </header>

      {(err || coverError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {err ?? coverError}
        </div>
      )}

      <section className="rounded-2xl bg-white border border-orange-100 shadow p-4">
        <h3 className="font-semibold text-[#E63946] mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Informations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="titre">Titre</label>
            <input id="titre" {...register("titre")} className={inputBase} />
            {errors.titre && <p className="text-xs text-red-600 mt-1">{errors.titre.message as string}</p>}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700">Visibilité</span>
            <label className="mt-2 inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-gray-300" {...register("isPublic")} />
              Rendre public
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="dateDebut">Début</label>
            <div className="relative">
              <input id="dateDebut" type="date" {...register("dateDebut")} className={`${inputBase} pr-9`} />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.dateDebut && (
              <p className="text-xs text-red-600 mt-1">{errors.dateDebut.message as string}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700" htmlFor="dateFin">Fin</label>
              <button
                type="button"
                onClick={swapDates}
                className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-[#E63946]"
                title="Inverser début/fin"
              >
                <ArrowLeftRight className="h-3 w-3" /> Inverser
              </button>
            </div>
            <div className="relative">
              <input id="dateFin" type="date" {...register("dateFin")} className={`${inputBase} pr-9`} />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.dateFin && (
              <p className="text-xs text-red-600 mt-1">{errors.dateFin.message as string}</p>
            )}
            {duration && (
              <p className="text-[11px] text-gray-500 mt-1">
                Durée : {duration} jour{duration > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="description">Description (optionnel)</label>
            <textarea id="description" rows={5} {...register("description")} className={inputBase} />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Raconte l’objectif du voyage, les idées d’étapes, etc.</span>
              <span className="text-gray-400">{(descVal?.length ?? 0)}/2000</span>
            </div>
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message as string}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-orange-100 shadow p-4">
        <h3 className="font-semibold text-[#E63946] mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Couverture (optionnel)
        </h3>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropActive(true);
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed ${
            dropActive ? "border-[#E63946] bg-orange-50/50" : "border-gray-300"
          } p-4 transition-colors cursor-pointer`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Déposer une image de couverture ou cliquer pour sélectionner"
        >
          <div className="flex items-start gap-3">
            <Upload className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium">Dépose ton image ici</p>
              <p className="text-xs text-gray-500">
                ou{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="underline decoration-orange-400 hover:text-[#E63946]"
                >
                  clique pour parcourir
                </button>
              </p>
              <p className="mt-2 text-[11px] text-gray-500">
                Formats: JPG, PNG, WEBP, GIF · Max {MAX_MB} Mo · Min {MIN_W}×{MIN_H}px (ratio 16:9 recommandé)
              </p>

              {(() => {
                const reg = register("cover");
                return (
                  <input
                    id="cover-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    {...reg}
                    ref={(el) => {
                      reg.ref(el);
                      fileInputRef.current = el!;
                    }}
                    className="sr-only"
                  />
                );
              })()}
            </div>
          </div>
        </div>

        {(coverFileList?.[0]) && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs">
            <span className="font-medium text-gray-700">{coverFileList[0].name}</span>
            <span className="text-gray-400">{(coverFileList[0].size / (1024 * 1024)).toFixed(1)} Mo</span>
            <button
              type="button"
              onClick={() => setValue("cover", null as any, { shouldDirty: true })}
              className="ml-1 rounded-full bg-orange-50 hover:bg-orange-100 text-[#E63946] px-2 py-0.5"
              title="Retirer le fichier"
            >
              Retirer
            </button>
          </div>
        )}

        {preview && (
          <div className="mt-4 relative aspect-[16/9] overflow-hidden rounded-xl border border-orange-100">
            <img src={preview} alt="Aperçu couverture" className="w-full h-full object-cover" />
          </div>
        )}

        {coverError && <p className="mt-2 text-xs text-red-600">{coverError}</p>}
      </section>

      <footer className="flex items-center justify-between text-xs text-gray-500">
        <span>{isDirty ? "Modifications non enregistrées" : "Prêt à créer"}</span>
      </footer>
    </form>
  );
}
