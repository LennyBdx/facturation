import { DEMO_TODAY } from "@/config/app";

/** Date du jour (ISO AAAA-MM-JJ). Simulée dans le prototype, voir `DEMO_TODAY`. */
export function today(): string {
  return DEMO_TODAY;
}

/** Horodatage courant, aligné sur la date simulée (heure réelle conservée). */
export function nowIso(): string {
  const time = new Date().toISOString().slice(10);
  return `${DEMO_TODAY}${time}`;
}
