import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { PRODUCT_NAME } from "@/config/site";
import { cta, nav } from "@/content/home";
import { MobileNav } from "./mobile-nav";

/** En-tête public collant. Seul le tiroir mobile est un composant client. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={ROUTES.home} className="flex min-h-11 items-center gap-2 font-semibold tracking-tight" aria-label={`${PRODUCT_NAME}, accueil`}>
          <span aria-hidden className="size-3 rotate-45 rounded-[2px] bg-brand" />
          <span className="truncate">{PRODUCT_NAME}</span>
        </Link>
        <nav aria-label="Navigation principale" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" className="hidden rounded-full sm:inline-flex">
            <Link href={ROUTES.signIn}>{cta.signIn}</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href={ROUTES.signUp}>
              <span className="sm:hidden">Essayer</span>
              <span className="hidden sm:inline">{cta.primary}</span>
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
