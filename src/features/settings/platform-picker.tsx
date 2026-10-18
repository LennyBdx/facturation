"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PlatformInfo } from "@/integrations/e-invoicing";
import { connectPlatformAction, disconnectPlatformAction } from "./actions";

export function PlatformPicker({ platforms, current, connected }: { platforms: PlatformInfo[]; current: string | null; connected: boolean }) {
  const router = useRouter();
  const [choice, setChoice] = useState(current ?? "");
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.message);
        router.refresh();
      } else toast.error(r.error);
    });

  return (
    <div className="space-y-4">
      <RadioGroup value={choice} onValueChange={setChoice} aria-label="Plateforme agréée" className="gap-2">
        {platforms.map((p) => (
          <Label
            key={p.id}
            htmlFor={`pf-${p.id}`}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/50"
          >
            <RadioGroupItem id={`pf-${p.id}`} value={p.id} className="mt-0.5" />
            <span>
              <span className="block font-medium">{p.name}</span>
              <span className="block text-sm font-normal text-muted-foreground">{p.description}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!choice || pending || (connected && choice === current)} onClick={() => run(() => connectPlatformAction(choice))}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Plug aria-hidden />}
          {connected && choice !== current ? "Changer de plateforme" : "Connecter"}
        </Button>
        {connected ? (
          <Button variant="outline" disabled={pending} onClick={() => run(disconnectPlatformAction)}>
            <Unplug aria-hidden />
            Déconnecter
          </Button>
        ) : null}
      </div>
    </div>
  );
}
