"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, CalendarClock, Check, Loader2, Network, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlatformInfo } from "@/integrations/e-invoicing";
import { CompanyFields } from "./company-fields";
import { companySchema, type CompanyInput } from "./schemas";

const STEPS = ["Votre entreprise", "Facture électronique"] as const;

export function OnboardingWizard({ platforms }: { platforms: PlatformInfo[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<string>("");
  const [platformError, setPlatformError] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      legalForm: "SAS",
      shareCapital: "",
      siren: "",
      siret: "",
      vatNumber: "",
      apeCode: "",
      registration: "",
      activity: "",
      address: { line1: "", postalCode: "", city: "", countryCode: "FR" },
      email: "",
      phone: "",
    },
  });

  const finish = async () => {
    if (!platform) {
      setPlatformError(true);
      return;
    }
    setFinishing(true);
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Entreprise configurée (simulation) : bienvenue !");
    router.push("/tableau-de-bord");
  };

  return (
    <div className="space-y-8">
      <ol className="flex gap-2" aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
            <p className={cn("mt-2 text-sm", i === step ? "font-medium" : "text-muted-foreground")}>
              <span className="sr-only">Étape {i + 1} sur {STEPS.length} : </span>
              {label}
            </p>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form
          noValidate
          className="space-y-6"
          onSubmit={form.handleSubmit(() => setStep(1), () => toast.error("Certains champs sont à corriger."))}
        >
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Building2 aria-hidden className="size-6 text-brand" /> Votre entreprise
            </h1>
            <p className="text-muted-foreground">Ces informations apparaîtront sur vos devis et factures (mentions obligatoires).</p>
          </div>
          <CompanyFields form={form} />
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Continuer
              <ArrowRight aria-hidden />
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">La facture électronique, en bref</h1>
            <p className="text-muted-foreground">
              Ce que la réforme change pour {form.getValues("name") || "votre entreprise"}, et ce que nous faisons pour vous.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3">
            <li className="rounded-lg border bg-card p-4">
              <CalendarClock aria-hidden className="mb-2 size-5 text-brand" />
              <p className="font-medium">Calendrier</p>
              <p className="text-sm text-muted-foreground">
                Réception obligatoire pour toutes les entreprises depuis le 1er septembre 2026. Émission obligatoire pour les TPE et PME le
                1er septembre 2027.
              </p>
            </li>
            <li className="rounded-lg border bg-card p-4">
              <Network aria-hidden className="mb-2 size-5 text-brand" />
              <p className="font-medium">Une plateforme agréée</p>
              <p className="text-sm text-muted-foreground">
                Vos factures transitent par une plateforme agréée par l&apos;État, qui les transmet à vos clients et les déclare à
                l&apos;administration.
              </p>
            </li>
            <li className="rounded-lg border bg-card p-4">
              <Send aria-hidden className="mb-2 size-5 text-brand" />
              <p className="font-medium">Notre rôle</p>
              <p className="text-sm text-muted-foreground">
                Vous créez vos devis et factures ici ; nous les envoyons à votre plateforme et affichons leur statut (déposée, approuvée,
                encaissée…).
              </p>
            </li>
          </ul>

          <fieldset className="space-y-3" aria-describedby={platformError ? "platform-err" : undefined}>
            <legend className="font-medium">
              Choisissez votre plateforme agréée <span className="text-destructive">*</span>
            </legend>
            <p className="text-sm text-muted-foreground">Liste fictive pour le prototype : aucune connexion réelle n&apos;est établie.</p>
            <RadioGroup
              value={platform}
              onValueChange={(v) => {
                setPlatform(v);
                setPlatformError(false);
              }}
              className="gap-2"
            >
              {platforms.map((p) => (
                <Label
                  key={p.id}
                  htmlFor={p.id}
                  className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/50"
                >
                  <RadioGroupItem id={p.id} value={p.id} className="mt-0.5" />
                  <span className="space-y-0.5">
                    <span className="block font-medium">{p.name}</span>
                    <span className="block text-sm font-normal text-muted-foreground">{p.description}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            {platformError ? (
              <p id="platform-err" role="alert" className="text-sm text-destructive">
                Choisissez une plateforme pour continuer (vous pourrez la changer dans les paramètres).
              </p>
            ) : null}
          </fieldset>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden />
              Retour
            </Button>
            <Button type="button" size="lg" onClick={finish} disabled={finishing}>
              {finishing ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />}
              Terminer la configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
