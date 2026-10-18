"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2 } from "lucide-react";
import type { z } from "zod";
import { PasswordField, TextField } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { forgotPasswordSchema, signInSchema, signUpSchema } from "./schemas";

/** Maquettes : la validation est réelle (Zod), l'authentification est simulée. */
const fakeDelay = () => new Promise((r) => setTimeout(r, 500));

export function SignInForm() {
  const router = useRouter();
  const form = useForm<z.input<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "julien.morel@volta-energies.example", password: "" },
    mode: "onBlur",
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async () => {
        await fakeDelay();
        router.push("/tableau-de-bord");
      })}
    >
      <TextField control={form.control} name="email" label="Adresse e-mail" type="email" autoComplete="email" required />
      <PasswordField control={form.control} name="password" label="Mot de passe" autoComplete="current-password" required />
      <div className="flex justify-end">
        <Link href="/mot-de-passe-oublie" className="text-sm text-primary underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton pending={form.formState.isSubmitting}>Se connecter</SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const form = useForm<z.input<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", acceptTerms: false },
    mode: "onBlur",
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async () => {
        await fakeDelay();
        router.push("/onboarding");
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="firstName" label="Prénom" autoComplete="given-name" required />
        <TextField control={form.control} name="lastName" label="Nom" autoComplete="family-name" required />
      </div>
      <TextField control={form.control} name="email" label="Adresse e-mail professionnelle" type="email" autoComplete="email" required />
      <PasswordField
        control={form.control}
        name="password"
        label="Mot de passe"
        autoComplete="new-password"
        description="8 caractères minimum, dont au moins un chiffre."
        required
      />
      <Controller
        control={form.control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.invalid || undefined}>
            <Checkbox
              id="terms"
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={fieldState.error ? "terms-err" : undefined}
            />
            <div className="space-y-1">
              <FieldLabel htmlFor="terms" className="font-normal">
                J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité.
              </FieldLabel>
              <FieldError id="terms-err" errors={[fieldState.error]} />
            </div>
          </Field>
        )}
      />
      <SubmitButton pending={form.formState.isSubmitting}>Créer mon compte</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<z.input<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });
  if (sentTo) {
    return (
      <div role="status" className="space-y-3 rounded-lg border border-success/30 bg-success-soft p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-success">
          <CircleCheck aria-hidden className="size-4" /> Demande enregistrée
        </p>
        <p>
          Si un compte existe pour <strong>{sentTo}</strong>, un lien de réinitialisation vient d&apos;être envoyé (prototype : aucun
          e-mail n&apos;est réellement envoyé).
        </p>
        <Link href="/connexion" className="inline-block text-primary underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={form.handleSubmit(async (v) => {
        await fakeDelay();
        setSentTo(v.email);
      })}
    >
      <TextField control={form.control} name="email" label="Adresse e-mail" type="email" autoComplete="email" required />
      <SubmitButton pending={form.formState.isSubmitting}>Recevoir un lien</SubmitButton>
    </form>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
