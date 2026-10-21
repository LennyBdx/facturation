"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { TextareaField, TextField } from "@/components/forms/form-fields";
import { applyActionResult } from "@/components/forms/submit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyFields } from "@/features/organization/company-fields";
import type { CompanyInput } from "@/features/organization/schemas";
import { contrastOnWhite, safeAccent } from "@/lib/color";
import type { UseFormReturn } from "react-hook-form";
import {
  inviteAccountantAction,
  saveBillingSettingsAction,
  saveCompanyAction,
  saveDocumentSettingsAction,
} from "./actions";
import {
  billingSettingsSchema,
  type BillingSettingsInput,
  companySettingsSchema,
  type CompanySettingsInput,
  documentSettingsSchema,
  type DocumentSettingsInput,
} from "./schemas";

function SaveBar({ pending, label = "Enregistrer" }: { pending: boolean; label?: string }) {
  return (
    <div className="sticky bottom-16 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
      <Button type="submit" disabled={pending} className="w-full md:w-auto">
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
        {label}
      </Button>
    </div>
  );
}

export function CompanySettingsForm({ defaultValues }: { defaultValues: CompanySettingsInput }) {
  const router = useRouter();
  const form = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues,
    mode: "onBlur",
  });
  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={form.handleSubmit(async (v) => {
        if (applyActionResult(form, await saveCompanyAction(v))) router.refresh();
      })}
    >
      <CompanyFields form={form as unknown as UseFormReturn<CompanyInput>} />
      <FieldSet>
        <FieldLegend>Assurance décennale (mention obligatoire BTP)</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField control={form.control} name="insurer" label="Assureur" required />
          <TextField control={form.control} name="policyNumber" label="N° de contrat" required />
          <TextField
            control={form.control}
            name="coverageArea"
            label="Couverture géographique"
            required
          />
        </div>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Coordonnées bancaires</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            control={form.control}
            name="iban"
            label="IBAN"
            required
            className="sm:col-span-2"
            autoComplete="off"
          />
          <TextField control={form.control} name="bic" label="BIC" required autoComplete="off" />
        </div>
      </FieldSet>
      <SaveBar pending={form.formState.isSubmitting} />
    </form>
  );
}

export function BillingSettingsForm({
  defaultValues,
  preview,
}: {
  defaultValues: BillingSettingsInput;
  preview: { year: string; padding: number };
}) {
  const router = useRouter();
  const form = useForm<BillingSettingsInput>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues,
    mode: "onBlur",
  });
  const values = useWatch({ control: form.control });
  const sample = (key: "quote" | "invoice" | "creditNote") =>
    `${values[key]?.prefix || "?"}-${preview.year}-${String(values[key]?.nextValue ?? 1).padStart(preview.padding, "0")}`;
  const seriesBlock = (key: "quote" | "invoice" | "creditNote", title: string, help: string) => (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{title}</p>
      <p className="mb-3 text-sm text-muted-foreground">{help}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name={`${key}.prefix`} label="Préfixe" required />
        <TextField
          control={form.control}
          name={`${key}.nextValue`}
          label="Prochain numéro"
          inputMode="numeric"
          required
        />
      </div>
      <p className="mt-2 text-sm">
        Prochain document : <span className="font-mono font-medium">{sample(key)}</span>
      </p>
    </div>
  );
  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={form.handleSubmit(async (v) => {
        if (applyActionResult(form, await saveBillingSettingsAction(v))) router.refresh();
      })}
    >
      <FieldSet>
        <FieldLegend>Numérotation des documents</FieldLegend>
        <p className="-mt-2 text-sm text-muted-foreground">
          Les factures sont numérotées à l&apos;émission, en séquence continue et sans trou (art.
          242 nonies A, annexe II du CGI). Une fois des factures émises, le prochain numéro ne peut
          être que le suivant du dernier émis.
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-3">
          {seriesBlock("quote", "Devis", "Numéro attribué à la création.")}
          {seriesBlock("invoice", "Factures", "Acomptes, situations, soldes et factures uniques.")}
          {seriesBlock("creditNote", "Avoirs", "Série distincte, continue elle aussi.")}
        </div>
      </FieldSet>
      <FieldSet>
        <FieldLegend>Conditions par défaut</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TextField
            control={form.control}
            name="defaultPaymentTermsDays"
            label="Délai de paiement (jours)"
            inputMode="numeric"
            description="60 jours maximum (Code de commerce)."
            required
          />
          <TextField
            control={form.control}
            name="latePenaltyRate"
            label="Pénalités de retard (% annuel)"
            inputMode="decimal"
            description="Au moins 3 fois le taux d'intérêt légal."
            required
          />
          <TextField
            control={form.control}
            name="defaultQuoteValidityDays"
            label="Validité des devis (jours)"
            inputMode="numeric"
            required
          />
          <TextField
            control={form.control}
            name="defaultRetentionRate"
            label="Retenue de garantie (%)"
            inputMode="decimal"
            description="5 % maximum. Appliquée aux nouveaux chantiers."
            required
          />
          <TextField
            control={form.control}
            name="defaultDepositPercent"
            label="Acompte par défaut (%)"
            inputMode="decimal"
            required
          />
        </div>
      </FieldSet>
      <SaveBar pending={form.formState.isSubmitting} />
    </form>
  );
}

export function DocumentSettingsForm({
  defaultValues,
  companyName,
}: {
  defaultValues: DocumentSettingsInput;
  companyName: string;
}) {
  const router = useRouter();
  const form = useForm<DocumentSettingsInput>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues,
    mode: "onChange",
  });
  const color = useWatch({ control: form.control, name: "accentColor" }) ?? "";
  const valid = /^#[0-9a-fA-F]{6}$/.test(color);
  const ratio = valid ? contrastOnWhite(color) : 0;
  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={form.handleSubmit(async (v) => {
        if (applyActionResult(form, await saveDocumentSettingsAction(v))) router.refresh();
      })}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Logo</p>
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md text-xl font-bold text-paper-on-accent"
                style={{ background: safeAccent(color) }}
              >
                {companyName.slice(0, 1)}
              </span>
              <p className="text-sm text-muted-foreground">
                L&apos;import du logo sera disponible avec le stockage de fichiers. En attendant,
                l&apos;initiale de l&apos;entreprise est utilisée.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color-picker">Couleur d&apos;accent des documents</Label>
            <div className="flex items-start gap-3">
              <input
                id="color-picker"
                type="color"
                value={valid ? color : "#1e3a5f"}
                onChange={(e) =>
                  form.setValue("accentColor", e.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                className="h-11 w-14 cursor-pointer rounded-md border bg-card p-1"
                aria-describedby="color-help"
              />
              <TextField
                control={form.control}
                name="accentColor"
                label="Code hexadécimal"
                className="flex-1"
              />
            </div>
            <p
              id="color-help"
              className={ratio >= 4.5 ? "text-sm text-success" : "text-sm text-warning"}
            >
              Contraste du texte blanc sur cette couleur :{" "}
              {ratio ? ratio.toFixed(1).replace(".", ",") : "—"}:1{" "}
              {ratio >= 4.5 ? "(lisible)" : "(4,5:1 minimum requis)"}
            </p>
          </div>
          <TextareaField
            control={form.control}
            name="customLegalMentions"
            label="Mentions complémentaires"
            description="Ajoutées en pied de vos devis et factures (ex. « Pas d'escompte pour paiement anticipé »)."
            rows={4}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Aperçu</p>
          <div className="rounded-lg border border-paper-border bg-paper p-5 text-paper-foreground">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{companyName}</span>
              <span className="text-lg font-semibold" style={{ color: safeAccent(color) }}>
                Facture
              </span>
            </div>
            <div
              className="mt-4 rounded-sm px-2 py-1.5 text-xs text-paper-on-accent"
              style={{ background: safeAccent(color) }}
            >
              Désignation · Qté · PU HT · TVA · Total HT
            </div>
            <div className="mt-2 space-y-1 text-xs text-paper-muted">
              <div className="h-2 w-3/4 rounded bg-paper-border" />
              <div className="h-2 w-2/3 rounded bg-paper-border" />
            </div>
            <div
              className="mt-4 ml-auto w-40 rounded-sm px-2 py-1 text-right text-sm font-semibold text-paper-on-accent"
              style={{ background: safeAccent(color) }}
            >
              Net à payer
            </div>
          </div>
        </div>
      </div>
      <SaveBar pending={form.formState.isSubmitting} />
    </form>
  );
}

export function AccountantInvite() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inviter votre expert-comptable</CardTitle>
        <CardDescription>
          Accès en lecture à vos factures émises et reçues (maquette, non fonctionnel).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const r = await inviteAccountantAction(email);
              if (r.ok) {
                toast.success(r.message);
                setEmail("");
              } else setError(r.error);
            });
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="acc-email" className="sr-only">
              E-mail de l&apos;expert-comptable
            </Label>
            <Input
              id="acc-email"
              type="email"
              placeholder="cabinet@expert-comptable.fr"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "acc-email-err" : undefined}
            />
            {error ? (
              <p id="acc-email-err" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
            Inviter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
