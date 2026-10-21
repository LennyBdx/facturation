import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { SITE_URL } from "@/config/site";

/** Pages publiques uniquement (l'application sous /app n'est pas indexée). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: routes.home, priority: 1 },
    { path: routes.signUp, priority: 0.6 },
    { path: routes.signIn, priority: 0.3 },
    { path: routes.contact, priority: 0.3 },
    { path: routes.legalNotice, priority: 0.1 },
    { path: routes.terms, priority: 0.1 },
    { path: routes.privacy, priority: 0.1 },
  ];
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    changeFrequency: "monthly",
    priority: p.priority,
  }));
}
