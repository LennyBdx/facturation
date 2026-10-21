/** Échelle d'axe « ronde » : maximum et pas lisibles (0 / 5 k / 10 k / 15 k…). */
export function niceScale(maxValue: number, tickCount = 4): { max: number; ticks: number[] } {
  if (!(maxValue > 0)) return { max: 1, ticks: [0] };
  const rough = maxValue / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!;
  const max = Math.ceil(maxValue / step) * step;
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) };
}

/** Montant compact pour un axe : 12 500 → « 12,5 k € ». */
export function compactEuros(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
