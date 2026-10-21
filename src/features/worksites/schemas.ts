import { z } from "zod";
import { addressSchema, decimalString, optionalText, requiredText } from "@/lib/validation";

export const WORKSITE_STATUSES = ["planned", "in_progress", "completed", "closed"] as const;

const isoDate = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} : date invalide.`);

export const worksiteSchema = z
  .object({
    clientId: z.string().min(1, "Choisissez le client."),
    name: requiredText("Nom du chantier"),
    reference: requiredText("Référence", 40),
    address: addressSchema,
    startDate: isoDate("Date de début"),
    endDate: z.union([isoDate("Date de fin"), z.literal("")]),
    status: z.enum(WORKSITE_STATUSES),
    contractAmount: decimalString("Montant du marché", { min: 0 }),
    marketReference: optionalText(80),
    isSubcontracting: z.boolean(),
    reverseCharge: z.boolean(),
    retentionRate: decimalString("Retenue de garantie", { min: 0, max: 5 }),
    retentionReplacedByBond: z.boolean(),
    acceptanceDate: z.union([isoDate("Date de réception"), z.literal("")]),
  })
  .superRefine((v, ctx) => {
    if (v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "La date de fin doit être postérieure à la date de début.",
      });
    }
    if (v.reverseCharge && !v.isSubcontracting) {
      ctx.addIssue({
        code: "custom",
        path: ["reverseCharge"],
        message: "L'autoliquidation s'applique aux travaux réalisés en sous-traitance.",
      });
    }
  });

export type WorksiteFormInput = z.input<typeof worksiteSchema>;
