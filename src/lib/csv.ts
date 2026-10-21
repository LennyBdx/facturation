/**
 * Génération CSV compatible Excel en français : séparateur « ; », fins de ligne CRLF,
 * BOM UTF-8 (accents), décimales à virgule. Protège contre l'injection de formules.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const SEPARATOR = ";";
const FORMULA_START = /^[=+\-@\t\r]/;
const NUMERIC = /^-?\d+([.,]\d+)?$/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Une cellule commençant par = + - @ serait exécutée comme formule par le tableur.
  if (FORMULA_START.test(text) && !NUMERIC.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines = [
    columns.map((c) => csvCell(c.header)).join(SEPARATOR),
    ...rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(SEPARATOR)),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Montant décimal (« 1234.50 ») au format attendu par Excel en français (« 1234,50 »). */
export const csvMoney = (value: string | null | undefined) =>
  value ? value.replace(".", ",") : "";

/** Date ISO (« 2026-10-18 ») en JJ/MM/AAAA. */
export const csvDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : "";
