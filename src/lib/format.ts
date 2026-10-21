/**
 * Formats français : dates JJ/MM/AAAA, montants « 1 250,00 € ».
 * Les montants restent des chaînes décimales ; la conversion en `number` n'a lieu
 * qu'ici, pour l'affichage (Intl), jamais pour un calcul.
 */
import type { Money, Percent } from "@/domain/money";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });
const percent = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export function formatMoney(value: Money | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return euro.format(Number(value));
}

export function formatQuantity(value: string): string {
  return decimal.format(Number(value));
}

export function formatPercent(value: Percent): string {
  return `${percent.format(Number(value))} %`;
}

/** `2026-10-18` → `18/10/2026`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** Horodatage → `18/10/2026 à 14:32` (heure de Paris). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateTime.format(new Date(iso)).replace(" ", " à ");
}

const longDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
export function formatLongDate(iso: string): string {
  return longDate.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

/** Échéance relative : « dans 5 jours », « aujourd'hui », « en retard de 3 jours ». */
export function formatDueIn(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days > 0) return `dans ${days} jour${days > 1 ? "s" : ""}`;
  const late = -days;
  return `en retard de ${late} jour${late > 1 ? "s" : ""}`;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function formatAddress(a: {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
}): string {
  return [a.line1, a.line2, `${a.postalCode} ${a.city}`].filter(Boolean).join(", ");
}
