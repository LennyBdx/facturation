import { z } from "zod";
import { companySchema } from "@/features/organization/schemas";
import { contrastOnWhite } from "@/lib/color";
import { decimalString, optionalText, requiredText } from "@/lib/validation";

export const companySettingsSchema = companySchema.and(
  z.object({
    insurer: requiredText("Assureur décennal", 120),
    policyNumber: requiredText("N° de contrat", 60),
    coverageArea: requiredText("Couverture géographique", 120),
    iban: requiredText("IBAN", 40).refine(
      (v) => /^FR\d{2}[\dA-Z ]{23,30}$/i.test(v),
      "IBAN français attendu (FR76…).",
    ),
    bic: requiredText("BIC", 11).refine(
      (v) => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(v),
      "BIC invalide (8 ou 11 caractères).",
    ),
  }),
);
export type CompanySettingsInput = z.input<typeof companySettingsSchema>;

const series = z.object({
  prefix: requiredText("Préfixe", 8).regex(
    /^[A-Z]{1,8}$/,
    "Préfixe : 1 à 8 lettres majuscules (ex. FA).",
  ),
  nextValue: z.coerce
    .number({ error: "Nombre entier attendu." })
    .int("Nombre entier attendu.")
    .min(1, "1 minimum."),
});

export const billingSettingsSchema = z.object({
  quote: series,
  invoice: series,
  creditNote: series,
  defaultPaymentTermsDays: z.coerce
    .number()
    .int()
    .min(0, "0 minimum.")
    .max(60, "Délai légal maximum : 60 jours."),
  latePenaltyRate: decimalString("Taux des pénalités", { min: 0 }),
  defaultRetentionRate: decimalString("Retenue de garantie", { min: 0, max: 5 }),
  defaultDepositPercent: decimalString("Acompte", { min: 0, max: 100 }),
  defaultQuoteValidityDays: z.coerce
    .number()
    .int()
    .min(1, "1 jour minimum.")
    .max(365, "365 jours maximum."),
});
export type BillingSettingsInput = z.input<typeof billingSettingsSchema>;

export const documentSettingsSchema = z.object({
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale attendue (ex. #1E3A5F).")
    .refine(
      (c) => contrastOnWhite(c) >= 4.5,
      "Couleur trop claire : le texte blanc ne serait pas lisible (contraste 4,5:1 minimum).",
    ),
  customLegalMentions: optionalText(1000),
});
export type DocumentSettingsInput = z.input<typeof documentSettingsSchema>;
