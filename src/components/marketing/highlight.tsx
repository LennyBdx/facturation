/**
 * Mot-clé souligné d'un trait de pinceau (couleur « brand »), purement décoratif :
 * le texte reste lu normalement par les lecteurs d'écran.
 */
export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 300 18"
        preserveAspectRatio="none"
        className="absolute -bottom-1 left-0 z-0 h-[0.35em] w-full text-brand sm:-bottom-2"
      >
        <path
          d="M3 13 C 70 4, 150 3, 297 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Découpe `text` autour de `highlight` pour souligner ce passage. */
export function withHighlight(text: string, highlight: string) {
  const i = text.indexOf(highlight);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <Highlight>{highlight}</Highlight>
      {text.slice(i + highlight.length)}
    </>
  );
}
