import type { MetadataRoute } from "next";
import { APP_BASE } from "@/config/routes";
import { SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [`${APP_BASE}/`, "/onboarding", "/debug/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
