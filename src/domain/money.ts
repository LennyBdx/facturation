import Decimal from "decimal.js";

/**
 * Montant en euros sous forme de chaîne décimale à 2 décimales, ex. "1250.00".
 * Jamais de `number` pour un montant : les calculs passent par decimal.js.
 */
export type Money = string;
/** Pourcentage sous forme de chaîne décimale, ex. "5.00" pour 5 %. */
export type Percent = string;
/** Quantité sous forme de chaîne décimale (jusqu'à 3 décimales), ex. "12.5". */
export type Quantity = string;

/**
 * Instance décimale dédiée : précision large, arrondi « demi supérieur »
 * (ROUND_HALF_UP, 0,005 → 0,01), règle usuelle en comptabilité française.
 */
export const Dec = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export type Dec = InstanceType<typeof Dec>;

export const ZERO: Money = "0.00";

export function dec(value: Decimal.Value | Dec): Dec {
  return new Dec(value);
}

/** Arrondi au centime, demi supérieur. */
export function roundCents(value: Decimal.Value | Dec): Dec {
  return new Dec(value).toDecimalPlaces(2, Dec.ROUND_HALF_UP);
}

/** Convertit une valeur en `Money` arrondie au centime. */
export function toMoney(value: Decimal.Value | Dec): Money {
  return roundCents(value).toFixed(2);
}

export function addMoney(...values: Money[]): Money {
  return toMoney(values.reduce((acc, v) => acc.plus(v), new Dec(0)));
}

export function subMoney(a: Money, b: Money): Money {
  return toMoney(new Dec(a).minus(b));
}

export function sumMoney(values: readonly Money[]): Money {
  return addMoney(...values);
}

/** `amount × percent / 100`, arrondi au centime. */
export function percentOf(amount: Money, percent: Percent): Money {
  return toMoney(new Dec(amount).times(percent).dividedBy(100));
}

export function isZero(value: Money): boolean {
  return new Dec(value).isZero();
}

export function compareMoney(a: Money, b: Money): number {
  return new Dec(a).comparedTo(b);
}

export function minMoney(a: Money, b: Money): Money {
  return compareMoney(a, b) <= 0 ? toMoney(a) : toMoney(b);
}

export function negate(value: Money): Money {
  return toMoney(new Dec(value).negated());
}

/**
 * Répartit `total` au prorata de `weights` en garantissant que la somme des parts
 * est exactement égale à `total` (méthode du plus fort reste, au centime).
 * Utilisé pour ventiler une remise ou une déduction d'acompte entre taux de TVA.
 */
export function allocate(total: Money, weights: readonly Money[]): Money[] {
  if (weights.length === 0) return [];
  const totalWeight = weights.reduce((acc, w) => acc.plus(w), new Dec(0));
  if (totalWeight.isZero()) {
    return weights.map((_, i) => (i === 0 ? toMoney(total) : ZERO));
  }
  const cents = new Dec(total).times(100);
  const raw = weights.map((w) => cents.times(w).dividedBy(totalWeight));
  const floored = raw.map((r) => r.toDecimalPlaces(0, Dec.ROUND_FLOOR));
  let remainder = cents.minus(floored.reduce((acc, f) => acc.plus(f), new Dec(0))).toNumber();
  const order = raw
    .map((r, i) => ({ i, frac: r.minus(floored[i]!) }))
    .sort((a, b) => b.frac.comparedTo(a.frac) || a.i - b.i);
  const result = [...floored];
  for (const { i } of order) {
    if (remainder <= 0) break;
    result[i] = result[i]!.plus(1);
    remainder -= 1;
  }
  return result.map((c) => toMoney(c.dividedBy(100)));
}

/**
 * Lit une saisie utilisateur française (« 1 250,5 », « 12.5 ») et renvoie une
 * chaîne décimale normalisée, ou `null` si la saisie n'est pas un nombre.
 */
export function parseDecimalInput(input: string): string | null {
  const cleaned = input.replace(/[\s  €%]/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return new Dec(cleaned).toString();
}
