/**
 * Utilitaires de construction des données fictives.
 * Tous les noms, SIREN et numéros sont inventés ; les identifiants ont un format
 * valide (clé de Luhn) mais ne correspondent à aucune entreprise réelle connue.
 */
import { computeFrVatNumber, luhnValid } from "@/domain/identifiers";
import type { LifecycleStatus } from "@/domain/lifecycle";
import { defaultCategoryForRate } from "@/domain/vat";
import type { Address, LifecycleActor, LifecycleEvent, QuoteLine, QuoteSection, Unit } from "../types";

let counter = 0;
/** Identifiant déterministe lisible (`prefix-0001`). */
export function mockId(prefix: string): string {
  counter += 1;
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}
export function resetMockIds(): void {
  counter = 0;
}

/** Complète `base` (8 chiffres) par la clé de Luhn : SIREN fictif valide. */
export function fakeSiren(base: string): string {
  for (let d = 0; d <= 9; d++) {
    const candidate = `${base}${d}`;
    if (luhnValid(candidate)) return candidate;
  }
  throw new Error("unreachable");
}

/** SIRET fictif valide : SIREN + NIC de 4 chiffres + clé. */
export function fakeSiret(siren: string, nic = "0001"): string {
  for (let d = 0; d <= 9; d++) {
    const candidate = `${siren}${nic}${d}`;
    if (luhnValid(candidate)) return candidate;
  }
  throw new Error("unreachable");
}

export function company(sirenBase: string) {
  const siren = fakeSiren(sirenBase);
  return { siren, siret: fakeSiret(siren), vatNumber: computeFrVatNumber(siren) };
}

export function address(line1: string, postalCode: string, city: string): Address {
  return { line1, postalCode, city, countryCode: "FR" };
}

export function line(description: string, quantity: string, unit: Unit, unitPrice: string, vatRate = "20.00"): QuoteLine {
  return { id: mockId("ql"), description, quantity, unit, unitPrice, vatRate, vatCategory: defaultCategoryForRate(vatRate) };
}

export function section(title: string, lines: QuoteLine[]): QuoteSection {
  return { id: mockId("qs"), title, lines };
}

/** Horodatage à une date donnée, heure fixe. */
export function at(date: string, time = "09:00"): string {
  return `${date}T${time}:00.000Z`;
}

type Step = [status: LifecycleStatus, hoursAfterStart: number, actor?: LifecycleActor, comment?: string];

/** Frise d'événements du cycle de vie à partir d'une date de dépôt. */
export function lifecycle(startDate: string, steps: Step[]): LifecycleEvent[] {
  const start = Date.parse(at(startDate, "10:00"));
  return steps.map(([status, hours, actor = "platform", comment]) => ({
    id: mockId("ev"),
    status,
    at: new Date(start + hours * 3_600_000).toISOString(),
    actor,
    comment,
  }));
}

/** Parcours nominal d'une facture émise jusqu'à un statut donné. */
export function nominalPath(until: LifecycleStatus): Step[] {
  const path: Step[] = [
    ["deposited", 0, "seller"],
    ["issued", 0.1],
    ["received", 0.2],
    ["made_available", 0.3],
    ["in_hand", 26, "buyer"],
    ["approved", 74, "buyer"],
  ];
  const idx = path.findIndex(([s]) => s === until);
  return idx === -1 ? path : path.slice(0, idx + 1);
}
