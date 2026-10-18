import {
  allocate,
  compareMoney,
  Dec,
  type Money,
  type Percent,
  percentOf,
  subMoney,
  sumMoney,
  toMoney,
  ZERO,
} from "./money";
import { discountAmountOf, type Discount, lineNet, type PricedSection } from "./quote";
import { applyReverseCharge, groupByVat, totalsOfBreakdown, type VatBreakdownLine, vatOn } from "./vat";

/**
 * Facturation à l'avancement (situations de travaux).
 *
 * Principe : tout est calculé en CUMUL depuis le début du marché, puis la période
 * est obtenue par différence avec le cumul de la situation précédente. Ainsi les
 * arrondis ne s'accumulent pas et, à 100 %, le cumul facturé est exactement égal
 * au montant du marché.
 *
 * Ordre de calcul d'une situation :
 *  1. travaux cumulés HT par ligne = montant HT de la ligne × % d'avancement cumulé ;
 *  2. remise cumulée = remise du marché × (travaux cumulés / total avant remise) ;
 *  3. déduction d'acompte cumulée = acompte HT × (travaux nets cumulés / marché HT) ;
 *  4. bases HT par taux de TVA (cumul) − bases de la situation précédente = bases de la période ;
 *  5. TVA de la période = base × taux, par taux (arrondi au centime) ;
 *  6. retenue de garantie cumulée = taux × travaux TTC cumulés (hors déduction d'acompte),
 *     retenue de la période par différence ;
 *  7. net à payer = TTC de la période − retenue de la période.
 */

export interface ProgressContract {
  sections: readonly PricedSection[];
  discount: Discount;
  reverseCharge: boolean;
}

/** Acompte(s) déjà facturé(s) sur le marché, montant HT total. */
export interface DepositToRecover {
  net: Money;
}

/** Instantané cumulé conservé avec chaque situation, servant de « précédent ». */
export interface ProgressCumulative {
  /** Numéro de situation (1 pour la première). */
  index: number;
  /** % d'avancement cumulé par ligne. */
  percentByLine: Record<string, Percent>;
  /** Travaux cumulés HT par ligne. */
  worksByLine: Record<string, Money>;
  /** Remise cumulée. */
  discount: Money;
  /** Déduction d'acompte cumulée (HT). */
  depositDeduction: Money;
  /** Bases HT cumulées par groupe de TVA (clé `catégorie|taux`). */
  basesByVat: Record<string, Money>;
  /** Travaux TTC cumulés hors déduction d'acompte (base de la retenue de garantie). */
  worksGross: Money;
  /** Retenue de garantie cumulée. */
  retention: Money;
}

export interface ProgressLineResult {
  lineId: string;
  contractNet: Money;
  previousPercent: Percent;
  currentPercent: Percent;
  previousAmount: Money;
  cumulativeAmount: Money;
  periodAmount: Money;
}

export interface ProgressInvoiceResult {
  index: number;
  lines: ProgressLineResult[];
  /** Montant du marché HT après remise. */
  contractNet: Money;
  /** Avancement global cumulé en % du marché (2 décimales). */
  overallPercent: Percent;
  /** Travaux cumulés HT après remise. */
  cumulativeWorksNet: Money;
  /** Travaux de la période HT avant remise. */
  periodWorksGrossNet: Money;
  periodDiscount: Money;
  /** Travaux de la période HT après remise. */
  periodWorksNet: Money;
  periodDepositDeduction: Money;
  /** Bases et TVA de la période. */
  vatBreakdown: VatBreakdownLine[];
  /** Net HT de la période (après déduction d'acompte). */
  net: Money;
  vat: Money;
  /** TTC de la période. */
  gross: Money;
  retentionRate: Percent;
  periodRetention: Money;
  /** Montant à payer pour la période. */
  netToPay: Money;
  cumulative: ProgressCumulative;
}

export class ProgressBillingError extends Error {}

const vatKey = (b: Pick<VatBreakdownLine, "vatCategory" | "vatRate">) => `${b.vatCategory}|${b.vatRate}`;

function clampPercent(p: Percent): Dec {
  const d = new Dec(p);
  if (d.isNaN() || d.lessThan(0) || d.greaterThan(100)) {
    throw new ProgressBillingError(`Pourcentage d'avancement invalide : ${p}`);
  }
  return d;
}

export function computeProgressInvoice(params: {
  contract: ProgressContract;
  /** % d'avancement cumulé par ligne (lignes absentes : % précédent conservé). */
  progress: Record<string, Percent>;
  previous: ProgressCumulative | null;
  deposit: DepositToRecover | null;
  retentionRate: Percent;
}): ProgressInvoiceResult {
  const { contract, progress, previous, deposit, retentionRate } = params;

  // 1. Travaux cumulés par ligne.
  const lines: ProgressLineResult[] = [];
  const taxable: { net: Money; vatRate: Percent; vatCategory: VatBreakdownLine["vatCategory"] }[] = [];
  const contractTaxable: typeof taxable = [];

  for (const section of contract.sections) {
    for (const line of section.lines) {
      const net = lineNet(line);
      const previousPercent = previous?.percentByLine[line.id] ?? "0.00";
      const currentPercent = clampPercent(progress[line.id] ?? previousPercent);
      if (currentPercent.lessThan(previousPercent)) {
        throw new ProgressBillingError(
          `L'avancement cumulé d'une ligne ne peut pas diminuer (${currentPercent.toFixed(2)} % < ${new Dec(previousPercent).toFixed(2)} %). Utilisez un avoir.`,
        );
      }
      const cumulativeAmount = toMoney(new Dec(net).times(currentPercent).dividedBy(100));
      const previousAmount = previous?.worksByLine[line.id] ?? ZERO;
      lines.push({
        lineId: line.id,
        contractNet: net,
        previousPercent: new Dec(previousPercent).toFixed(2),
        currentPercent: currentPercent.toFixed(2),
        previousAmount,
        cumulativeAmount,
        periodAmount: subMoney(cumulativeAmount, previousAmount),
      });
      taxable.push({ net: cumulativeAmount, vatRate: line.vatRate, vatCategory: line.vatCategory });
      contractTaxable.push({ net, vatRate: line.vatRate, vatCategory: line.vatCategory });
    }
  }

  const contractGrossNet = sumMoney(contractTaxable.map((t) => t.net));
  const contractDiscount = discountAmountOf(contract.discount, contractGrossNet);
  const contractNet = subMoney(contractGrossNet, contractDiscount);
  const cumulativeWorksGrossNet = sumMoney(taxable.map((t) => t.net));

  // 2. Remise cumulée, au prorata des travaux réalisés.
  const cumulativeDiscount = new Dec(contractGrossNet).isZero()
    ? ZERO
    : toMoney(new Dec(contractDiscount).times(cumulativeWorksGrossNet).dividedBy(contractGrossNet));
  const cumulativeWorksNet = subMoney(cumulativeWorksGrossNet, cumulativeDiscount);

  // 3. Déduction d'acompte cumulée, au prorata de l'avancement net.
  let cumulativeDeposit = ZERO;
  if (deposit && !new Dec(contractNet).isZero()) {
    cumulativeDeposit = toMoney(new Dec(deposit.net).times(cumulativeWorksNet).dividedBy(contractNet));
    if (compareMoney(cumulativeDeposit, deposit.net) > 0) cumulativeDeposit = toMoney(deposit.net);
  }

  // 4. Bases cumulées par taux : travaux − remise − acompte, répartis au prorata.
  const worksGroups = groupByVat(applyReverseCharge(taxable, contract.reverseCharge));
  const groupWeights = worksGroups.map((g) => g.base);
  const discountShares = allocate(cumulativeDiscount, groupWeights);
  const worksNetByGroup = worksGroups.map((g, i) => subMoney(g.base, discountShares[i] ?? ZERO));
  const depositShares = allocate(cumulativeDeposit, worksNetByGroup);

  const basesByVat: Record<string, Money> = {};
  const vatBreakdown: VatBreakdownLine[] = [];
  let cumulativeWorksVat = new Dec(0);
  worksGroups.forEach((g, i) => {
    const key = vatKey(g);
    const worksNet = worksNetByGroup[i] ?? ZERO;
    cumulativeWorksVat = cumulativeWorksVat.plus(vatOn(worksNet, g.vatRate));
    const cumulativeBase = subMoney(worksNet, depositShares[i] ?? ZERO);
    basesByVat[key] = cumulativeBase;
    const periodBase = subMoney(cumulativeBase, previous?.basesByVat[key] ?? ZERO);
    vatBreakdown.push({
      vatCategory: g.vatCategory,
      vatRate: g.vatRate,
      base: periodBase,
      vat: vatOn(periodBase, g.vatRate),
    });
  });
  const totals = totalsOfBreakdown(vatBreakdown);

  // 6. Retenue de garantie sur les travaux TTC cumulés (hors acompte).
  const worksGross = toMoney(new Dec(cumulativeWorksNet).plus(cumulativeWorksVat));
  const cumulativeRetention = percentOf(worksGross, retentionRate);
  const periodRetention = subMoney(cumulativeRetention, previous?.retention ?? ZERO);

  const previousWorksGrossNet = sumMoney(lines.map((l) => l.previousAmount));
  const periodWorksGrossNet = subMoney(cumulativeWorksGrossNet, previousWorksGrossNet);
  const periodDiscount = subMoney(cumulativeDiscount, previous?.discount ?? ZERO);

  const index = (previous?.index ?? 0) + 1;
  return {
    index,
    lines,
    contractNet,
    overallPercent: new Dec(contractNet).isZero()
      ? "0.00"
      : new Dec(cumulativeWorksNet).times(100).dividedBy(contractNet).toFixed(2),
    cumulativeWorksNet,
    periodWorksGrossNet,
    periodDiscount,
    periodWorksNet: subMoney(periodWorksGrossNet, periodDiscount),
    periodDepositDeduction: subMoney(cumulativeDeposit, previous?.depositDeduction ?? ZERO),
    vatBreakdown,
    net: totals.net,
    vat: totals.vat,
    gross: totals.gross,
    retentionRate: new Dec(retentionRate).toFixed(2),
    periodRetention,
    netToPay: subMoney(totals.gross, periodRetention),
    cumulative: {
      index,
      percentByLine: Object.fromEntries(lines.map((l) => [l.lineId, l.currentPercent])),
      worksByLine: Object.fromEntries(lines.map((l) => [l.lineId, l.cumulativeAmount])),
      discount: cumulativeDiscount,
      depositDeduction: cumulativeDeposit,
      basesByVat,
      worksGross,
      retention: cumulativeRetention,
    },
  };
}

/**
 * Facture d'acompte : `percent` % du marché HT, ventilé par taux de TVA.
 */
export function computeDepositInvoice(params: {
  contract: ProgressContract;
  percent: Percent;
}): { vatBreakdown: VatBreakdownLine[]; net: Money; vat: Money; gross: Money } {
  const { contract, percent } = params;
  const taxable = contract.sections.flatMap((s) =>
    s.lines.map((l) => ({ net: lineNet(l), vatRate: l.vatRate, vatCategory: l.vatCategory })),
  );
  const groups = groupByVat(applyReverseCharge(taxable, contract.reverseCharge));
  const grossNet = sumMoney(groups.map((g) => g.base));
  const discount = discountAmountOf(contract.discount, grossNet);
  const discountShares = allocate(discount, groups.map((g) => g.base));
  const netByGroup = groups.map((g, i) => subMoney(g.base, discountShares[i] ?? ZERO));
  const depositNet = percentOf(sumMoney(netByGroup), percent);
  const shares = allocate(depositNet, netByGroup);
  const vatBreakdown = groups.map((g, i) => {
    const base = shares[i] ?? ZERO;
    return { vatCategory: g.vatCategory, vatRate: g.vatRate, base, vat: vatOn(base, g.vatRate) };
  });
  return { vatBreakdown, ...totalsOfBreakdown(vatBreakdown) };
}

/** Plafond légal de la retenue de garantie (loi n° 71-584 du 16 juillet 1971, art. 1er). */
export const MAX_RETENTION_RATE: Percent = "5.00";

export function isValidRetentionRate(rate: Percent): boolean {
  const d = new Dec(rate);
  return !d.isNaN() && d.greaterThanOrEqualTo(0) && d.lessThanOrEqualTo(MAX_RETENTION_RATE);
}
