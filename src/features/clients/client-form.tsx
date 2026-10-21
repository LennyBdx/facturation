"use client";

import { routes } from "@/config/routes";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wand2 } from "lucide-react";
import { FormActions } from "@/components/forms/form-actions";
import { SelectField, TextareaField, TextField } from "@/components/forms/form-fields";
import { applyActionResult } from "@/components/forms/submit";
import { CLIENT_KIND_LABELS } from "@/components/status/status-config";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { computeFrVatNumber, normalizeIdentifier, validateSiren } from "@/domain/identifiers";
import { saveClient } from "./actions";
import { CLIENT_KINDS, clientSchema, type ClientFormInput } from "./schemas";

export function ClientForm({ clientId, defaultValues }: { clientId: string | null; defaultValues: ClientFormInput }) {
  const router = useRouter();
  const form = useForm<ClientFormInput>({ resolver: zodResolver(clientSchema), defaultValues, mode: "onBlur" });
  const kind = useWatch({ control: form.control, name: "kind" });
  const isIndividual = kind === "individual";

  const fillVat = () => {
    const siren = normalizeIdentifier(form.getValues("siren") ?? "");
    if (validateSiren(siren).valid) form.setValue("vatNumber", computeFrVatNumber(siren), { shouldValidate: true });
    else form.trigger("siren");
  };

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={form.handleSubmit(async (values) => {
        const result = await saveClient(clientId, values);
        if (applyActionResult(form, result)) router.push(routes.clients.show(result.data!.id));
      })}
    >
      <FieldSet>
        <FieldLegend>Client</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="kind"
            label="Type de client"
            required
            options={CLIENT_KINDS.map((k) => ({ value: k, label: CLIENT_KIND_LABELS[k] }))}
          />
          <TextField
            control={form.control}
            name="name"
            label={isIndividual ? "Prénom et nom" : "Raison sociale"}
            autoComplete={isIndividual ? "name" : "organization"}
            required
          />
        </div>
      </FieldSet>

      {!isIndividual ? (
        <FieldSet>
          <FieldLegend>Identifiants</FieldLegend>
          <p className="-mt-2 text-sm text-muted-foreground">
            Le SIREN de votre client est indispensable pour lui adresser une facture électronique.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField control={form.control} name="siren" label="SIREN" inputMode="numeric" placeholder="123 456 789" required />
            <TextField control={form.control} name="siret" label="SIRET (établissement facturé)" inputMode="numeric" />
            <div className="space-y-2">
              <TextField control={form.control} name="vatNumber" label="N° de TVA" description="Obligatoire en autoliquidation." />
              <Button type="button" variant="outline" size="sm" onClick={fillVat}>
                <Wand2 aria-hidden />
                Calculer depuis le SIREN
              </Button>
            </div>
            {kind === "public_buyer" ? (
              <TextField
                control={form.control}
                name="serviceCode"
                label="Code service"
                description="Communiqué par l'acheteur public, nécessaire au routage de la facture."
                className="sm:col-span-3"
              />
            ) : null}
          </div>
        </FieldSet>
      ) : null}

      <FieldSet>
        <FieldLegend>Adresse de facturation</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-6">
          <TextField control={form.control} name="billingAddress.line1" label="Adresse" autoComplete="address-line1" required className="sm:col-span-6" />
          <TextField control={form.control} name="billingAddress.postalCode" label="Code postal" inputMode="numeric" autoComplete="postal-code" required className="sm:col-span-2" />
          <TextField control={form.control} name="billingAddress.city" label="Ville" autoComplete="address-level2" required className="sm:col-span-4" />
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Contact et conditions</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-3">
          {!isIndividual ? <TextField control={form.control} name="contact.name" label="Interlocuteur" autoComplete="name" /> : null}
          <TextField control={form.control} name="contact.email" label="E-mail" type="email" autoComplete="email" />
          <TextField control={form.control} name="contact.phone" label="Téléphone" type="tel" autoComplete="tel" />
          <TextField
            control={form.control}
            name="paymentTermsDays"
            label="Délai de paiement (jours)"
            inputMode="numeric"
            description="0 = paiement à réception."
            required
          />
          <TextareaField control={form.control} name="notes" label="Notes internes" className="sm:col-span-3" />
        </div>
      </FieldSet>

      <FormActions pending={form.formState.isSubmitting} submitLabel={clientId ? "Enregistrer" : "Créer le client"} cancelHref={clientId ? routes.clients.show(clientId) : routes.clients.list()} />
    </form>
  );
}
