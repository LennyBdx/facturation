/** Pagination des listes : fonctions pures, page lue dans l'URL (?page=N). */

export const PAGE_SIZE = 20;

export interface Page<T> {
  items: T[];
  /** Page courante, de 1 à pageCount. */
  page: number;
  pageCount: number;
  total: number;
  /** Rang (1-based) du premier et du dernier élément affichés ; 0 si la liste est vide. */
  from: number;
  to: number;
}

/** Numéro de page valide à partir du paramètre d'URL (entier ≥ 1, sinon 1). */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value >= 1 ? value : 1;
}

/** Découpe une liste ; une page au-delà de la dernière renvoie la dernière. */
export function paginate<T>(
  rows: readonly T[],
  rawPage: string | string[] | undefined,
  pageSize = PAGE_SIZE,
): Page<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(parsePage(rawPage), pageCount);
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return { items, page, pageCount, total, from: total ? start + 1 : 0, to: start + items.length };
}

/**
 * Numéros à afficher : première, dernière, courante et ses voisines ; `null` = ellipse.
 * Ex. page 6 sur 12 → [1, null, 5, 6, 7, null, 12].
 */
export function pageWindow(page: number, pageCount: number, siblings = 1): (number | null)[] {
  const pages = new Set([1, pageCount]);
  for (let p = page - siblings; p <= page + siblings; p++)
    if (p >= 1 && p <= pageCount) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push(null);
    out.push(p);
  });
  return out;
}
