import type { MetadataRoute } from "next";
import { ROUTES } from "@/config/routes";
import { SITE_URL } from "@/config/site";

/** Pages publiques uniquement (l'application sous /app n'est pas indexée). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: ROUTES.home, priority: 1 },
    { path: ROUTES.signUp, priority: 0.6 },
    { path: ROUTES.signIn, priority: 0.3 },
    { path: ROUTES.contact, priority: 0.3 },
    { path: ROUTES.legalNotice, priority: 0.1 },
    { path: ROUTES.terms, priority: 0.1 },
    { path: ROUTES.privacy, priority: 0.1 },
  ];
  return pages.map((p) => ({ url: `${SITE_URL}${p.path}`, changeFrequency: "monthly", priority: p.priority }));
}
