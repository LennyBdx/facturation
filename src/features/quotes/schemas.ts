import { z } from "zod";
import { UNITS } from "@/data/types";
import { VAT_RATES } from "@/domain/vat";
import { decimalString, optionalText, requiredText } from "@/lib/validation";

const isoDate = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} : date invalide.`);

export const quoteLineSchema = z.object({
  id: z.string().min(1),
  description: requiredText("Désignation", 500),
  quantity: decimalString("Quantité", { min: 0 }),
  unit: z.enum(UNITS, { error: "Unité invalide." }),
  unitPrice: decimalString("Prix unitaire", { min: 0 }),
  vatRate: z.enum(VAT_RATES, { error: "Taux de TVA invalide." }),
});

export const quoteSectionSchema = z.object({
  id: z.string().min(1),
  title: requiredText("Titre du lot", 200),
  lines: z.array(quoteLineSchema),
});

export const quoteSchema = z
  .object({
    clientId: z.string().min(1, "Choisissez le client."),
    worksiteId: z.string(),
    title: requiredText("Objet du devis"),
    issueDate: isoDate("Date du devis"),
    validUntil: isoDate("Validité"),
    reverseCharge: z.boolean(),
    discountKind: z.enum(["none", "percent", "amount"]),
    discountValue: z.string(),
    depositPercent: decimalString("Acompte", { min: 0, max: 100 }),
    estimatedDuration: optionalText(120),
    notes: optionalText(2000),
    sections: z.array(quoteSectionSchema).min(1, "Ajoutez au moins un lot."),
  })
  .superRefine((v, ctx) => {
    if (v.validUntil < v.issueDate) {
      ctx.addIssue({ code: "custom", path: ["validUntil"], message: "La date de validité doit suivre la date du devis." });
    }
    if (v.sections.every((s) => s.lines.length === 0)) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Ajoutez au moins une ligne au devis." });
    }
    if (v.discountKind !== "none") {
      const n = Number(v.discountValue.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Remise : nombre positif attendu." });
      else if (v.discountKind === "percent" && n > 100) ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Remise : 100 % maximum." });
    }
  });

export type QuoteFormValues = z.input<typeof quoteSchema>;
export type QuoteFormOutput = z.output<typeof quoteSchema>;
