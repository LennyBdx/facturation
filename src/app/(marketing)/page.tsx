import { Faq } from "@/components/marketing/sections/faq";
import { Features } from "@/components/marketing/sections/features";
import { FinalCta } from "@/components/marketing/sections/final-cta";
import { Hero } from "@/components/marketing/sections/hero";
import { Pricing } from "@/components/marketing/sections/pricing";
import { Problems } from "@/components/marketing/sections/problems";
import { Reform } from "@/components/marketing/sections/reform";
import { SocialProof } from "@/components/marketing/sections/social-proof";
import { Steps } from "@/components/marketing/sections/steps";
import { Trades } from "@/components/marketing/sections/trades";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reform />
      <Problems />
      <Features />
      <Steps />
      <Trades />
      <SocialProof />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
