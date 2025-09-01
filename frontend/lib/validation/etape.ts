import { z } from "zod";

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

export const createEtapeSchema = z.object({
  voyageId: z.number().int().positive(),
  titre: z.string().min(2).max(120),
  adresse: z.string().min(3).max(255),
  texte: z.string().max(2000).optional().nullable(),
  latitude: lat,
  longitude: lng,
  date: z.string().transform((s, ctx) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "date invalide (ISO attendu)" });
    return d;
  }),
});

export const updateEtapeSchema =
 z.object({
  titre: z.string().min(2).max(120).optional(),
  adresse: z.string().min(3).max(255).optional(),
  texte: z.string().max(2000).nullable().optional(),
  latitude: lat.optional(),
  longitude: lng.optional(),
  date: z.string().optional(),
});

export const listEtapesQuerySchema = z.object({
  voyageId: z.coerce.number().int().positive(),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  q: z.string().min(2).optional(),
});
