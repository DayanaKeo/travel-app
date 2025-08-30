import { z } from "zod";

const CoercedDate = z
  .union([
    z.string().min(1, "Date requise"),
    z.date(),
  ])
  .transform((val) => (val instanceof Date ? val : new Date(val)))
  .refine((d) => !Number.isNaN(d.getTime()), "Date invalide");

export const VoyageCreateSchema = z
  .object({
    titre: z.string().trim().min(3, "Titre trop court").max(120, "Titre trop long"),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v === "" ? undefined : v)),
    dateDebut: CoercedDate,
    dateFin: CoercedDate,
  })
  .refine((d) => d.dateDebut <= d.dateFin, {
    message: "dateDebut doit être avant (ou égale à) dateFin",
    path: ["dateFin"],
  });

export const VoyageUpdateSchema = z
  .object({
    titre: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    dateDebut: CoercedDate.optional(),
    dateFin: CoercedDate.optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (d) => {
      if (d.dateDebut && d.dateFin) return d.dateDebut <= d.dateFin;
      return true;
    },
    { message: "dateDebut doit être avant (ou égale à) dateFin", path: ["dateFin"] }
  );
