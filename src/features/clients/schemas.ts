import { z } from "zod";
import { validateVatNumber } from "@/domain/identifiers";
import {
  addressSchema,
  optionalEmail,
  optionalText,
  phoneSchema,
  requiredText,
  sirenSchema,
  siretSchema,
  vatNumberSchema,
} from "@/lib/validation";

export const CLIENT_KINDS = ["general_contractor", "private_owner", "individual", "public_buyer"] as const;

export const clientSchema = z
  .object({
    kind: z.enum(CLIENT_KINDS, { error: "Choisissez un type de client." }),
    name: requiredText("Nom ou raison sociale"),
    siren: sirenSchema(false),
    siret: siretSchema(false),
    vatNumber: vatNumberSchema(false),
    billingAddress: addressSchema,
    contact: z.object({
      name: optionalText(120),
      email: optionalEmail,
      phone: phoneSchema,
    }),
    paymentTermsDays: z.coerce
      .number({ error: "Délai de paiement : nombre de jours attendu." })
      .int("Délai de paiement : nombre entier de jours.")
      .min(0, "Le délai de paiement ne peut pas être négatif.")
      .max(60, "Délai légal maximum : 60 jours date de facture (art. L441-10 du Code de commerce)."),
    serviceCode: optionalText(60),
    notes: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    // Facture électronique : le SIREN de l'acheteur professionnel est obligatoire.
    if (v.kind !== "individual" && !v.siren) {
      ctx.addIssue({
        code: "custom",
        path: ["siren"],
        message: "Le SIREN est obligatoire pour un client professionnel (nécessaire à la facture électronique).",
      });
    }
    if (v.siret && v.siren && !v.siret.startsWith(v.siren)) {
      ctx.addIssue({ code: "custom", path: ["siret"], message: "Le SIRET doit commencer par le SIREN du client." });
    }
    if (v.vatNumber && v.siren && v.vatNumber.startsWith("FR") && !validateVatNumber(v.vatNumber, v.siren).valid) {
      ctx.addIssue({ code: "custom", path: ["vatNumber"], message: "Le numéro de TVA ne correspond pas au SIREN saisi." });
    }
  });

export type ClientFormInput = z.input<typeof clientSchema>;
export type ClientFormOutput = z.output<typeof clientSchema>;
