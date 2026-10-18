/**
 * Validation des identifiants d'entreprise français.
 * - SIREN : 9 chiffres, clé de Luhn.
 * - SIRET : 14 chiffres = SIREN + NIC (5 chiffres), clé de Luhn sur les 14 chiffres.
 *   Exception La Poste (SIREN 356 000 000) : les établissements dont la clé de Luhn
 *   échoue sont valides si la somme des chiffres du SIRET est un multiple de 5.
 * - TVA intracommunautaire FR : « FR » + clé à 2 chiffres + SIREN,
 *   clé = (12 + 3 × (SIREN mod 97)) mod 97.
 */

export type ValidationResult = { valid: true; value: string } | { valid: false; error: string };

const LA_POSTE_SIREN = "356000000";

/** Supprime espaces, points et tirets ; met en majuscules. */
export function normalizeIdentifier(input: string): string {
  return input.replace(/[\s.\-  ]/g, "").toUpperCase();
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function digitCountError(label: string, expected: number, value: string): string {
  return `Le ${label} doit comporter ${expected} chiffres (vous en avez saisi ${value.length}).`;
}

export function validateSiren(input: string): ValidationResult {
  const value = normalizeIdentifier(input);
  if (!value) return { valid: false, error: "Le SIREN est obligatoire." };
  if (!/^\d+$/.test(value)) return { valid: false, error: "Le SIREN ne doit contenir que des chiffres." };
  if (value.length !== 9) return { valid: false, error: digitCountError("SIREN", 9, value) };
  if (!luhnValid(value)) {
    return { valid: false, error: "Ce SIREN n'est pas valide : vérifiez les chiffres saisis." };
  }
  return { valid: true, value };
}

export function validateSiret(input: string, expectedSiren?: string): ValidationResult {
  const value = normalizeIdentifier(input);
  if (!value) return { valid: false, error: "Le SIRET est obligatoire." };
  if (!/^\d+$/.test(value)) return { valid: false, error: "Le SIRET ne doit contenir que des chiffres." };
  if (value.length !== 14) return { valid: false, error: digitCountError("SIRET", 14, value) };
  const siren = value.slice(0, 9);
  const ok =
    luhnValid(value) ||
    (siren === LA_POSTE_SIREN && [...value].reduce((acc, d) => acc + Number(d), 0) % 5 === 0);
  if (!ok) return { valid: false, error: "Ce SIRET n'est pas valide : vérifiez les chiffres saisis." };
  if (expectedSiren && siren !== normalizeIdentifier(expectedSiren)) {
    return { valid: false, error: "Le SIRET doit commencer par le SIREN de l'entreprise." };
  }
  return { valid: true, value };
}

/** Calcule le numéro de TVA intracommunautaire français à partir du SIREN. */
export function computeFrVatNumber(siren: string): string {
  const s = normalizeIdentifier(siren);
  // 9 chiffres : représentable exactement en `number`.
  const key = (12 + 3 * (Number(s) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${s}`;
}

export function validateVatNumber(input: string, expectedSiren?: string): ValidationResult {
  const value = normalizeIdentifier(input);
  if (!value) return { valid: false, error: "Le numéro de TVA est obligatoire." };
  if (!/^[A-Z]{2}/.test(value)) {
    return { valid: false, error: "Le numéro de TVA doit commencer par le code pays (ex. FR)." };
  }
  if (value.startsWith("FR")) {
    if (!/^FR[0-9A-Z]{2}\d{9}$/.test(value)) {
      return {
        valid: false,
        error: "Un numéro de TVA français comporte FR, 2 caractères de clé puis les 9 chiffres du SIREN.",
      };
    }
    const siren = value.slice(4);
    const sirenCheck = validateSiren(siren);
    if (!sirenCheck.valid) return { valid: false, error: "Le SIREN contenu dans le numéro de TVA n'est pas valide." };
    if (/^\d{2}$/.test(value.slice(2, 4)) && computeFrVatNumber(siren) !== value) {
      return { valid: false, error: "La clé du numéro de TVA ne correspond pas au SIREN." };
    }
    if (expectedSiren && siren !== normalizeIdentifier(expectedSiren)) {
      return { valid: false, error: "Le numéro de TVA ne correspond pas au SIREN saisi." };
    }
    return { valid: true, value };
  }
  if (!/^[A-Z]{2}[0-9A-Z]{2,13}$/.test(value)) {
    return { valid: false, error: "Format de numéro de TVA intracommunautaire non reconnu." };
  }
  return { valid: true, value };
}

/** Code APE / NAF : 4 chiffres + 1 lettre (ex. 4321A). */
export function validateApeCode(input: string): ValidationResult {
  const value = normalizeIdentifier(input);
  if (!/^\d{4}[A-Z]$/.test(value)) {
    return { valid: false, error: "Le code APE comporte 4 chiffres suivis d'une lettre (ex. 4321A)." };
  }
  return { valid: true, value };
}

/** Affichage lisible : SIREN « 123 456 789 », SIRET « 123 456 789 00012 ». */
export function formatSiren(siren: string): string {
  const s = normalizeIdentifier(siren);
  return s.length === 9 ? `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}` : s;
}

export function formatSiret(siret: string): string {
  const s = normalizeIdentifier(siret);
  return s.length === 14 ? `${formatSiren(s.slice(0, 9))} ${s.slice(9)}` : s;
}
