import { addDays } from "@/domain/lifecycle";
import type { Organization, Quote, QuoteStatus } from "@/data/types";
import type { QuoteFormValues } from "./schemas";

const frDecimal = (v: string) => v.replace(".", ",");
const trimZeros = (v: string) => (v.includes(".") ? v.replace(/\.?0+$/, "") : v);

export function quoteToFormValues(q: Quote): QuoteFormValues {
  return {
    clientId: q.clientId,
    worksiteId: q.worksiteId ?? "",
    title: q.title,
    issueDate: q.issueDate,
    validUntil: q.validUntil,
    reverseCharge: q.reverseCharge,
    discountKind: q.discount.kind,
    discountValue: q.discount.kind === "none" ? "" : frDecimal(trimZeros(q.discount.value)),
    depositPercent: frDecimal(trimZeros(q.depositPercent)),
    estimatedDuration: q.estimatedDuration ?? "",
    notes: q.notes ?? "",
    sections: q.sections.map((s) => ({
      id: s.id,
      title: s.title,
      lines: s.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: frDecimal(l.quantity),
        unit: l.unit,
        unitPrice: frDecimal(l.unitPrice),
        vatRate: l.vatRate as QuoteFormValues["sections"][number]["lines"][number]["vatRate"],
      })),
    })),
  };
}

export function emptyQuoteValues(org: Organization, today: string, clientId = "", worksiteId = "", reverseCharge = false): QuoteFormValues {
  return {
    clientId,
    worksiteId,
    title: "",
    issueDate: today,
    validUntil: addDays(today, org.settings.defaultQuoteValidityDays),
    reverseCharge,
    discountKind: "none",
    discountValue: "",
    depositPercent: "0",
    estimatedDuration: "",
    notes: "",
    sections: [
      {
        id: crypto.randomUUID(),
        title: "Lot 1",
        lines: [{ id: crypto.randomUUID(), description: "", quantity: "1", unit: "u", unitPrice: "", vatRate: "20.00" }],
      },
    ],
  };
}

/** Statut affiché : un devis envoyé dont la validité est dépassée apparaît « expiré ». */
export function effectiveQuoteStatus(q: Pick<Quote, "status" | "validUntil">, today: string): QuoteStatus {
  return q.status === "sent" && q.validUntil < today ? "expired" : q.status;
}
