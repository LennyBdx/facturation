/**
 * Droits par rôle (règle métier pure, testée). Toute Server Action déclare la
 * permission qu'elle exige ; `runAction` la vérifie côté serveur.
 */
export type Role = "owner" | "admin" | "member";

export const PERMISSIONS = [
  "client:write",
  "worksite:write",
  "quote:write",
  "invoice:draft",
  "invoice:issue",
  "invoice:payment",
  "invoice:credit",
  "received:process",
  "team:manage",
  "settings:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Un membre prépare (devis, chantiers, brouillons) ; émettre, encaisser et administrer est réservé aux administrateurs. */
const MEMBER: readonly Permission[] = [
  "client:write",
  "worksite:write",
  "quote:write",
  "invoice:draft",
];

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS,
  member: MEMBER,
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  "client:write": "gérer les clients",
  "worksite:write": "gérer les chantiers",
  "quote:write": "gérer les devis",
  "invoice:draft": "préparer des factures",
  "invoice:issue": "émettre des factures",
  "invoice:payment": "enregistrer des paiements",
  "invoice:credit": "établir des avoirs",
  "received:process": "traiter les factures reçues",
  "team:manage": "gérer l'équipe",
  "settings:manage": "modifier les paramètres",
};
