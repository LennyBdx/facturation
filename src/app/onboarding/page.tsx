import type { Metadata } from "next";
import { APP_NAME } from "@/config/app";
import { OnboardingWizard } from "@/features/organization/onboarding-wizard";
import { getEInvoicingProvider } from "@/integrations/e-invoicing";

export const metadata: Metadata = { title: "Configuration de l'entreprise" };

export default async function OnboardingPage() {
  const platforms = await getEInvoicingProvider().listPlatforms();
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4 font-semibold">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <span className="size-3 rotate-45 rounded-[2px] bg-brand" />
          </span>
          {APP_NAME}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <OnboardingWizard platforms={platforms} />
      </main>
    </div>
  );
}
