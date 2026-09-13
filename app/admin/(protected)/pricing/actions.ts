"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { setPricingTiers, type PricingTiers } from "@/lib/data/settings";

export interface PricingFormState {
  error?: string;
  success?: boolean;
}

const TierSchema = z.object({
  label: z.string().trim().min(1),
  pricePer100g: z.coerce.number().min(0),
  itemsLabel: z.string().trim().min(1),
  tagline: z.string().trim().optional(),
  priceQuart: z.coerce.number().min(0),
  priceDemi: z.coerce.number().min(0),
  pricePlateau: z.string().trim().optional(), // empty string = no plateau size
});

const TIER_KEYS = ["classique", "premium", "prestige", "oro"] as const;

export async function updatePricingTiers(
  _prevState: PricingFormState | undefined,
  formData: FormData
): Promise<PricingFormState> {
  const session = await requireSession();

  const tiers = {} as PricingTiers;
  for (const key of TIER_KEYS) {
    // formData.get() returns null (not undefined) for a field that isn't in
    // the form at all — Oro has no pricePlateau input, Classique/Oro have no
    // tagline input — but z.string().optional() only accepts undefined, so
    // null must be normalized first or validation silently fails.
    const field = (name: string) => formData.get(name) ?? undefined;
    const parsed = TierSchema.safeParse({
      label: field(`${key}_label`),
      pricePer100g: field(`${key}_pricePer100g`),
      itemsLabel: field(`${key}_itemsLabel`),
      tagline: field(`${key}_tagline`),
      priceQuart: field(`${key}_priceQuart`),
      priceDemi: field(`${key}_priceDemi`),
      pricePlateau: field(`${key}_pricePlateau`),
    });
    if (!parsed.success) {
      return { error: `${key}: ${parsed.error.issues[0]?.message ?? "données invalides"}` };
    }
    const d = parsed.data;
    tiers[key] = {
      label: d.label,
      pricePer100g: d.pricePer100g,
      itemsLabel: d.itemsLabel,
      tagline: d.tagline || null,
      priceQuart: d.priceQuart,
      priceDemi: d.priceDemi,
      pricePlateau: d.pricePlateau ? Number(d.pricePlateau) : null,
    };
  }

  await setPricingTiers(tiers, session.userId);
  // "/" and "/admin" are separate root layouts — both need revalidating.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { success: true };
}
