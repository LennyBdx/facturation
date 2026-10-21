import { notFound } from "next/navigation";
import { env } from "@/config/env";

/** Pages de suivi interne : fermées en production sauf ENABLE_DEBUG_PAGES=true. */
export default function DebugLayout({ children }: { children: React.ReactNode }) {
  if (!env.debugPagesEnabled) notFound();
  return children;
}
