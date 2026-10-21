"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { routes } from "@/config/routes";
import { PRODUCT_NAME } from "@/config/site";
import { cta, nav } from "@/content/home";

/** Tiroir de navigation (mobile et tablette). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)]">
        <SheetHeader>
          <SheetTitle>{PRODUCT_NAME}</SheetTitle>
          <SheetDescription className="sr-only">Menu de navigation du site</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigation du site" className="px-4">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-md px-3 text-base hover:bg-secondary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-2 p-4">
          <Button asChild size="lg" className="w-full rounded-full">
            <Link href={routes.signUp}>{cta.primary}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full rounded-full">
            <Link href={routes.signIn}>{cta.signIn}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
