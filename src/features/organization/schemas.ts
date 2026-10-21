import { z } from "zod";
import { LEGAL_FORMS } from "@/data/types";
import { validateSiret, validateVatNumber } from "@/domain/identifiers";
import {
  addressSchema,
  apeSchema,
  decimalString,
  emailSchema,
  phoneSchema,
  requiredText,
  sirenSchema,
  siretSchema,
  vatNumberSchema,
} from "@/lib/validation";

export const companySchema = z
  .object({
    name: requiredText("Raison sociale"),
    legalForm: z.enum(LEGAL_FORMS, { error: "Choisissez une forme juridique." }),
    shareCapital: decimalString("Capital social", { min: 0 }),
    siren: sirenSchema(),
    siret: siretSchema(),
    vatNumber: vatNumberSchema(),
    apeCode: apeSchema(),
    registration: requiredText("Immatriculation (RCS ou RM)", 80),
    activity: requiredText("Activité", 120),
    address: addressSchema,
    email: emailSchema,
    phone: phoneSchema.refine((v) => !!v, "Le téléphone est obligatoire."),
  })
  .superRefine((v, ctx) => {
    if (v.siren && v.siret && !validateSiret(v.siret, v.siren).valid) {
      ctx.addIssue({
        code: "custom",
        path: ["siret"],
        message: "Le SIRET doit commencer par le SIREN de l'entreprise.",
      });
    }
    if (v.siren && v.vatNumber.startsWith("FR") && !validateVatNumber(v.vatNumber, v.siren).valid) {
      ctx.addIssue({
        code: "custom",
        path: ["vatNumber"],
        message: "Le numéro de TVA ne correspond pas au SIREN saisi.",
      });
    }
  });

export type CompanyInput = z.input<typeof companySchema>;
export type CompanyOutput = z.output<typeof companySchema>;
