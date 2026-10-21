import { PRODUCT_NAME, SITE_DESCRIPTION, SITE_URL } from "@/config/site";
import { faq } from "@/content/home";

/** Données structurées : application (sans note ni avis inventés) et FAQ. */
export function HomeJsonLd() {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: PRODUCT_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    inLanguage: "fr-FR",
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  // Échappement de « < » pour empêcher toute fermeture prématurée de la balise script.
  const json = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={json(software)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={json(faqPage)} />
    </>
  );
}
