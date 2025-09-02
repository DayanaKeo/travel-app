import { z } from "zod";

const title = z.string().min(3, "Titre trop court").max(150, "Titre trop long");
const description = z.string().max(5000, "Description trop longue").optional().nullable();
const isPublic = z.coerce.boolean().optional();
export const imageUrl = z
  .string()
  .max(1024)
  .refine((s) => {
    if (s.trim() === "") return true;
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, { message: "URL d'image invalide (http/https)" })
  .transform((s) => (s.trim() === "" ? undefined : s))
  .optional();

const isoOrDate = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date invalide (ISO attendu)" });
  }
  return d;
});

export const createVoyageSchema = z.object({
  titre: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  image: imageUrl.optional(),
  dateDebut: z.string().transform((s, ctx) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "dateDebut invalide (ISO attendu)" });
    return d;
  }),
  dateFin: z.string().transform((s, ctx) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "dateFin invalide (ISO attendu)" });
    return d;
  }),
  isPublic: z.coerce.boolean().optional().default(false),
}).superRefine((v, ctx) => {
  if (v.dateFin < v.dateDebut) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateFin"], message: "La date de fin doit être ≥ la date de début" });
  }
});


export const updateVoyageSchema = z
  .object({
    titre: title.optional(),
    description,
    dateDebut: isoOrDate.optional(),
    dateFin: isoOrDate.optional(),
    isPublic: isPublic,
    image: imageUrl,
    removeCover: z.coerce.boolean().optional().default(false),
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
