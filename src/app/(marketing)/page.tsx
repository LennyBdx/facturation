import type { Metadata } from "next";
import { HomeJsonLd } from "@/components/marketing/json-ld";
import { Faq } from "@/components/marketing/sections/faq";
import { Features } from "@/components/marketing/sections/features";
import { FinalCta } from "@/components/marketing/sections/final-cta";
import { Guarantees } from "@/components/marketing/sections/guarantees";
import { Hero } from "@/components/marketing/sections/hero";
import { Pricing } from "@/components/marketing/sections/pricing";
import { Problems } from "@/components/marketing/sections/problems";
import { Reform } from "@/components/marketing/sections/reform";
import { SocialProof } from "@/components/marketing/sections/social-proof";
import { Steps } from "@/components/marketing/sections/steps";
import { Trades } from "@/components/marketing/sections/trades";

import { PRODUCT_NAME, SITE_DESCRIPTION } from "@/config/site";
import { hero } from "@/content/home";

export const metadata: Metadata = {
  title: { absolute: `${PRODUCT_NAME} — logiciel de devis et de situations de travaux pour le BTP` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: PRODUCT_NAME,
    title: `${PRODUCT_NAME} — ${hero.title}`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: `${PRODUCT_NAME} — ${hero.title}`, description: SITE_DESCRIPTION },
};

export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <Hero />
      <Reform />
      <Problems />
      <Features />
      <Steps />
      <Trades />
      <Guarantees />
      <SocialProof />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
