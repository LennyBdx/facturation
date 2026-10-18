"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SelectField, TextField } from "@/components/forms/form-fields";
import { applyActionResult } from "@/components/forms/submit";
import { Button } from "@/components/ui/button";
import { emailSchema } from "@/lib/validation";
import { changeRoleAction, type InviteInput, inviteMemberAction } from "./actions";

const schema = z.object({ email: emailSchema, role: z.enum(["admin", "member"]) });

export const ROLE_OPTIONS = [
  { value: "admin", label: "Administrateur — gère l'équipe et les paramètres" },
  { value: "member", label: "Membre — devis, factures et chantiers" },
];

export function InviteForm() {
  const router = useRouter();
  const form = useForm<InviteInput>({ resolver: zodResolver(schema), defaultValues: { email: "", role: "member" }, mode: "onBlur" });
  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start"
      onSubmit={form.handleSubmit(async (v) => {
        const r = await inviteMemberAction(v);
        if (applyActionResult(form, r)) {
          form.reset({ email: "", role: "member" });
          router.refresh();
        }
      })}
    >
      <TextField control={form.control} name="email" label="Adresse e-mail" type="email" autoComplete="off" required />
      <SelectField control={form.control} name="role" label="Rôle" required options={ROLE_OPTIONS} />
      <Button type="submit" className="sm:mt-6" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 aria-hidden className="animate-spin" /> : <UserPlus aria-hidden />}
        Inviter
      </Button>
    </form>
  );
}

export function RoleSelect({ membershipId, role, name }: { membershipId: string; role: "admin" | "member"; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label={`Rôle de ${name}`}
      className="h-11 rounded-md border border-input bg-card px-2 text-base md:h-9 md:text-sm"
      defaultValue={role}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          const r = await changeRoleAction(membershipId, e.target.value as "admin" | "member");
          if (r.ok) {
            toast.success(r.message);
            router.refresh();
          } else toast.error(r.error);
        })
      }
    >
      <option value="admin">Administrateur</option>
      <option value="member">Membre</option>
    </select>
  );
}
