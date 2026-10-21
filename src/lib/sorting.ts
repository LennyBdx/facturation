/** Tri des listes : paramètre d'URL `tri=cle` (croissant) ou `tri=-cle` (décroissant). */

export type SortDir = "asc" | "desc";

export interface Sort<K extends string = string> {
  key: K;
  dir: SortDir;
}

export type Comparator<T> = (a: T, b: T) => number;

/** Lit `tri` ; une clé inconnue renvoie le tri par défaut. */
export function parseSort<K extends string>(
  raw: string | undefined,
  keys: readonly K[],
  fallback: Sort<K>,
): Sort<K> {
  if (!raw) return fallback;
  const desc = raw.startsWith("-");
  const key = (desc ? raw.slice(1) : raw) as K;
  return keys.includes(key) ? { key, dir: desc ? "desc" : "asc" } : fallback;
}

export function formatSort(sort: Sort): string {
  return sort.dir === "desc" ? `-${sort.key}` : sort.key;
}

/** Clic sur une colonne : inverse le sens si elle est déjà triée, sinon `firstDir`. */
export function toggleSort<K extends string>(
  current: Sort<K>,
  key: K,
  firstDir: SortDir = "asc",
): Sort<K> {
  if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key, dir: firstDir };
}

/** Copie triée (tri stable : à égalité, l'ordre d'origine est conservé). */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  sort: Sort<K>,
  comparators: Record<K, Comparator<T>>,
): T[] {
  const compare = comparators[sort.key];
  const sign = sort.dir === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compare(a.row, b.row) || a.index - b.index)
    .map((x) => x.row);
}

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

/** Comparateurs usuels : texte (ordre français), dates ISO, nombres décimaux en chaîne. */
export const by = {
  text:
    <T>(get: (row: T) => string | null | undefined): Comparator<T> =>
    (a, b) =>
      collator.compare(get(a) ?? "", get(b) ?? ""),
  isoDate:
    <T>(get: (row: T) => string | null | undefined): Comparator<T> =>
    (a, b) =>
      (get(a) ?? "").localeCompare(get(b) ?? ""),
  decimal:
    <T>(get: (row: T) => string): Comparator<T> =>
    (a, b) =>
      Number(get(a)) - Number(get(b)),
};
