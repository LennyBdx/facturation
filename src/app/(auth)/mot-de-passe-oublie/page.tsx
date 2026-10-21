import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <Link href={routes.signIn} className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> Retour à la connexion
      </Link>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-muted-foreground">Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
