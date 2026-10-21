/** Indicateurs d'activité par mois (fonctions pures). */
import { addMoney, type Money, negate, ZERO } from "./money";

/** Document émis, réduit à ce qu'il faut pour les indicateurs mensuels. */
export interface BilledDocument {
  /** Date d'émission, AAAA-MM-JJ. */
  issueDate: string;
  /** Montant facturé (net à payer) ; un avoir est déclaré avec `credit: true`. */
  amount: Money;
  credit: boolean;
  payments: readonly { date: string; amount: Money }[];
}

export interface MonthlyFigure {
  /** Mois, AAAA-MM. */
  month: string;
  /** Facturé : factures émises moins avoirs. */
  billed: Money;
  /** Encaissé : paiements reçus dans le mois. */
  collected: Money;
}

/** Les `count` mois se terminant par celui de `today`, du plus ancien au plus récent. */
export function lastMonths(today: string, count: number): string[] {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Facturé et encaissé par mois, sur les `count` derniers mois (mois vides inclus). */
export function monthlyBilling(
  documents: readonly BilledDocument[],
  today: string,
  count = 12,
): MonthlyFigure[] {
  const months = lastMonths(today, count);
  const figures = new Map(months.map((month) => [month, { month, billed: ZERO, collected: ZERO }]));
  for (const doc of documents) {
    const billedIn = figures.get(doc.issueDate.slice(0, 7));
    if (billedIn)
      billedIn.billed = addMoney(billedIn.billed, doc.credit ? negate(doc.amount) : doc.amount);
    for (const p of doc.payments) {
      const paidIn = figures.get(p.date.slice(0, 7));
      if (paidIn && p.date <= today) paidIn.collected = addMoney(paidIn.collected, p.amount);
    }
  }
  return months.map((m) => figures.get(m)!);
}
