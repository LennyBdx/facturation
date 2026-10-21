import { z } from "zod";
import { decimalString, optionalText, requiredText } from "@/lib/validation";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export const paymentSchema = z.object({
  date: isoDate,
  amount: decimalString("Montant", { min: 0.01 }),
  method: z.enum(["transfer", "check", "card", "cash", "other"]),
  reference: optionalText(80),
});
export type PaymentInput = z.input<typeof paymentSchema>;

export const draftSchema = z
  .object({
    title: requiredText("Intitulé"),
    issueDate: isoDate,
    dueDate: isoDate,
    paymentTermsLabel: requiredText("Conditions de paiement", 300),
    orderReference: optionalText(80),
    notes: optionalText(1000),
  })
  .refine((v) => v.dueDate >= v.issueDate, {
    path: ["dueDate"],
    message: "L'échéance doit suivre la date d'émission.",
  });
export type DraftInput = z.input<typeof draftSchema>;

export const progressSchema = z.object({
  quoteId: z.string().min(1),
  issueDate: isoDate,
  progress: z.record(z.string(), decimalString("Avancement", { min: 0, max: 100 })),
});
export type ProgressInput = z.input<typeof progressSchema>;

export const creditNoteReasonSchema = requiredText("Motif de l'avoir", 200);
