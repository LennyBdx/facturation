"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isActive, MOBILE_TABS, NAV_ITEMS } from "./nav-items";

/** Barre d'onglets basse (mobile uniquement) : 4 destinations + Menu. */
export function MobileTabBar({ badges }: { badges: { received: number; rejected: number } }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const tabs = MOBILE_TABS.map((href) => NAV_ITEMS.find((i) => i.href === href)!);

  return (
    <nav
      aria-label="Navigation principale"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((item) => {
          const active = isActive(pathname, item.href);
          const count = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-xs",
                  active ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon aria-hidden className="size-5" />
                {item.shortLabel ?? item.label}
                {count > 0 ? (
                  <span
                    className={cn(
                      "num absolute top-2 left-1/2 ml-2 min-w-5 rounded-full px-1 text-center text-[11px] leading-5 font-semibold",
                      item.badgeKey === "rejected"
                        ? "bg-danger text-primary-foreground"
                        : "bg-info text-primary-foreground",
                    )}
                  >
                    {count}
                    <span className="sr-only">
                      {item.badgeKey === "rejected" ? " à corriger" : " à traiter"}
                    </span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="flex h-16 w-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
          >
            <Menu aria-hidden className="size-5" />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
