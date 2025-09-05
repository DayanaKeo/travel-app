"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateVoyageJSON,
  updateVoyageWithCover,
  type Voyage,
} from "@/app/services/voyages.client";
import { CalendarDays, Eye, EyeOff, FileText, ArrowLeftRight } from "lucide-react";

import Switch from "@/components/ui/Switch";
import StickyActions from "@/components/ui/StickyActions";
import CoverDropzone from "@/components/ui/CoverDropzone";
import { Field, inputBase } from "@/components/ui/Field";

/* ====== Constantes cover ====== */
const ACCEPT_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 10;
const MIN_W = 1200;
const MIN_H = 675;

/* ====== Utils ====== */
function toDateInput(d: string | Date) {
  const dd = new Date(d);
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysBetween(d1: string, d2: string) {
  const a = new Date(d1);
  const b = new Date(d2);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / msPerDay) + 1);
}

/* ====== Validation ====== */
const schema = z
  .object({
    titre: z.string().min(2, "2 caractères min").max(120),
    description: z
      .string()
      .max(2000, "2000 caractères max")
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
    dateDebut: z.string().min(4, "Date invalide"),
    dateFin: z.string().min(4, "Date invalide"),
    isPublic: z.coerce.boolean().optional().default(false),
    removeCover: z.coerce.boolean().optional().default(false),
  })
  .superRefine((v, ctx) => {
    const d1 = new Date(v.dateDebut);
    const d2 = new Date(v.dateFin);
    if (Number.isNaN(d1.getTime()))
      ctx.addIssue({ code: "custom", path: ["dateDebut"], message: "date invalide (YYYY-MM-DD)" });
    if (Number.isNaN(d2.getTime()))
      ctx.addIssue({ code: "custom", path: ["dateFin"], message: "date invalide (YYYY-MM-DD)" });
    if (!Number.isNaN(d1.getTime()) && !Number.isNaN(d2.getTime()) && d2 < d1) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFin"],
        message: "La date de fin doit être ≥ la date de début",
      });
    }
  });

type FormValues = z.input<typeof schema>;

/* ====== Composant ====== */
export default function EditVoyageForm({ voyage }: { voyage: Voyage }) {
  const router = useRouter();

  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Nouveau fichier sélectionné (contrôlé par CoverDropzone)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [coverError, setCoverError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    getValues,
    setValue,
    reset,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titre: voyage.titre,
      description: voyage.description ?? "",
      dateDebut: toDateInput(voyage.dateDebut),
      dateFin: toDateInput(voyage.dateFin),
      isPublic: voyage.isPublic,
      removeCover: false,
    },
  });

  const wDateDebut = watch("dateDebut");
  const wDateFin = watch("dateFin");
  const duration = daysBetween(wDateDebut, wDateFin);
  const descVal = watch("description") ?? "";

  /* Raccourci clavier ⌘/Ctrl+S */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mac = /Mac|iPhone|iPad/i.test(navigator.platform);
      if ((mac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSubmit]);

  /* Guard quitter */
  React.useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  function buildPayload(initial: Voyage, current: FormValues) {
    const p: any = {};
    if (current.titre !== initial.titre) p.titre = current.titre;
    if ((current.description ?? "") !== (initial.description ?? "")) p.description = current.description ?? null;
    if (toDateInput(initial.dateDebut!) !== current.dateDebut) p.dateDebut = current.dateDebut;
    if (toDateInput(initial.dateFin!) !== current.dateFin) p.dateFin = current.dateFin;
    if (Boolean(initial.isPublic) !== Boolean(current.isPublic)) p.isPublic = Boolean(current.isPublic);
    if (current.removeCover) p.removeCover = true;
    return p;
  }

  async function onSubmit(values: FormValues) {
    setErr(null);
    setSubmitting(true);
    try {
      const payload = buildPayload(voyage, values);

      if (selectedFile) {
        const { data } = await updateVoyageWithCover(voyage.id, { ...payload, cover: selectedFile });
        router.replace(`/voyages/${data.id}`);
      } else {
        const { data } = await updateVoyageJSON(voyage.id, payload);
        router.replace(`/voyages/${data.id}`);
      }
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Mise à jour impossible");
      setSubmitting(false);
    }
  }

  function swapDates() {
    const a = getValues("dateDebut");
    const b = getValues("dateFin");
    setValue("dateDebut", b, { shouldDirty: true });
    setValue("dateFin", a, { shouldDirty: true });
    trigger(["dateDebut", "dateFin"]);
  }

  function resetChanges() {
    reset({
      titre: voyage.titre,
      description: voyage.description ?? "",
      dateDebut: toDateInput(voyage.dateDebut),
      dateFin: toDateInput(voyage.dateFin),
      isPublic: voyage.isPublic,
      removeCover: false,
    });
    setSelectedFile(null);
    setCoverError(null);
    setErr(null);
  }

  const canSave = isDirty && !submitting && !coverError;
  const hasAnyError =
    !!errors.titre || !!errors.dateDebut || !!errors.dateFin || !!errors.description || !!coverError || !!err;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      aria-describedby={hasAnyError ? "form-errors" : undefined}
    >
      <StickyActions
        title="Modifier le voyage"
        subtitle={voyage.titre}
        canSave={canSave}
        submitting={submitting}
        onReset={resetChanges}
      />

      {(err || coverError) && (
        <div id="form-errors" className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
          {err ?? coverError}
        </div>
      )}

      {/* Infos principales */}
      <section className="rounded-2xl bg-white border border-orange-100 shadow p-4">
        <h3 className="font-semibold text-[#E63946] mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Informations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Titre"
            htmlFor="titre"
            hint="Max 120 caractères"
            error={errors.titre?.message as string | undefined}
          >
            <input id="titre" {...register("titre")} className={inputBase} maxLength={120} />
          </Field>

          <div>
            <span className="block text-sm font-medium text-gray-700">Visibilité</span>
            <label className="mt-2 inline-flex items-center gap-2 text-sm select-none">
              <Switch
                checked={!!getValues("isPublic")}
                onChange={(v) => setValue("isPublic", v, { shouldDirty: true })}
                ariaLabel="Basculer Public/Privé"
              />
              {getValues("isPublic") ? (
                <span className="inline-flex items-center gap-1.5 text-green-700">
                  <Eye className="h-4 w-4" /> Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-gray-700">
                  <EyeOff className="h-4 w-4" /> Privé
                </span>
              )}
            </label>
          </div>

          <Field
            label="Début"
            htmlFor="dateDebut"
            error={errors.dateDebut?.message as string | undefined}
          >
            <div className="relative">
              <input
                id="dateDebut"
                type="date"
                {...register("dateDebut")}
                className={`${inputBase} pr-9`}
                max={wDateFin || undefined}
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </Field>

          <Field
            label="Fin"
            htmlFor="dateFin"
            error={errors.dateFin?.message as string | undefined}
            hint={duration ? `Durée : ${duration} jour${duration > 1 ? "s" : ""}` : undefined}
          >
            <div className="flex items-center justify-between -mb-1">
              <button
                type="button"
                onClick={swapDates}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-[#E63946]"
                title="Inverser début/fin"
              >
                <ArrowLeftRight className="h-3 w-3" /> Inverser
              </button>
            </div>
            <div className="relative">
              <input
                id="dateFin"
                type="date"
                {...register("dateFin")}
                className={`${inputBase} pr-9`}
                min={wDateDebut || undefined}
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Description"
              htmlFor="description"
              hint="Raconte ton itinéraire, tes envies, etc."
              error={errors.description?.message as string | undefined}
            >
              <textarea id="description" rows={5} {...register("description")} className={inputBase} />
              <div className="mt-1 text-right text-xs text-gray-400">
                {(descVal?.length ?? 0)}/2000
              </div>
            </Field>
          </div>
        </div>
      </section>

      {/* Couverture */}
      <section className="rounded-2xl bg-white border border-orange-100 shadow p-4">
        <h3 className="font-semibold text-[#E63946] mb-3">Couverture</h3>
        <CoverDropzone
          accept={ACCEPT_IMG}
          maxMb={MAX_MB}
          minWidth={MIN_W}
          minHeight={MIN_H}
          existingUrl={voyage.image ?? null}
          removeExisting={!!getValues("removeCover")}
          onRemoveExistingChange={(b) => setValue("removeCover", b, { shouldDirty: true })}
          onFileChange={(file) => {
            setSelectedFile(file);
            // marquer le form comme dirty
            if (!file) {
              // rien de nouveau → potentiellement pas dirty si rien d’autre n’a changé
            }
          }}
          onErrorChange={setCoverError}
        />
      </section>

      {/* Pied de form */}
      <footer className="flex items-center justify-between text-xs text-gray-500">
        <span>{isDirty ? "Modifications non enregistrées" : "Tout est à jour"}</span>
        <span>Voyage #{voyage.id}</span>
      </footer>
    </form>
  );
}
