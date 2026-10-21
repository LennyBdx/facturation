import { routes } from "@/config/routes";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center">
      <SearchX aria-hidden className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Élément introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Il a peut-être été supprimé ou appartient à une autre entreprise.
        </p>
      </div>
      <Button asChild>
        <Link href={routes.dashboard}>Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
