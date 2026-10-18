"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormActions } from "@/components/forms/form-actions";
import { SelectField, SwitchField, TextField } from "@/components/forms/form-fields";
import { applyActionResult } from "@/components/forms/submit";
import { WORKSITE_STATUS } from "@/components/status/status-config";
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { saveWorksite } from "./actions";
import { WORKSITE_STATUSES, type WorksiteFormInput, worksiteSchema } from "./schemas";

export function WorksiteForm({
  worksiteId,
  defaultValues,
  clients,
}: {
  worksiteId: string | null;
  defaultValues: WorksiteFormInput;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const form = useForm<WorksiteFormInput>({ resolver: zodResolver(worksiteSchema), defaultValues, mode: "onBlur" });
  const subcontracting = useWatch({ control: form.control, name: "isSubcontracting" });

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={form.handleSubmit(async (values) => {
        const result = await saveWorksite(worksiteId, values);
        if (applyActionResult(form, result)) router.push(`/chantiers/${result.data!.id}`);
      })}
    >
      <FieldSet>
        <FieldLegend>Chantier</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="name" label="Nom du chantier" required className="sm:col-span-2" />
          <SelectField control={form.control} name="clientId" label="Client" required options={clients.map((c) => ({ value: c.id, label: c.name }))} />
          <TextField control={form.control} name="reference" label="Référence interne" required />
          <SelectField
            control={form.control}
            name="status"
            label="Statut"
            required
            options={WORKSITE_STATUSES.map((s) => ({ value: s, label: WORKSITE_STATUS[s].label }))}
          />
          <TextField control={form.control} name="marketReference" label="Référence du marché ou de la commande" description="Reprise sur les factures." />
          <TextField control={form.control} name="startDate" label="Début des travaux" type="date" required />
          <TextField control={form.control} name="endDate" label="Fin prévue" type="date" />
          <TextField control={form.control} name="acceptanceDate" label="Date de réception des travaux" type="date" description="Point de départ du délai d'un an de la retenue de garantie." />
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Adresse du chantier</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-6">
          <TextField control={form.control} name="address.line1" label="Adresse" required className="sm:col-span-6" />
          <TextField control={form.control} name="address.postalCode" label="Code postal" inputMode="numeric" required className="sm:col-span-2" />
          <TextField control={form.control} name="address.city" label="Ville" required className="sm:col-span-4" />
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Marché et facturation</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="contractAmount" label="Montant du marché HT (€)" inputMode="decimal" required />
          <TextField
            control={form.control}
            name="retentionRate"
            label="Retenue de garantie (%)"
            inputMode="decimal"
            description="5 % maximum (loi n° 71-584 du 16 juillet 1971). 0 si aucune retenue."
            required
          />
          <SwitchField control={form.control} name="retentionReplacedByBond" label="Retenue remplacée par une caution bancaire" className="sm:col-span-2" />
          <SwitchField control={form.control} name="isSubcontracting" label="Travaux en sous-traitance" description="Nous intervenons pour le compte d'une entreprise principale." className="sm:col-span-2" />
          {subcontracting ? (
            <div className="sm:col-span-2">
              <SwitchField
                control={form.control}
                name="reverseCharge"
                label="Autoliquidation de la TVA"
                description="La TVA est due par l'entreprise principale (art. 283-2 nonies du CGI) : factures sans TVA, avec mention obligatoire."
              />
              <FieldError errors={[form.formState.errors.reverseCharge]} />
            </div>
          ) : null}
        </div>
      </FieldSet>

      <FormActions pending={form.formState.isSubmitting} submitLabel={worksiteId ? "Enregistrer" : "Créer le chantier"} cancelHref={worksiteId ? `/chantiers/${worksiteId}` : "/chantiers"} />
    </form>
  );
}
