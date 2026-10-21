"use server";

import { revalidatePath } from "next/cache";
import { parseCounter, validateNextValue } from "@/domain/numbering";
import { isValidRetentionRate } from "@/domain/progress-billing";
import { toMoney } from "@/domain/money";
import { emailSchema, fieldErrors } from "@/lib/validation";
import {
  billingSettingsSchema,
  type BillingSettingsInput,
  companySettingsSchema,
  type CompanySettingsInput,
  documentSettingsSchema,
  type DocumentSettingsInput,
} from "./schemas";
import { type ActionResult, getContext } from "@/services/context";

async function requireAdmin() {
  const ctx = await getContext();
  const me = await ctx.membership();
  return { ctx, error: me.role === "member" ? "Seuls les propriétaires et administrateurs peuvent modifier les paramètres." : null };
}

// --- Entreprise ----------------------------------------------------------------


export async function saveCompanyAction(input: CompanySettingsInput): Promise<ActionResult> {
  const parsed = companySettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  const v = parsed.data;
  await ctx.repos.organizations.update(ctx.orgId, {
    name: v.name,
    legalForm: v.legalForm,
    shareCapital: toMoney(v.shareCapital),
    siren: v.siren,
    siret: v.siret,
    vatNumber: v.vatNumber,
    apeCode: v.apeCode,
    registration: v.registration,
    activity: v.activity,
    address: { ...v.address, line2: v.address.line2 || undefined },
    contact: { ...ctx.org.contact, email: v.email, phone: v.phone },
    decennialInsurance: { insurer: v.insurer, policyNumber: v.policyNumber, coverageArea: v.coverageArea },
    bank: { iban: v.iban.toUpperCase(), bic: v.bic.toUpperCase() },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Informations de l'entreprise enregistrées. Elles s'appliquent aux prochains documents émis." };
}

// --- Numérotation et conditions -----------------------------------------------------


export async function saveBillingSettingsAction(input: BillingSettingsInput): Promise<ActionResult> {
  const parsed = billingSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  const v = parsed.data;
  if (!isValidRetentionRate(v.defaultRetentionRate)) return { ok: false, error: "Retenue de garantie : 5 % maximum.", fieldErrors: { defaultRetentionRate: "5 % maximum." } };

  // Numérotation continue : impossible de créer un trou ou de réutiliser un numéro.
  const invoices = await ctx.repos.invoices.list(ctx.orgId);
  const current = ctx.org.settings.numbering;
  const errors: Record<string, string> = {};
  for (const key of ["invoice", "creditNote"] as const) {
    const issued = invoices.filter((i) => i.number && (key === "creditNote" ? i.kind === "credit_note" : i.kind !== "credit_note"));
    const last = issued.length ? Math.max(...issued.map((i) => parseCounter(i.number!, current[key].prefix) ?? 0)) : null;
    const msg = validateNextValue(v[key].nextValue, last);
    if (msg) errors[`${key}.nextValue`] = msg;
    if (issued.length > 0 && v[key].prefix !== current[key].prefix) {
      errors[`${key}.prefix`] = "Le préfixe ne peut plus changer une fois des documents émis dans cette série.";
    }
  }
  if (Object.keys(errors).length) return { ok: false, error: "Numérotation : la séquence doit rester continue.", fieldErrors: errors };

  await ctx.repos.organizations.update(ctx.orgId, {
    settings: {
      ...ctx.org.settings,
      numbering: {
        quote: { ...current.quote, ...v.quote },
        invoice: { ...current.invoice, ...v.invoice },
        creditNote: { ...current.creditNote, ...v.creditNote },
      },
      defaultPaymentTermsDays: v.defaultPaymentTermsDays,
      paymentTermsLabel:
        v.defaultPaymentTermsDays === 0 ? "Paiement à réception de facture, par virement." : `Paiement à ${v.defaultPaymentTermsDays} jours date de facture, par virement.`,
      latePenaltyRate: toMoney(v.latePenaltyRate),
      defaultRetentionRate: toMoney(v.defaultRetentionRate),
      defaultDepositPercent: toMoney(v.defaultDepositPercent),
      defaultQuoteValidityDays: v.defaultQuoteValidityDays,
    },
  });
  revalidatePath("/app/parametres");
  return { ok: true, message: "Numérotation et conditions enregistrées." };
}

// --- Personnalisation des documents ---------------------------------------------


export async function saveDocumentSettingsAction(input: DocumentSettingsInput): Promise<ActionResult> {
  const parsed = documentSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont à corriger.", fieldErrors: fieldErrors(parsed.error) };
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  await ctx.repos.organizations.update(ctx.orgId, {
    settings: {
      ...ctx.org.settings,
      customLegalMentions: parsed.data.customLegalMentions ?? "",
      branding: { ...ctx.org.settings.branding, accentColor: parsed.data.accentColor.toLowerCase() },
    },
  });
  revalidatePath("/app/parametres");
  return { ok: true, message: "Personnalisation enregistrée." };
}

// --- Facture électronique (simulation) ------------------------------------------

export async function connectPlatformAction(platformId: string): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  const platforms = await ctx.provider.listPlatforms();
  if (!platforms.some((p) => p.id === platformId)) return { ok: false, error: "Plateforme inconnue." };
  await new Promise((r) => setTimeout(r, 800));
  await ctx.repos.organizations.update(ctx.orgId, {
    settings: {
      ...ctx.org.settings,
      eInvoicing: {
        platformId,
        connectionStatus: "connected",
        receptionAddress: `${ctx.org.siren}_FACTURES`,
        connectedAt: new Date().toISOString(),
      },
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Connexion simulée établie avec la plateforme agréée." };
}

export async function disconnectPlatformAction(): Promise<ActionResult> {
  const { ctx, error } = await requireAdmin();
  if (error) return { ok: false, error };
  await ctx.repos.organizations.update(ctx.orgId, {
    settings: { ...ctx.org.settings, eInvoicing: { ...ctx.org.settings.eInvoicing, connectionStatus: "not_connected", connectedAt: null } },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Plateforme déconnectée (simulation)." };
}

// --- Expert-comptable (maquette) ----------------------------------------------------

export async function inviteAccountantAction(email: string): Promise<ActionResult> {
  const r = emailSchema.safeParse(email);
  if (!r.success) return { ok: false, error: r.error.issues[0]!.message };
  return { ok: true, message: `Invitation simulée pour ${r.data} : fonctionnalité disponible dans une prochaine version.` };
}
