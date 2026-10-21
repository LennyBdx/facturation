import { steps } from "@/content/home";
import { Section, SectionHeading } from "../section";

export function Steps() {
  return (
    <Section labelledBy="steps-title">
      <SectionHeading id="steps-title" title={steps.title} />
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.items.map((s, i) => (
          <li key={s.title} className="reveal relative rounded-2xl border bg-card p-6">
            <span
              aria-hidden
              className="num mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
            >
              {i + 1}
            </span>
            <h3 className="text-lg font-semibold">
              <span className="sr-only">Étape {i + 1} : </span>
              {s.title}
            </h3>
            <p className="mt-1 text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
