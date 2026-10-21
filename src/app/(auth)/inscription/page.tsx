import { routes } from "@/config/routes";
import Link from "next/link";
import type { Metadata } from "next";
import { BackHome } from "@/features/auth/back-home";
import { SignUpForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <BackHome />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-muted-foreground">
          Quelques informations, puis nous configurerons votre entreprise.
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link
          href={routes.signIn}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
