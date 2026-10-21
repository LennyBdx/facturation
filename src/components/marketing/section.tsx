import { cn } from "@/lib/utils";

/** Section de page vitrine : largeur de contenu 72 rem, rythme 64 px (mobile) / 96 px (ordinateur). */
export function Section({
  id,
  labelledBy,
  className,
  tone = "default",
  children,
}: {
  id?: string;
  labelledBy: string;
  className?: string;
  tone?: "default" | "card";
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("py-16 md:py-24", tone === "card" && "border-y bg-card", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({ id, title, intro, align = "center" }: { id: string; title: string; intro?: string; align?: "center" | "left" }) {
  return (
    <div className={cn("mb-10 max-w-2xl md:mb-14", align === "center" && "mx-auto text-center")}>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {intro ? <p className="mt-3 text-lg text-muted-foreground">{intro}</p> : null}
    </div>
  );
}
