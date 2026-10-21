import {
  FileText,
  HardHat,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badgeKey?: "received" | "rejected";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/tableau-de-bord", label: "Tableau de bord", shortLabel: "Accueil", icon: LayoutDashboard },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/chantiers", label: "Chantiers", icon: HardHat },
  { href: "/app/devis", label: "Devis", icon: FileText },
  { href: "/app/factures", label: "Factures émises", shortLabel: "Factures", icon: Receipt, badgeKey: "rejected" },
  { href: "/app/factures-recues", label: "Factures reçues", shortLabel: "Reçues", icon: Inbox, badgeKey: "received" },
  { href: "/app/equipe", label: "Équipe", icon: UsersRound },
  { href: "/app/parametres", label: "Paramètres", icon: Settings },
];

/** Barre d'onglets mobile : 4 destinations + « Menu » (règle : 5 entrées maximum). */
export const MOBILE_TABS = ["/app/tableau-de-bord", "/app/devis", "/app/factures", "/app/factures-recues"];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
