import { z } from "zod";
import { emailSchema, passwordSchema, requiredText } from "@/lib/validation";

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

export const signUpSchema = z.object({
  firstName: requiredText("Prénom", 80),
  lastName: requiredText("Nom", 80),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.boolean().refine((v) => v, "Vous devez accepter les conditions d'utilisation."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
