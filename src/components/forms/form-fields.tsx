"use client";

import { useId, useState } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Champs de formulaire accessibles (règles du skill) :
 * libellé visible, astérisque pour l'obligatoire, aide sous le champ,
 * erreur reliée par aria-describedby et annoncée (role="alert").
 */

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  description?: React.ReactNode;
  className?: string;
}

function Label({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <FieldLabel htmlFor={htmlFor}>
      {label}
      {required ? (
        <span aria-hidden className="text-destructive">
          *
        </span>
      ) : null}
    </FieldLabel>
  );
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  className,
  ...input
}: BaseProps<T> & Omit<React.ComponentProps<typeof Input>, "name" | "required">) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <Label htmlFor={id} label={label} required={required} />
          <Input
            {...input}
            {...field}
            value={field.value ?? ""}
            id={id}
            aria-required={required || undefined}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={
              cn(description && `${id}-desc`, fieldState.error && `${id}-err`) || undefined
            }
          />
          {description ? (
            <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
          ) : null}
          <FieldError id={`${id}-err`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function PasswordField<T extends FieldValues>(
  props: BaseProps<T> & { autoComplete: string },
) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const { control, name, label, required, description, autoComplete, className } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <Label htmlFor={id} label={label} required={required} />
          <div className="relative">
            <Input
              {...field}
              value={field.value ?? ""}
              id={id}
              type={visible ? "text" : "password"}
              autoComplete={autoComplete}
              className="pr-12"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={
                cn(description && `${id}-desc`, fieldState.error && `${id}-err`) || undefined
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={visible}
            >
              {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </div>
          {description ? (
            <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
          ) : null}
          <FieldError id={`${id}-err`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  className,
  rows = 3,
}: BaseProps<T> & { rows?: number }) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <Label htmlFor={id} label={label} required={required} />
          <Textarea
            {...field}
            value={field.value ?? ""}
            id={id}
            rows={rows}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={
              cn(description && `${id}-desc`, fieldState.error && `${id}-err`) || undefined
            }
          />
          {description ? (
            <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
          ) : null}
          <FieldError id={`${id}-err`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  className,
  options,
  placeholder = "Choisir…",
}: BaseProps<T> & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className={className}>
          <Label htmlFor={id} label={label} required={required} />
          <Select value={field.value ?? ""} onValueChange={field.onChange} name={field.name}>
            <SelectTrigger
              id={id}
              className="w-full"
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={
                cn(description && `${id}-desc`, fieldState.error && `${id}-err`) || undefined
              }
              onBlur={field.onBlur}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? (
            <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
          ) : null}
          <FieldError id={`${id}-err`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
}: BaseProps<T>) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field
          orientation="horizontal"
          className={cn("items-start justify-between gap-4 rounded-lg border p-3", className)}
        >
          <div className="space-y-0.5">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {description ? (
              <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
            ) : null}
          </div>
          <Switch
            id={id}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            aria-describedby={description ? `${id}-desc` : undefined}
          />
        </Field>
      )}
    />
  );
}

/** Résumé d'erreurs en tête de formulaire (en plus des erreurs sous chaque champ). */
export function FormErrorSummary({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  );
}
