import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/home";

const page = legalPages["mentions-legales"];

export const metadata: Metadata = { title: page.title, description: page.description };

export default function Page() {
  return <LegalPage title={page.title} description={page.description} />;
}
