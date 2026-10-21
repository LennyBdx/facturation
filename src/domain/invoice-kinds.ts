/**
 * Règles propres à chaque type de facture, en un seul endroit (principe ouvert/fermé) :
 * ajouter un type = ajouter une entrée, sans disperser de conditions dans le code.
 */
export const INVOICE_KINDS = ["standard", "deposit", "progress", "final", "credit_note"] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export interface InvoiceKindRules {
  label: string;
  /** Code de type de document EN 16931 (BT-3, liste UNTDID 1001). */
  documentTypeCode: "380" | "386" | "381";
  /** Série de numérotation utilisée à l'émission. */
  numberingSeries: "invoice" | "creditNote";
  /** Peut recevoir des paiements et a une échéance. */
  isReceivable: boolean;
  /** Peut être annulée par un avoir. */
  canBeCredited: boolean;
  /** Issue d'un calcul d'avancement (situation ou solde). */
  isProgress: boolean;
  /** Sens comptable : +1 facture, −1 avoir. */
  sign: 1 | -1;
}

export const INVOICE_KIND_RULES: Record<InvoiceKind, InvoiceKindRules> = {
  standard: { label: "Facture", documentTypeCode: "380", numberingSeries: "invoice", isReceivable: true, canBeCredited: true, isProgress: false, sign: 1 },
  deposit: { label: "Facture d'acompte", documentTypeCode: "386", numberingSeries: "invoice", isReceivable: true, canBeCredited: true, isProgress: false, sign: 1 },
  progress: { label: "Situation de travaux", documentTypeCode: "380", numberingSeries: "invoice", isReceivable: true, canBeCredited: true, isProgress: true, sign: 1 },
  final: { label: "Facture de solde", documentTypeCode: "380", numberingSeries: "invoice", isReceivable: true, canBeCredited: true, isProgress: true, sign: 1 },
  credit_note: { label: "Avoir", documentTypeCode: "381", numberingSeries: "creditNote", isReceivable: false, canBeCredited: false, isProgress: false, sign: -1 },
};

export function kindRules(kind: InvoiceKind): InvoiceKindRules {
  return INVOICE_KIND_RULES[kind];
}
