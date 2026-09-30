import "server-only";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { sql } from "@/lib/db";
import type { MenuItem } from "@/data/menu";
import { setPricingTiers, setShowComingSoon, type PricingTiers } from "@/lib/data/settings";

// The functions that actually change what the public site shows (menu items,
// pricing tiers, the "Bientôt disponible" switch). Called directly when the
// owner saves, and by approveChange() when the owner approves someone else's
// proposal — so an approved change behaves exactly like the owner's own edit.

/** A menu item as validated from the admin form — also the pending_changes payload. */
export interface MenuItemData {
  name: string;
  description: string;
  category: MenuItem["category"];
  priceText: string | null;
  priceNumeric: number | null;
  pricePer100g: number | null;
  priceQuart: number | null;
  priceDemi: number | null;
  pricePlateau: number | null;
  image: string | null;
  extraImages: string[];
  imagePosition: string | null;
  tags: string[];
  isSignature: boolean;
  isVegetarian: boolean;
  isComingSoon: boolean;
  isCustom: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isDevPick: boolean;
  isPublished: boolean;
}

/** For pre-filling the edit form / previewing a proposal like a real item. */
export function menuDataToItem(id: string, d: MenuItemData): MenuItem {
  return {
    id,
    name: d.name,
    description: d.description,
    price: d.priceText ?? d.priceNumeric ?? 0,
    category: d.category,
    image: d.image ?? undefined,
    extraImages: d.extraImages.length ? d.extraImages : undefined,
    imagePosition: d.imagePosition ?? undefined,
    tags: d.tags.length ? d.tags : undefined,
    isSignature: d.isSignature,
    isVegetarian: d.isVegetarian,
    isComingSoon: d.isComingSoon,
    isCustom: d.isCustom,
    isNew: d.isNew,
    isBestseller: d.isBestseller,
    isDevPick: d.isDevPick,
    isPublished: d.isPublished,
    pricePer100g: d.pricePer100g ?? undefined,
    priceQuart: d.priceQuart ?? undefined,
    priceDemi: d.priceDemi ?? undefined,
    pricePlateau: d.pricePlateau ?? undefined,
  };
}

export function revalidateSite() {
  // "/" and "/admin" are separate root layouts — revalidating one does not
  // cascade to the other, so both need it for the change to show everywhere.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

// Best-effort — an orphaned blob costs a little storage, never worth failing
// the actual DB mutation over.
export async function deleteBlobIfOwned(url: string | null | undefined) {
  if (url && url.includes(".public.blob.vercel-storage.com/")) {
    try {
      await del(url);
    } catch {
      // ignore
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowPhotos(row: any): string[] {
  if (!row) return [];
  return [row.image, ...(row.extra_images ?? [])].filter(Boolean);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (Unicode combining diacritical marks)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_PREFIX: Record<MenuItem["category"], string> = {
  pizza: "pizza",
  desserts: "dessert",
  boissons: "boi",
  supplements: "sup",
  partager: "partager",
};

export async function applyMenuCreate(d: MenuItemData): Promise<string> {
  const baseId = `${CATEGORY_PREFIX[d.category]}-${slugify(d.name)}`;
  let id = baseId;
  for (let i = 2; i < 20; i++) {
    const existing = await sql`SELECT 1 FROM menu_items WHERE id = ${id}`;
    if (existing.length === 0) break;
    id = `${baseId}-${i}`;
  }
  const sortRows = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM menu_items WHERE category = ${d.category}`;

  await sql`
    INSERT INTO menu_items (
      id, name, description, category, price_text, price_numeric,
      price_per_100g, price_quart, price_demi, price_plateau,
      image, extra_images, image_position, tags,
      is_signature, is_vegetarian, is_coming_soon, is_custom,
      is_new, is_bestseller, is_dev_pick, is_published, sort_order
    ) VALUES (
      ${id}, ${d.name}, ${d.description}, ${d.category}, ${d.priceText}, ${d.priceNumeric},
      ${d.pricePer100g}, ${d.priceQuart}, ${d.priceDemi}, ${d.pricePlateau},
      ${d.image}, ${d.extraImages}, ${d.imagePosition}, ${d.tags},
      ${d.isSignature}, ${d.isVegetarian}, ${d.isComingSoon}, ${d.isCustom},
      ${d.isNew}, ${d.isBestseller}, ${d.isDevPick}, ${d.isPublished}, ${sortRows[0].next}
    )
  `;
  revalidateSite();
  return id;
}

/** Returns false if the item no longer exists. */
export async function applyMenuUpdate(id: string, d: MenuItemData): Promise<boolean> {
  const existingRows = await sql`SELECT image, extra_images FROM menu_items WHERE id = ${id}`;
  if (existingRows.length === 0) return false;
  const previousPhotos = rowPhotos(existingRows[0]);

  await sql`
    UPDATE menu_items SET
      name = ${d.name}, description = ${d.description}, category = ${d.category},
      price_text = ${d.priceText}, price_numeric = ${d.priceNumeric},
      price_per_100g = ${d.pricePer100g}, price_quart = ${d.priceQuart},
      price_demi = ${d.priceDemi}, price_plateau = ${d.pricePlateau},
      image = ${d.image}, extra_images = ${d.extraImages}, image_position = ${d.imagePosition},
      tags = ${d.tags},
      is_signature = ${d.isSignature}, is_vegetarian = ${d.isVegetarian},
      is_coming_soon = ${d.isComingSoon}, is_custom = ${d.isCustom}, is_new = ${d.isNew},
      is_bestseller = ${d.isBestseller}, is_dev_pick = ${d.isDevPick}, is_published = ${d.isPublished},
      updated_at = now()
    WHERE id = ${id}
  `;

  const kept = new Set([d.image, ...d.extraImages]);
  for (const url of previousPhotos) {
    if (!kept.has(url)) await deleteBlobIfOwned(url);
  }
  revalidateSite();
  return true;
}

export async function applyMenuDelete(id: string): Promise<boolean> {
  const rows = await sql`DELETE FROM menu_items WHERE id = ${id} RETURNING image, extra_images`;
  if (rows.length === 0) return false;
  for (const url of rowPhotos(rows[0])) await deleteBlobIfOwned(url);
  revalidateSite();
  return true;
}

export async function applyPublish(id: string, published: boolean): Promise<boolean> {
  const rows = await sql`UPDATE menu_items SET is_published = ${published}, updated_at = now() WHERE id = ${id} RETURNING id`;
  revalidateSite();
  return rows.length > 0;
}

// Persists the full new order for one category in a single transaction
// (all-or-nothing, so a failure never leaves sort_order half-updated).
export async function applyReorder(category: string, orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  await sql.transaction((tx) =>
    orderedIds.map((id, index) => tx`UPDATE menu_items SET sort_order = ${index} WHERE id = ${id} AND category = ${category}`)
  );
  revalidateSite();
}

export async function applyComingSoon(visible: boolean, userId: string) {
  await setShowComingSoon(visible, userId);
  revalidateSite();
}

export async function applyPricing(tiers: PricingTiers, userId: string) {
  await setPricingTiers(tiers, userId);
  revalidateSite();
}
