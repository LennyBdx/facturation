/**
 * Numérotation des documents.
 *
 * Règle légale (art. 242 nonies A, annexe II du CGI) : les factures portent un numéro
 * unique, basé sur une séquence chronologique et continue, sans rupture. Plusieurs
 * séries distinctes sont admises (ex. factures et avoirs) si chacune est continue.
 *
 * Choix du produit : le numéro n'est attribué qu'au moment de l'émission (un brouillon
 * n'a pas de numéro), ce qui évite tout trou dû à un brouillon supprimé.
 * Format : `{préfixe}-{année}-{compteur sur N chiffres}`, ex. `FA-2026-0042`.
 * Le compteur ne repart pas à zéro chaque année (option la plus simple et sûre).
 */

export interface NumberingSeries {
  prefix: string;
  /** Prochain numéro à attribuer (≥ 1). */
  nextValue: number;
  /** Nombre de chiffres du compteur. */
  padding: number;
}

export function formatDocumentNumber(series: NumberingSeries, value: number, issueDate: string): string {
  const year = issueDate.slice(0, 4);
  return `${series.prefix}-${year}-${String(value).padStart(series.padding, "0")}`;
}

/** Attribue le prochain numéro et renvoie la série incrémentée (fonction pure). */
export function assignNextNumber(
  series: NumberingSeries,
  issueDate: string,
): { number: string; series: NumberingSeries } {
  if (!Number.isInteger(series.nextValue) || series.nextValue < 1) {
    throw new Error("Le prochain numéro doit être un entier supérieur ou égal à 1.");
  }
  return {
    number: formatDocumentNumber(series, series.nextValue, issueDate),
    series: { ...series, nextValue: series.nextValue + 1 },
  };
}

/** Extrait le compteur d'un numéro au format `{préfixe}-{année}-{compteur}`. */
export function parseCounter(number: string, prefix: string): number | null {
  const match = new RegExp(`^${escapeRegExp(prefix)}-\\d{4}-(\\d+)$`).exec(number);
  return match ? Number(match[1]) : null;
}

export interface ContinuityReport {
  ok: boolean;
  /** Compteurs manquants dans la séquence. */
  gaps: number[];
  /** Numéros présents plusieurs fois. */
  duplicates: string[];
  /** Numéros hors format de la série. */
  invalid: string[];
}

/**
 * Vérifie qu'une liste de numéros émis forme une séquence continue sans trou ni doublon,
 * en partant de `firstValue` (1 par défaut).
 */
export function checkContinuity(numbers: readonly string[], prefix: string, firstValue = 1): ContinuityReport {
  const seen = new Map<number, string>();
  const duplicates: string[] = [];
  const invalid: string[] = [];
  for (const n of numbers) {
    const counter = parseCounter(n, prefix);
    if (counter === null) {
      invalid.push(n);
      continue;
    }
    if (seen.has(counter)) duplicates.push(n);
    else seen.set(counter, n);
  }
  const max = seen.size ? Math.max(...seen.keys()) : firstValue - 1;
  const gaps: number[] = [];
  for (let c = firstValue; c <= max; c++) if (!seen.has(c)) gaps.push(c);
  return { ok: gaps.length === 0 && duplicates.length === 0 && invalid.length === 0, gaps, duplicates, invalid };
}

/**
 * Le prochain numéro paramétré ne peut pas réutiliser un numéro déjà émis ni créer
 * de trou : il doit valoir exactement « dernier compteur émis + 1 » dès qu'une
 * facture a été émise dans la série.
 */
export function validateNextValue(next: number, lastIssued: number | null): string | null {
  if (!Number.isInteger(next) || next < 1) return "Le prochain numéro doit être un entier positif.";
  if (lastIssued !== null && next !== lastIssued + 1) {
    return `Numérotation continue obligatoire : le prochain numéro doit être ${lastIssued + 1}.`;
  }
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
