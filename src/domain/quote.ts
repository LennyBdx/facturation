import { compareMoney, Dec, type Money, type Percent, percentOf, type Quantity, sumMoney, toMoney, ZERO } from "./money";
import {
  applyReverseCharge,
  groupByVat,
  reduceBreakdown,
  totalsOfBreakdown,
  type VatBreakdownLine,
  type VatCategory,
} from "./vat";

export interface PricedLine {
  id: string;
  quantity: Quantity;
  /** Prix unitaire HT. */
  unitPrice: Money;
  vatRate: Percent;
  vatCategory: VatCategory;
}

export interface PricedSection<L extends PricedLine = PricedLine> {
  id: string;
  lines: readonly L[];
}

export type Discount =
  | { kind: "none" }
  | { kind: "percent"; value: Percent }
  | { kind: "amount"; value: Money };

export interface QuoteInput {
  sections: readonly PricedSection[];
  discount: Discount;
  reverseCharge: boolean;
  /** Acompte demandé à la commande, en % du TTC (ou du HT en autoliquidation). */
  depositPercent: Percent;
}

export interface QuoteTotals {
  /** Montant HT de chaque ligne (quantité × PU HT, arrondi au centime). */
  lineNets: Record<string, Money>;
  /** Sous-total HT de chaque lot. */
  sectionSubtotals: Record<string, Money>;
  /** Somme des lignes avant remise. */
  grossNet: Money;
  discountAmount: Money;
  /** Total HT après remise. */
  net: Money;
  vatBreakdown: VatBreakdownLine[];
  vat: Money;
  /** Total TTC. */
  gross: Money;
  depositAmount: Money;
}

/** Montant HT d'une ligne : quantité × prix unitaire, arrondi au centime. */
export function lineNet(line: Pick<PricedLine, "quantity" | "unitPrice">): Money {
  return toMoney(new Dec(line.quantity).times(line.unitPrice));
}

/** Montant de remise, plafonné au total avant remise. */
export function discountAmountOf(discount: Discount, grossNet: Money): Money {
  let amount: Money;
  switch (discount.kind) {
    case "none":
      return ZERO;
    case "percent":
      amount = percentOf(grossNet, discount.value);
      break;
    case "amount":
      amount = toMoney(discount.value);
      break;
  }
  if (compareMoney(amount, ZERO) < 0) return ZERO;
  return compareMoney(amount, grossNet) > 0 ? grossNet : amount;
}

/**
 * Totaux d'un devis.
 * Règles : chaque ligne est arrondie au centime ; la remise globale est répartie
 * entre taux de TVA au prorata des bases ; la TVA est calculée par taux sur la base
 * après remise ; en autoliquidation, toutes les lignes sont en catégorie AE à 0 %.
 */
export function computeQuoteTotals(input: QuoteInput): QuoteTotals {
  const lineNets: Record<string, Money> = {};
  const sectionSubtotals: Record<string, Money> = {};
  const taxable: { net: Money; vatRate: Percent; vatCategory: VatCategory }[] = [];

  for (const section of input.sections) {
    const nets: Money[] = [];
    for (const line of section.lines) {
      const net = lineNet(line);
      lineNets[line.id] = net;
      nets.push(net);
      taxable.push({ net, vatRate: line.vatRate, vatCategory: line.vatCategory });
    }
    sectionSubtotals[section.id] = sumMoney(nets);
  }

  const grossNet = sumMoney(Object.values(sectionSubtotals));
  const discountAmount = discountAmountOf(input.discount, grossNet);
  const vatBreakdown = reduceBreakdown(groupByVat(applyReverseCharge(taxable, input.reverseCharge)), discountAmount);
  const totals = totalsOfBreakdown(vatBreakdown);

  return {
    lineNets,
    sectionSubtotals,
    grossNet,
    discountAmount,
    net: totals.net,
    vatBreakdown,
    vat: totals.vat,
    gross: totals.gross,
    depositAmount: percentOf(totals.gross, input.depositPercent),
  };
}
