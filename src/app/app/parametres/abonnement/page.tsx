import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ToneBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubscriptionPlan } from "@/data/types";
import { cn } from "@/lib/utils";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Abonnement — Paramètres" };

/** Maquette statique : aucun paiement dans le prototype. Prix indicatifs. */
const PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
}[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "19 € HT / mois",
    tagline: "Artisan seul ou petite équipe",
    features: [
      "Devis et factures illimités",
      "Réception des factures fournisseurs",
      "1 utilisateur",
      "Mentions légales et TVA BTP",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "39 € HT / mois",
    tagline: "PME du second œuvre",
    features: [
      "Tout Essentiel",
      "Situations de travaux et retenue de garantie",
      "Autoliquidation sous-traitance",
      "5 utilisateurs",
      "Accès expert-comptable",
    ],
  },
  {
    id: "entreprise",
    name: "Entreprise",
    price: "79 € HT / mois",
    tagline: "Jusqu'à 50 salariés, multi-entreprises",
    features: [
      "Tout Pro",
      "Utilisateurs illimités",
      "Plusieurs entreprises",
      "Exports comptables avancés",
      "Support prioritaire",
    ],
  },
];

export default async function SubscriptionPage() {
  const { org } = await getRequestContext();
  return (
    <section aria-labelledby="s-title" className="space-y-4">
      <div>
        <h2 id="s-title" className="text-xl font-semibold">
          Abonnement
        </h2>
        <p className="text-sm text-muted-foreground">
          Maquette : les offres et les prix sont indicatifs, aucun paiement n&apos;est possible dans
          le prototype.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.id === org.settings.plan;
          return (
            <Card key={p.id} className={cn(current && "border-primary ring-1 ring-primary")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {p.name}
                  {current ? <ToneBadge tone="info">Offre actuelle</ToneBadge> : null}
                </CardTitle>
                <CardDescription>{p.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-semibold">{p.price}</p>
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button className="w-full" variant={current ? "outline" : "default"} disabled>
                  {current ? "Offre actuelle" : "Choisir cette offre (bientôt)"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
