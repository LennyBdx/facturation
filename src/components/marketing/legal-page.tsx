import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { ROUTES } from "@/config/routes";

/** Page légale minimale, contenu [À RÉDIGER]. */
export function LegalPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <Link href={ROUTES.home} className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> Accueil
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8 flex items-start gap-3 rounded-lg border border-dashed bg-card p-6">
        <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p>
          <strong>[À RÉDIGER]</strong> — Contenu à fournir avant la mise en ligne (à faire relire par un juriste).
        </p>
      </div>
    </div>
  );
}
