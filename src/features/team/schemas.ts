import { z } from "zod";
import { emailSchema } from "@/lib/validation";

export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(["admin", "member"], { error: "Choisissez un rôle." }),
});
export type InviteInput = z.input<typeof inviteSchema>;
