import { ShieldCheck } from "lucide-react";
import { APP_NAME, APP_TAGLINE, E_INVOICING_READY_LABEL } from "@/config/app";
import { AuthVisual } from "@/features/auth/auth-visual";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,32rem)]">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div aria-hidden className="absolute inset-0 -z-10">
          <AuthVisual />
        </div>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-md bg-primary-foreground/10"
          >
            <span className="size-3 rotate-45 rounded-[2px] bg-brand" />
          </span>
          {APP_NAME}
        </div>
        <div className="max-w-md space-y-4">
          <p className="text-3xl leading-tight font-semibold">{APP_TAGLINE}</p>
          <ul className="list-disc space-y-2 pl-5 text-primary-foreground/85">
            <li>Situations de travaux, acomptes et retenue de garantie calculés pour vous.</li>
            <li>Autoliquidation de la TVA en sous-traitance, mentions légales intégrées.</li>
            <li>Factures fournisseurs reçues et suivies au même endroit.</li>
          </ul>
        </div>
        <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
          <ShieldCheck aria-hidden className="size-4" />
          {E_INVOICING_READY_LABEL}
        </p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
