import { PageHeader } from "@/components/app/page-header";
import { SettingsNav } from "@/features/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Entreprise, documents, facture électronique et abonnement."
      />
      <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
