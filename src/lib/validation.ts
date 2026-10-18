/**
 * Schémas Zod partagés (client et serveur), messages d'erreur en français.
 */
import { z } from "zod";
import { parseDecimalInput } from "@/domain/money";
import { normalizeIdentifier, validateApeCode, validateSiren, validateSiret, validateVatNumber } from "@/domain/identifiers";

const trimmed = () => z.string().trim();

export const requiredText = (label: string, max = 200) =>
  trimmed().min(1, `${label} : champ obligatoire.`).max(max, `${label} : ${max} caractères maximum.`);

export const optionalText = (max = 500) => trimmed().max(max, `${max} caractères maximum.`);

export const emailSchema = trimmed()
  .min(1, "L'adresse e-mail est obligatoire.")
  .email("Adresse e-mail invalide (ex. nom@entreprise.fr).");

export const optionalEmail = trimmed()
  .refine((v) => !v || z.string().email().safeParse(v).success, "Adresse e-mail invalide (ex. nom@entreprise.fr).");

export const phoneSchema = trimmed().refine(
  (v) => !v || /^(\+33\s?|0)[1-9](\s?\d{2}){4}$/.test(v),
  "Numéro de téléphone invalide (ex. 04 78 00 12 34).",
);

export const postalCodeSchema = trimmed().regex(/^\d{5}$/, "Le code postal comporte 5 chiffres.");

export const addressSchema = z.object({
  line1: requiredText("Adresse"),
  line2: optionalText(200).optional(),
  postalCode: postalCodeSchema,
  city: requiredText("Ville", 100),
  countryCode: z.string().default("FR"),
});

function identifier(validate: (v: string) => { valid: boolean; error?: string }, required: boolean, missing: string) {
  return trimmed()
    .transform((v) => normalizeIdentifier(v))
    .superRefine((v, ctx) => {
      if (!v) {
        if (required) ctx.addIssue({ code: "custom", message: missing });
        return;
      }
      const r = validate(v);
      if (!r.valid) ctx.addIssue({ code: "custom", message: r.error ?? "Valeur invalide." });
    });
}

export const sirenSchema = (required = true) =>
  identifier((v) => { const r = validateSiren(v); return r.valid ? r : { valid: false, error: r.error }; }, required, "Le SIREN est obligatoire.");
export const siretSchema = (required = true) =>
  identifier((v) => { const r = validateSiret(v); return r.valid ? r : { valid: false, error: r.error }; }, required, "Le SIRET est obligatoire.");
export const vatNumberSchema = (required = true) =>
  identifier((v) => { const r = validateVatNumber(v); return r.valid ? r : { valid: false, error: r.error }; }, required, "Le numéro de TVA est obligatoire.");
export const apeSchema = () =>
  identifier((v) => { const r = validateApeCode(v); return r.valid ? r : { valid: false, error: r.error }; }, true, "Le code APE est obligatoire.");

/** Nombre décimal saisi à la française (« 12,5 »), renvoyé en chaîne normalisée. */
export const decimalString = (label: string, opts: { min?: number; max?: number } = {}) =>
  trimmed().transform((v, ctx) => {
    const parsed = parseDecimalInput(v);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: `${label} : nombre attendu (ex. 12,50).` });
      return z.NEVER;
    }
    const n = Number(parsed);
    if (opts.min !== undefined && n < opts.min) {
      ctx.addIssue({ code: "custom", message: `${label} : ${opts.min} minimum.` });
      return z.NEVER;
    }
    if (opts.max !== undefined && n > opts.max) {
      ctx.addIssue({ code: "custom", message: `${label} : ${opts.max} maximum.` });
      return z.NEVER;
    }
    return parsed;
  });

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre.");

/** Erreurs Zod → { champ: message } (premier message par champ). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
