import type { Metadata } from "next";
import { DetailList } from "@/components/app/detail-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Mon compte — Paramètres" };

const ROLE_LABELS = { owner: "Propriétaire", admin: "Administrateur", member: "Membre" } as const;

export default async function AccountPage() {
  const ctx = await getRequestContext();
  return (
    <section aria-labelledby="s-title" className="space-y-4">
      <h2 id="s-title" className="text-xl font-semibold">
        Mon compte
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {ctx.user.firstName} {ctx.user.lastName}
          </CardTitle>
          <CardDescription>
            Utilisateur de démonstration : la gestion du compte (mot de passe, double
            authentification) arrivera avec l&apos;authentification réelle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "E-mail", value: ctx.user.email },
              { label: "Téléphone", value: ctx.user.phone },
              { label: "Fonction", value: ctx.user.jobTitle },
              { label: `Rôle chez ${ctx.org.name}`, value: ROLE_LABELS[ctx.role] },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
