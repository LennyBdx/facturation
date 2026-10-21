import { Features } from "@/components/marketing/sections/features";
import { Hero } from "@/components/marketing/sections/hero";
import { Problems } from "@/components/marketing/sections/problems";
import { Reform } from "@/components/marketing/sections/reform";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reform />
      <Problems />
      <Features />
    </>
  );
}
