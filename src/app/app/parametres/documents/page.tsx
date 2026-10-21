import type { Metadata } from "next";
import { DocumentSettingsForm } from "@/features/settings/settings-forms";
import { getContext } from "@/services/context";

export const metadata: Metadata = { title: "Personnalisation — Paramètres" };

export default async function DocumentSettingsPage() {
  const { org } = await getContext();
  return (
    <section aria-labelledby="s-title" className="space-y-4">
      <div>
        <h2 id="s-title" className="text-xl font-semibold">Personnalisation des documents</h2>
        <p className="text-sm text-muted-foreground">Logo, couleur et mentions complémentaires de vos devis et factures. Les mentions légales obligatoires sont ajoutées automatiquement.</p>
      </div>
      <DocumentSettingsForm
        companyName={org.name}
        defaultValues={{ accentColor: org.settings.branding.accentColor, customLegalMentions: org.settings.customLegalMentions }}
      />
    </section>
  );
}
