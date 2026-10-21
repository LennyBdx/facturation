import type { FilterOption } from "@/components/app/list-toolbar";

type SortKind = "text" | "number" | "date";

const SUFFIX: Record<SortKind, [asc: string, desc: string]> = {
  text: ["A → Z", "Z → A"],
  number: ["croissant", "décroissant"],
  date: ["plus anciennes d'abord", "plus récentes d'abord"],
};

/** Options du sélecteur de tri mobile : deux sens par colonne triable. */
export function sortOptions(
  columns: { key: string; label: string; kind: SortKind }[],
): FilterOption[] {
  return columns.flatMap(({ key, label, kind }) => [
    { value: key, label: `${label} (${SUFFIX[kind][0]})` },
    { value: `-${key}`, label: `${label} (${SUFFIX[kind][1]})` },
  ]);
}
