"use client";

import type { UseFormReturn } from "react-hook-form";
import { Wand2 } from "lucide-react";
import { SelectField, TextField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { LEGAL_FORMS } from "@/data/types";
import { computeFrVatNumber, normalizeIdentifier, validateSiren } from "@/domain/identifiers";
import type { CompanyInput } from "./schemas";

/** Champs « informations de l'entreprise » (onboarding et paramètres). */
export function CompanyFields({ form }: { form: UseFormReturn<CompanyInput> }) {
  const { control } = form;
  const fillVat = () => {
    const siren = normalizeIdentifier(form.getValues("siren") ?? "");
    if (validateSiren(siren).valid) {
      form.setValue("vatNumber", computeFrVatNumber(siren), { shouldValidate: true });
      if (!form.getValues("siret")) form.setValue("siret", siren, { shouldDirty: true });
    } else {
      form.trigger("siren");
    }
  };

  return (
    <div className="space-y-8">
      <FieldSet>
        <FieldLegend>Identité</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={control}
            name="name"
            label="Raison sociale"
            autoComplete="organization"
            required
            className="sm:col-span-2"
          />
          <SelectField
            control={control}
            name="legalForm"
            label="Forme juridique"
            required
            options={LEGAL_FORMS.map((f) => ({ value: f, label: f }))}
          />
          <TextField
            control={control}
            name="shareCapital"
            label="Capital social (€)"
            inputMode="decimal"
            required
          />
          <TextField
            control={control}
            name="activity"
            label="Activité"
            placeholder="Électricité générale"
            required
            className="sm:col-span-2"
          />
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Identifiants légaux</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={control}
            name="siren"
            label="SIREN"
            inputMode="numeric"
            placeholder="123 456 789"
            description="9 chiffres, figure sur votre extrait Kbis."
            required
          />
          <TextField
            control={control}
            name="siret"
            label="SIRET du siège"
            inputMode="numeric"
            placeholder="123 456 789 00012"
            description="14 chiffres : SIREN + NIC de l'établissement."
            required
          />
          <div className="space-y-2">
            <TextField
              control={control}
              name="vatNumber"
              label="N° de TVA intracommunautaire"
              placeholder="FR12 123456789"
              required
            />
            <Button type="button" variant="outline" size="sm" onClick={fillVat}>
              <Wand2 aria-hidden />
              Calculer depuis le SIREN
            </Button>
          </div>
          <TextField
            control={control}
            name="apeCode"
            label="Code APE"
            placeholder="4321A"
            required
          />
          <TextField
            control={control}
            name="registration"
            label="Immatriculation"
            placeholder="RCS Lyon ou RM 69"
            required
          />
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Adresse et contact</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-6">
          <TextField
            control={control}
            name="address.line1"
            label="Adresse"
            autoComplete="address-line1"
            required
            className="sm:col-span-6"
          />
          <TextField
            control={control}
            name="address.postalCode"
            label="Code postal"
            inputMode="numeric"
            autoComplete="postal-code"
            required
            className="sm:col-span-2"
          />
          <TextField
            control={control}
            name="address.city"
            label="Ville"
            autoComplete="address-level2"
            required
            className="sm:col-span-4"
          />
          <TextField
            control={control}
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            className="sm:col-span-3"
          />
          <TextField
            control={control}
            name="phone"
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            required
            className="sm:col-span-3"
          />
        </div>
      </FieldSet>
    </div>
  );
}
