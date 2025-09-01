// app/lib/validators/voyage.ts
import { z } from "zod";

const title = z.string().min(3, "Titre trop court").max(150, "Titre trop long");
const description = z.string().max(5000, "Description trop longue").optional().nullable();
const isPublic = z.coerce.boolean().optional(); // si passé en string depuis un form
const imageUrl = z
  .string()
  .url("URL d'image invalide")
  .max(1024)
  .optional()
  .or(z.literal("").transform(() => undefined)); // autoriser vide

// Dates au format ISO ou Date, avec normalisation en Date
const isoOrDate = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date invalide (ISO attendu)" });
  }
  return d;
});

export const createVoyageSchema = z
  .object({
    titre: title,
    description,
    dateDebut: isoOrDate,
    dateFin: isoOrDate,
    isPublic: isPublic.default(false),
    image: imageUrl,
  })
  .refine((data) => data.dateFin >= data.dateDebut, {
    message: "La date de fin doit être supérieure ou égale à la date de début",
    path: ["dateFin"],
  });


export const updateVoyageSchema = z
  .object({
    titre: title.optional(),
    description,
    dateDebut: isoOrDate.optional(),
    dateFin: isoOrDate.optional(),
    isPublic: isPublic,
    image: imageUrl,
  })
  .refine(
    (data) => {
      if (data.dateDebut && data.dateFin) {
        return data.dateFin >= data.dateDebut;
      }
      return true;
    },
    {
      message: "La date de fin doit être supérieure ou égale à la date de début",
      path: ["dateFin"],
    }
  );

export const listVoyagesQuerySchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
