import type { Metadata } from "next";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountantInvite } from "@/features/settings/settings-forms";

export const metadata: Metadata = { title: "Expert-comptable — Paramètres" };

export default function AccountantPage() {
  return (
    <section aria-labelledby="s-title" className="space-y-6">
      <div>
        <h2 id="s-title" className="text-xl font-semibold">Expert-comptable</h2>
        <p className="text-sm text-muted-foreground">Partagez vos pièces avec votre cabinet. Maquette : ces fonctions seront branchées dans une prochaine version.</p>
      </div>
      <AccountantInvite />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exports comptables</CardTitle>
          <CardDescription>Journal des ventes et des achats, au format attendu par votre logiciel comptable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Journal des ventes", text: "Factures et avoirs émis, ventilés par taux de TVA." },
            { title: "Journal des achats", text: "Factures fournisseurs approuvées, avec autoliquidation." },
          ].map((e) => (
            <div key={e.title} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.text}</p>
                </div>
              </div>
              <Button variant="outline" disabled>
                <Download aria-hidden />
                Exporter (bientôt)
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
