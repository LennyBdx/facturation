import type { UNITS } from "@/data/types";

/** Libellés d'unités lisibles. */
export const UNIT_LABELS: Record<(typeof UNITS)[number], string> = {
  u: "u",
  m: "m",
  "m²": "m²",
  "m³": "m³",
  ml: "ml",
  h: "h",
  j: "jour",
  forfait: "forfait",
  "ens.": "ens.",
  kg: "kg",
  l: "l",
};

/** Liste native (plus rapide au clavier qu'un menu personnalisé). */
export const nativeSelect =
  "h-11 w-full rounded-md border border-input bg-card px-2 text-base md:h-10 md:text-sm focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive";

export function errorId(errors: Record<string, string>, path: string): string | undefined {
  return errors[path] ? `err-${path}` : undefined;
}

/** Message d'erreur relié au champ (aria-describedby) et annoncé. */
export function ErrorText({ errors, path }: { errors: Record<string, string>; path: string }) {
  return errors[path] ? (
    <p id={`err-${path}`} role="alert" className="mt-1 text-sm text-destructive">
      {errors[path]}
    </p>
  ) : null;
}
