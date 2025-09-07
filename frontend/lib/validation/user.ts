import { z } from "zod";

export const profilSchema = z.object({
  nomComplet: z.string().max(120).optional(),
  telephone: z.string().max(30).nullable().optional(),
  localisation: z.string().max(120).nullable().optional(),
  languePreferee: z.string().max(10).nullable().optional(),
  biographie: z.string().max(500).nullable().optional(),
  dateNaissance: z.string().datetime().nullable().optional(), 
  avatarUrl: z.string().url().nullable().optional(),
});

export const preferencesSchema = z.object({
  notificationsEmail: z.boolean().optional(),
  profilPublic: z.boolean().optional(),
  suggestionsIAAutomatiques: z.boolean().optional(),
});

export const changePwdSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(12)
    .regex(/[A-Z]/, "1 majuscule")
    .regex(/[a-z]/, "1 minuscule")
    .regex(/[0-9]/, "1 chiffre")
    .regex(/[^A-Za-z0-9]/, "1 caractère spécial"),
});
