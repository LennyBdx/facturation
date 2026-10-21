/** Contraste WCAG d'une couleur hexadécimale sur fond blanc. */
export function contrastOnWhite(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1]!, 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l =
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255);
  return 1.05 / (l + 0.05);
}

/**
 * Couleur d'accent personnalisée du document, avec garde-fou d'accessibilité :
 * si le texte blanc sur cette couleur n'atteint pas 4,5:1, on revient au primaire.
 */
export function safeAccent(hex: string | undefined): string {
  return hex && contrastOnWhite(hex) >= 4.5 ? hex : "var(--primary)";
}
