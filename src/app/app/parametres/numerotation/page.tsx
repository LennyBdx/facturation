import type { Metadata } from "next";
import { BillingSettingsForm } from "@/features/settings/settings-forms";
import { getRequestContext } from "@/composition/request-context";

export const metadata: Metadata = { title: "Numérotation — Paramètres" };

const fr = (v: string) => v.replace(".", ",").replace(/,00$/, "");

export default async function NumberingSettingsPage() {
  const { org, today } = await getRequestContext();
  const s = org.settings;
  return (
    <section aria-labelledby="s-title" className="space-y-4">
      <h2 id="s-title" className="text-xl font-semibold">
        Numérotation et conditions
      </h2>
      <BillingSettingsForm
        preview={{ year: today.slice(0, 4), padding: s.numbering.invoice.padding }}
        defaultValues={{
          quote: { prefix: s.numbering.quote.prefix, nextValue: s.numbering.quote.nextValue },
          invoice: { prefix: s.numbering.invoice.prefix, nextValue: s.numbering.invoice.nextValue },
          creditNote: {
            prefix: s.numbering.creditNote.prefix,
            nextValue: s.numbering.creditNote.nextValue,
          },
          defaultPaymentTermsDays: s.defaultPaymentTermsDays,
          latePenaltyRate: fr(s.latePenaltyRate),
          defaultRetentionRate: fr(s.defaultRetentionRate),
          defaultDepositPercent: fr(s.defaultDepositPercent),
          defaultQuoteValidityDays: s.defaultQuoteValidityDays,
        }}
      />
    </section>
  );
}
