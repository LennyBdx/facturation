import { allocate, Dec, type Money, type Percent, sumMoney, toMoney, ZERO } from "./money";

/** Taux de TVA proposés en France métropolitaine. */
export const VAT_RATES = ["20.00", "10.00", "5.50", "0.00"] as const satisfies readonly Percent[];
export type VatRate = (typeof VAT_RATES)[number];

/**
 * Code de catégorie de TVA EN 16931 (liste UNCL 5305), champ BT-151 par ligne.
 * - S  : taux normal ou réduit
 * - Z  : taux zéro
 * - E  : exonéré
 * - AE : autoliquidation (sous-traitance BTP, art. 283-2 nonies du CGI)
 * - K  : livraison intracommunautaire
 * - G  : exportation hors UE
 * - O  : hors champ de la TVA
 */
export const VAT_CATEGORIES = ["S", "Z", "E", "AE", "K", "G", "O"] as const;
export type VatCategory = (typeof VAT_CATEGORIES)[number];

export const VAT_CATEGORY_LABELS: Record<VatCategory, string> = {
  S: "Taux normal ou réduit",
  Z: "Taux zéro",
  E: "Exonéré",
  AE: "Autoliquidation",
  K: "Livraison intracommunautaire",
  G: "Exportation",
  O: "Hors champ de la TVA",
};

/** Mention obligatoire en cas d'autoliquidation en sous-traitance BTP. */
export const REVERSE_CHARGE_MENTION =
  "Autoliquidation : TVA due par le preneur assujetti, article 283-2 nonies du CGI.";

export interface TaxableAmount {
  /** Montant HT (déjà arrondi au centime). */
  net: Money;
  vatRate: Percent;
  vatCategory: VatCategory;
}

export interface VatBreakdownLine {
  vatCategory: VatCategory;
  vatRate: Percent;
  /** Base imposable de la catégorie (BT-116). */
  base: Money;
  /** Montant de TVA de la catégorie (BT-117) = base × taux, arrondi au centime. */
  vat: Money;
}

const groupKey = (category: VatCategory, rate: Percent) =>
  `${category}|${new Dec(rate).toFixed(2)}`;

/**
 * En autoliquidation, toutes les lignes passent en catégorie AE à 0 % :
 * le prestataire ne facture pas de TVA, le preneur l'autoliquide.
 */
export function applyReverseCharge<T extends TaxableAmount>(
  lines: readonly T[],
  reverseCharge: boolean,
): T[] {
  if (!reverseCharge) return [...lines];
  return lines.map((l) => ({ ...l, vatCategory: "AE" as const, vatRate: "0.00" }));
}

/** Catégorie implicite d'un taux en régime normal. */
export function defaultCategoryForRate(rate: Percent): VatCategory {
  return new Dec(rate).isZero() ? "Z" : "S";
}

/**
 * Regroupe des montants HT par (catégorie, taux), en ordre de première apparition.
 */
export function groupByVat(lines: readonly TaxableAmount[]): VatBreakdownLine[] {
  const groups = new Map<string, { vatCategory: VatCategory; vatRate: Percent; nets: Money[] }>();
  for (const line of lines) {
    const key = groupKey(line.vatCategory, line.vatRate);
    const group = groups.get(key) ?? {
      vatCategory: line.vatCategory,
      vatRate: new Dec(line.vatRate).toFixed(2),
      nets: [],
    };
    group.nets.push(line.net);
    groups.set(key, group);
  }
  return [...groups.values()].map((g) => {
    const base = sumMoney(g.nets);
    return { vatCategory: g.vatCategory, vatRate: g.vatRate, base, vat: vatOn(base, g.vatRate) };
  });
}

/** TVA d'une base : base × taux / 100, arrondie au centime (règle EN 16931 BR-CO-17). */
export function vatOn(base: Money, rate: Percent): Money {
  return toMoney(new Dec(base).times(rate).dividedBy(100));
}

/**
 * Applique une réduction de niveau document (remise, déduction d'acompte) répartie
 * entre catégories de TVA au prorata de leur base, puis recalcule la TVA.
 */
export function reduceBreakdown(
  breakdown: readonly VatBreakdownLine[],
  reduction: Money,
): VatBreakdownLine[] {
  if (new Dec(reduction).isZero()) return breakdown.map((b) => ({ ...b }));
  const shares = allocate(
    reduction,
    breakdown.map((b) => b.base),
  );
  return breakdown.map((b, i) => {
    const base = toMoney(new Dec(b.base).minus(shares[i] ?? ZERO));
    return { ...b, base, vat: vatOn(base, b.vatRate) };
  });
}

export function totalsOfBreakdown(breakdown: readonly VatBreakdownLine[]): {
  net: Money;
  vat: Money;
  gross: Money;
} {
  const net = sumMoney(breakdown.map((b) => b.base));
  const vat = sumMoney(breakdown.map((b) => b.vat));
  return { net, vat, gross: sumMoney([net, vat]) };
}

export function formatVatRateLabel(rate: Percent): string {
  const d = new Dec(rate);
  return `${d.isInteger() ? d.toFixed(0) : d.toFixed(1).replace(".", ",")} %`;
}
