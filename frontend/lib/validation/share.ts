import { z } from "zod";
const pinRegex = /^[0-9]{5}[A-Za-z]$/;

export const createShareLinkSchema = z.object({
  voyageId: z.number().int().positive(),
  pin: z
    .string()
    .regex(pinRegex, "PIN invalide (format attendu: 5 chiffres + 1 lettre, ex: 12345A)")
    .optional(),
  expiresInHours: z.coerce.number().int().min(1).max(24 * 14).optional().default(48),
});

export const revokeShareLinkSchema = z
  .object({
    id: z.number().int().positive().optional(),
    token: z.string().uuid().optional(),
  })
  .refine((v) => !!v.id || !!v.token, { message: "id ou token requis" });

export const verifyPinSchema = z.object({
  token: z.string().uuid(),
  pin: z.string().regex(pinRegex, "PIN invalide (5 chiffres + 1 lettre)"),
});
