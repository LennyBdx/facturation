"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormActions } from "@/components/forms/form-actions";
import { TextareaField, TextField } from "@/components/forms/form-fields";
import { applyActionResult } from "@/components/forms/submit";
import { type DraftInput, updateDraftAction } from "./actions";

/**
 * Modification d'un brouillon : en-tête, échéance et conditions.
 * Les lignes d'une situation se recalculent depuis l'assistant (supprimer puis recréer).
 */
export function DraftForm({ invoiceId, defaultValues }: { invoiceId: string; defaultValues: DraftInput }) {
  const router = useRouter();
  const form = useForm<DraftInput>({ defaultValues });
  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        const r = await updateDraftAction(invoiceId, values);
        if (applyActionResult(form, r)) router.push(`/factures/${invoiceId}`);
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="title" label="Intitulé" required className="sm:col-span-2" />
        <TextField control={form.control} name="issueDate" label="Date d'émission prévue" type="date" required />
        <TextField control={form.control} name="dueDate" label="Date d'échéance" type="date" required />
        <TextField control={form.control} name="orderReference" label="Référence de commande ou de marché" description="Recommandée pour un acheteur public." />
        <TextareaField control={form.control} name="paymentTermsLabel" label="Conditions de paiement" required className="sm:col-span-2" />
        <TextareaField control={form.control} name="notes" label="Notes" className="sm:col-span-2" />
      </div>
      <FormActions pending={form.formState.isSubmitting} submitLabel="Enregistrer le brouillon" cancelHref={`/factures/${invoiceId}`} />
    </form>
  );
}
