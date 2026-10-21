import type { Metadata } from "next";
import { CompanySettingsForm } from "@/features/settings/settings-forms";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Entreprise — Paramètres" };

export default async function CompanySettingsPage() {
  const { org } = await getRequestContext();
  return (
    <section aria-labelledby="s-title" className="space-y-4">
      <div>
        <h2 id="s-title" className="text-xl font-semibold">
          Informations de l&apos;entreprise
        </h2>
        <p className="text-sm text-muted-foreground">
          Reprises sur vos devis et factures. Les factures déjà émises conservent les informations
          figées à leur émission.
        </p>
      </div>
      <CompanySettingsForm
        defaultValues={{
          name: org.name,
          legalForm: org.legalForm,
          shareCapital: org.shareCapital.replace(".", ","),
          siren: org.siren,
          siret: org.siret,
          vatNumber: org.vatNumber,
          apeCode: org.apeCode,
          registration: org.registration,
          activity: org.activity,
          address: {
            line1: org.address.line1,
            postalCode: org.address.postalCode,
            city: org.address.city,
            countryCode: "FR",
          },
          email: org.contact.email,
          phone: org.contact.phone,
          insurer: org.decennialInsurance.insurer,
          policyNumber: org.decennialInsurance.policyNumber,
          coverageArea: org.decennialInsurance.coverageArea,
          iban: org.bank.iban,
          bic: org.bank.bic,
        }}
      />
    </section>
  );
}
