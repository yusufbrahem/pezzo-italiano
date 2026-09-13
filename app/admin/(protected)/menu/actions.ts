"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

// Best-effort — an orphaned blob costs a little storage, never worth
// failing the actual DB mutation over.
async function deleteBlobIfOwned(url: string | null | undefined) {
  if (url && url.includes(".public.blob.vercel-storage.com/")) {
    try {
      await del(url);
    } catch {
      // ignore
    }
  }
}

const CATEGORIES = ["pizza", "desserts", "boissons", "supplements", "partager"] as const;

const num = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().min(0).optional()
);

const MenuItemSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  description: z.string().trim().default(""),
  category: z.enum(CATEGORIES),
  priceText: z.string().trim().optional(),
  priceNumeric: num,
  pricePer100g: num,
  priceQuart: num,
  priceDemi: num,
  pricePlateau: num,
  image: z.string().trim().optional(),
  imagePosition: z.string().trim().optional(),
  tags: z.string().trim().optional(), // comma-separated in the form
  isSignature: z.boolean(),
  isVegetarian: z.boolean(),
  isComingSoon: z.boolean(),
  isCustom: z.boolean(),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
  isDevPick: z.boolean(),
  isPublished: z.boolean(),
});

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return MenuItemSchema.safeParse({
    ...raw,
    isSignature: formData.get("isSignature") === "on",
    isVegetarian: formData.get("isVegetarian") === "on",
    isComingSoon: formData.get("isComingSoon") === "on",
    isCustom: formData.get("isCustom") === "on",
    isNew: formData.get("isNew") === "on",
    isBestseller: formData.get("isBestseller") === "on",
    isDevPick: formData.get("isDevPick") === "on",
    isPublished: formData.get("isPublished") === "on",
  });
}

export interface MenuItemFormState {
  error?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (Unicode combining diacritical marks)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_PREFIX: Record<(typeof CATEGORIES)[number], string> = {
  pizza: "pizza",
  desserts: "dessert",
  boissons: "boi",
  supplements: "sup",
  partager: "partager",
};

async function revalidateSite() {
  // "/" and "/admin" are separate root layouts (see app/admin/layout.tsx) —
  // revalidating one does not cascade to the other, so both need it
  // explicitly for the change to show up live in both places immediately.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

export async function createMenuItem(
  _prevState: MenuItemFormState | undefined,
  formData: FormData
): Promise<MenuItemFormState> {
  await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const data = parsed.data;

  const baseId = `${CATEGORY_PREFIX[data.category]}-${slugify(data.name)}`;
  let id = baseId;
  for (let i = 2; i < 20; i++) {
    const existing = await sql`SELECT 1 FROM menu_items WHERE id = ${id}`;
    if (existing.length === 0) break;
    id = `${baseId}-${i}`;
  }

  const sortRows = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM menu_items WHERE category = ${data.category}`;
  const sortOrder = sortRows[0].next;

  const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await sql`
    INSERT INTO menu_items (
      id, name, description, category, price_text, price_numeric,
      price_per_100g, price_quart, price_demi, price_plateau,
      image, image_position, tags,
      is_signature, is_vegetarian, is_coming_soon, is_custom,
      is_new, is_bestseller, is_dev_pick, is_published, sort_order
    ) VALUES (
      ${id}, ${data.name}, ${data.description}, ${data.category},
      ${data.priceText || null}, ${data.priceNumeric ?? null},
      ${data.pricePer100g ?? null}, ${data.priceQuart ?? null}, ${data.priceDemi ?? null}, ${data.pricePlateau ?? null},
      ${data.image || null}, ${data.imagePosition || null}, ${tags},
      ${data.isSignature}, ${data.isVegetarian}, ${data.isComingSoon}, ${data.isCustom},
      ${data.isNew}, ${data.isBestseller}, ${data.isDevPick}, ${data.isPublished}, ${sortOrder}
    )
  `;

  await revalidateSite();
  redirect("/admin/menu");
}

export async function updateMenuItem(
  id: string,
  _prevState: MenuItemFormState | undefined,
  formData: FormData
): Promise<MenuItemFormState> {
  await requireSession();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const data = parsed.data;
  const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const existingRows = await sql`SELECT image FROM menu_items WHERE id = ${id}`;
  const previousImage = existingRows[0]?.image as string | null | undefined;

  await sql`
    UPDATE menu_items SET
      name = ${data.name},
      description = ${data.description},
      category = ${data.category},
      price_text = ${data.priceText || null},
      price_numeric = ${data.priceNumeric ?? null},
      price_per_100g = ${data.pricePer100g ?? null},
      price_quart = ${data.priceQuart ?? null},
      price_demi = ${data.priceDemi ?? null},
      price_plateau = ${data.pricePlateau ?? null},
      image = ${data.image || null},
      image_position = ${data.imagePosition || null},
      tags = ${tags},
      is_signature = ${data.isSignature},
      is_vegetarian = ${data.isVegetarian},
      is_coming_soon = ${data.isComingSoon},
      is_custom = ${data.isCustom},
      is_new = ${data.isNew},
      is_bestseller = ${data.isBestseller},
      is_dev_pick = ${data.isDevPick},
      is_published = ${data.isPublished},
      updated_at = now()
    WHERE id = ${id}
  `;

  if (previousImage && previousImage !== data.image) {
    await deleteBlobIfOwned(previousImage);
  }

  await revalidateSite();
  redirect("/admin/menu");
}

// Quick one-click status flip from the menu list — doesn't touch any other
// field, so it's safe to fire from a plain button with no confirmation.
export async function togglePublished(id: string, published: boolean) {
  await requireSession();
  await sql`UPDATE menu_items SET is_published = ${published}, updated_at = now() WHERE id = ${id}`;
  await revalidateSite();
}

export async function deleteMenuItem(id: string) {
  await requireSession();
  const rows = await sql`SELECT image FROM menu_items WHERE id = ${id}`;
  await sql`DELETE FROM menu_items WHERE id = ${id}`;
  await deleteBlobIfOwned(rows[0]?.image as string | null | undefined);
  await revalidateSite();
}

// Drag-and-drop reorder — persists the full new order for one category in a
// single transaction (all-or-nothing, so a failure never leaves sort_order
// half-updated).
export async function reorderMenuItems(category: string, orderedIds: string[]) {
  await requireSession();
  if (orderedIds.length === 0) return;

  await sql.transaction((tx) =>
    orderedIds.map(
      (id, index) => tx`UPDATE menu_items SET sort_order = ${index} WHERE id = ${id} AND category = ${category}`
    )
  );

  await revalidateSite();
}
