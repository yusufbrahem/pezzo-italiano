"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { setPricingTiers, PRICING_TIER_STYLES, PRICING_TIER_ICONS } from "@/lib/data/settings";

export interface PricingFormState {
  error?: string;
  success?: boolean;
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

  await setPricingTiers(tiers, session.userId);
  // "/" and "/admin" are separate root layouts — both need revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}
