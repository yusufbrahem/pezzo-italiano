"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { needsApproval } from "@/lib/auth/roles";
import { getPricingTiers, PRICING_TIER_STYLES, PRICING_TIER_ICONS } from "@/lib/data/settings";
import { logActivity } from "@/lib/data/activity";
import { submitChange } from "@/lib/data/changes";
import { applyPricing } from "@/lib/menu-apply";

export interface PricingFormState {
  error?: string;
  success?: boolean;
  pending?: boolean; // saved as a proposal, waiting for the owner's approval
}

// Every price is optional — a tier can be per-100g only, sizes only, or any
// mix (e.g. Saumon can now carry a Plateau price like every other tier).
const nullableNumber = z.union([z.number().min(0), z.null()]);

const TierSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, "nom requis"),
  itemsLabel: z.string().trim().min(1, "liste d'articles requise"),
  tagline: z.string().trim().nullable(),
  badge: z.string().trim().nullable(),
  style: z.enum(PRICING_TIER_STYLES),
  icon: z.enum(PRICING_TIER_ICONS),
  pricePer100g: nullableNumber,
  priceQuart: nullableNumber,
  priceDemi: nullableNumber,
  pricePlateau: nullableNumber,
});

const TiersSchema = z.array(TierSchema).min(1, "au moins un tarif est requis");

export async function updatePricingTiers(
  _prevState: PricingFormState | undefined,
  formData: FormData
): Promise<PricingFormState> {
  const session = await requireSession();

  const raw = formData.get("tiers");
  if (typeof raw !== "string") {
    return { error: "Données de formulaire invalides." };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "Données de formulaire invalides." };
  }

  const parsed = TiersSchema.safeParse(json);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  // Empty-string labels/taglines were normalized to null client-side already,
  // but keep this defensive: empty tagline/badge strings become null.
  const tiers = parsed.data.map((t) => ({
    ...t,
    tagline: t.tagline?.trim() || null,
    badge: t.badge?.trim() || null,
  }));

  const before = await getPricingTiers().catch(() => []);
  // Field by field (not JSON.stringify: stored and parsed tiers don't share key order).
  const KEYS = ["label", "itemsLabel", "tagline", "badge", "style", "icon", "pricePer100g", "priceQuart", "priceDemi", "pricePlateau"] as const;
  const sig = (t: Record<string, unknown>) => KEYS.map((k) => String(t[k] ?? "")).join("|");
  const oldById = new Map(before.map((t) => [t.id, sig(t as unknown as Record<string, unknown>)]));
  const changed = [
    ...tiers.filter((t) => oldById.get(t.id) !== sig(t)).map((t) => t.label),
    ...before.filter((t) => !tiers.some((n) => n.id === t.id)).map((t) => `${t.label} (retiré)`),
  ];
  const pending = needsApproval(session.role);
  // Staff / administrators: stored as a proposal for the owner to approve.
  if (pending) {
    await logActivity({ userId: session.userId, action: "pricing_update", details: { pending: true, changed } });
    await submitChange("pricing", null, { tiers }, "Modifier les tarifs", session.userId);
    return { success: true, pending: true };
  }
  const r = await applyPricing(tiers, { authorId: session.userId });
  await logActivity({ userId: session.userId, action: "pricing_update", details: { pending: false, changed, version: r.versionId } });
  return { success: true };
}
