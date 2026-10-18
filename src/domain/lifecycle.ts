import { compareMoney, type Money, subMoney, sumMoney, ZERO } from "./money";

/**
 * Statuts du cycle de vie des factures électroniques (nomenclature de la réforme,
 * norme AFNOR XP Z12-012 et spécifications externes DGFiP). Voir docs/domaine-btp.md.
 *
 * Statuts obligatoires (transmis à l'administration) : Déposée (200), Refusée (210),
 * Encaissée (212, lorsque la TVA est exigible à l'encaissement — cas des travaux
 * immobiliers, qui sont des prestations de services) et Rejetée (213).
 */
export const LIFECYCLE_STATUSES = {
  deposited: { code: 200, label: "Déposée", mandatory: true },
  issued: { code: 201, label: "Émise par la plateforme", mandatory: false },
  received: { code: 202, label: "Reçue par la plateforme", mandatory: false },
  made_available: { code: 203, label: "Mise à disposition", mandatory: false },
  in_hand: { code: 204, label: "Prise en charge", mandatory: false },
  approved: { code: 205, label: "Approuvée", mandatory: false },
  partially_approved: { code: 206, label: "Approuvée partiellement", mandatory: false },
  disputed: { code: 207, label: "En litige", mandatory: false },
  suspended: { code: 208, label: "Suspendue", mandatory: false },
  completed: { code: 209, label: "Complétée", mandatory: false },
  refused: { code: 210, label: "Refusée", mandatory: true },
  payment_sent: { code: 211, label: "Paiement transmis", mandatory: false },
  cashed: { code: 212, label: "Encaissée", mandatory: true },
  rejected: { code: 213, label: "Rejetée", mandatory: true },
} as const;

export type LifecycleStatus = keyof typeof LIFECYCLE_STATUSES;

/** Une facture rejetée (213) n'a jamais existé fiscalement : on la corrige et on la redépose. */
export const TERMINAL_LIFECYCLE_STATUSES: readonly LifecycleStatus[] = ["refused", "rejected", "cashed"];

/** Statuts nécessitant une action de l'émetteur. */
export const LIFECYCLE_NEEDS_ACTION: readonly LifecycleStatus[] = ["rejected", "refused", "disputed", "suspended"];

/** Actions possibles sur une facture reçue, et statut produit. */
export const RECEIVED_INVOICE_ACTIONS = {
  approve: "approved",
  refuse: "refused",
  dispute: "disputed",
  mark_paid: "payment_sent",
} as const satisfies Record<string, LifecycleStatus>;
export type ReceivedInvoiceAction = keyof typeof RECEIVED_INVOICE_ACTIONS;

const ALLOWED_RECEIVED_ACTIONS: Record<LifecycleStatus, readonly ReceivedInvoiceAction[]> = {
  deposited: [],
  issued: [],
  received: ["approve", "refuse", "dispute"],
  made_available: ["approve", "refuse", "dispute"],
  in_hand: ["approve", "refuse", "dispute"],
  approved: ["mark_paid", "dispute"],
  partially_approved: ["mark_paid", "dispute"],
  disputed: ["approve", "refuse"],
  suspended: ["approve", "refuse"],
  completed: ["approve", "refuse", "dispute"],
  refused: [],
  payment_sent: [],
  cashed: [],
  rejected: [],
};

export function allowedReceivedInvoiceActions(status: LifecycleStatus): readonly ReceivedInvoiceAction[] {
  return ALLOWED_RECEIVED_ACTIONS[status];
}

// --- Statut de paiement ------------------------------------------------------

export type PaymentStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: "Brouillon",
  issued: "Émise",
  partially_paid: "Payée partiellement",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée par avoir",
};

/**
 * Statut de paiement dérivé : jamais stocké, toujours recalculé à partir des
 * paiements enregistrés, de l'échéance et de la date du jour.
 */
export function computePaymentStatus(params: {
  issued: boolean;
  cancelled: boolean;
  /** Montant à encaisser (net à payer). */
  amountDue: Money;
  payments: readonly Money[];
  dueDate: string | null;
  today: string;
}): PaymentStatus {
  if (!params.issued) return "draft";
  if (params.cancelled) return "cancelled";
  const paid = sumMoney(params.payments);
  if (compareMoney(paid, params.amountDue) >= 0) return "paid";
  if (params.dueDate && params.dueDate < params.today) return "overdue";
  return compareMoney(paid, ZERO) > 0 ? "partially_paid" : "issued";
}

export function remainingDue(amountDue: Money, payments: readonly Money[]): Money {
  const rest = subMoney(amountDue, sumMoney(payments));
  return compareMoney(rest, ZERO) > 0 ? rest : ZERO;
}

/** Ajoute `days` jours à une date ISO (AAAA-MM-JJ). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Nombre de jours entre deux dates ISO (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
