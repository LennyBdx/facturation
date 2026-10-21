import Image from "next/image";
import { cn } from "@/lib/utils";

interface Shot {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Cadre d'ordinateur sobre, en CSS uniquement : barre de fenêtre neutre + capture réelle. */
export function DesktopFrame({ shot, priority, className, sizes = "(min-width: 1024px) 50vw, 100vw" }: { shot: Shot; priority?: boolean; className?: string; sizes?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-lg border bg-card shadow-sm", className)}>
      <div aria-hidden className="flex h-7 items-center gap-1.5 border-b bg-secondary px-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
      </div>
      <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} priority={priority} className="h-auto w-full" />
    </figure>
  );
}

/** Cadre de téléphone sobre. */
export function PhoneFrame({ shot, priority, className, sizes = "(min-width: 1024px) 18rem, 60vw" }: { shot: Shot; priority?: boolean; className?: string; sizes?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-[2rem] border-[6px] border-foreground/85 bg-card shadow-md", className)}>
      <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} priority={priority} className="h-auto w-full" />
    </figure>
  );
}
