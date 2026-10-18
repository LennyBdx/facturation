import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-muted-foreground">Accédez à vos devis, situations et factures.</p>
      </div>
      <p className="rounded-md border border-info/25 bg-info-soft px-3 py-2 text-sm text-info">
        Prototype : la connexion est simulée, n&apos;importe quel mot de passe est accepté.
      </p>
      <SignInForm />
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-primary underline-offset-4 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
