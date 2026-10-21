import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/config/routes";

/** Lien de retour vers le site vitrine (écrans de connexion et d'inscription). */
export function BackHome() {
  return (
    <Link href={ROUTES.home} className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft aria-hidden className="size-4" />
      Retour à l&apos;accueil
    </Link>
  );
}
