import { testimonials } from "@/content/home";
import { Section, SectionHeading } from "../section";

/**
 * Preuve sociale : uniquement des témoignages réels, avec accord écrit des personnes.
 * Masquée tant que la liste `testimonials` (src/content/home.ts) est vide.
 */
export function SocialProof() {
  if (testimonials.length === 0) return null;
  return (
    <Section labelledBy="social-proof-title">
      <SectionHeading id="social-proof-title" title="Ils facturent leurs chantiers avec nous" />
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.name} className="rounded-lg border bg-card p-6">
            <blockquote className="text-lg">« {t.quote} »</blockquote>
            <p className="mt-4 font-medium">{t.name}</p>
            <p className="text-sm text-muted-foreground">
              {t.role}, {t.company}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
