"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import connexion from "../../../public/images/auth/connexion.jpg";
import inscription from "../../../public/images/auth/inscription.jpg";

/** Photo de fond du panneau d'accueil, propre à chaque écran d'authentification. */
const VISUALS = {
  [routes.signUp]: inscription,
} as Record<string, typeof connexion>;

export function AuthVisual() {
  const pathname = usePathname();
  const src = VISUALS[pathname] ?? connexion;
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="(min-width: 1024px) 60vw, 1px"
        className="object-cover"
      />
      {/* Voile de la couleur primaire : garantit le contraste du texte sur la photo. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/45"
      />
    </>
  );
}
