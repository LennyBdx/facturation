import { ShieldCheck } from "lucide-react";
import { guarantees } from "@/content/home";
import { ICONS } from "../icons";

/** Grille de garanties (titre + pastille surlignée), uniquement des fonctions réelles du produit. */
export function Guarantees() {
  return (
    <section aria-labelledby="guarantees-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2
            id="guarantees-title"
            className="text-3xl font-bold tracking-tight text-balance md:text-5xl"
          >
            {guarantees.title}
          </h2>
          <p className="mt-4 inline-block -rotate-1 rounded-md bg-accent px-3 py-1 text-lg font-semibold text-primary">
            {guarantees.highlight}
          </p>
        </div>
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {guarantees.items.map((g) => {
            const Icon = ICONS[g.icon] ?? ShieldCheck;
            return (
              <li key={g.title} className="reveal">
                <span
                  aria-hidden
                  className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent text-primary"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="border-b pb-3 font-semibold">{g.title}</h3>
                <p className="mt-3 text-muted-foreground">{g.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
