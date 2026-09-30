import "server-only";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { sql } from "@/lib/db";
import type { MenuItem } from "@/data/menu";
import {
  getContactSettings,
  getHoursOverride,
  getHoursSchedule,
  getPricingTiers,
  getShowComingSoon,
  setContactSettings,
  setHoursOverride,
  setHoursSchedule,
  setPricingTiers,
  setShowComingSoon,
  type ContactSettings,
  type PricingTiers,
} from "@/lib/data/settings";
import type { HoursOverride, HoursSchedule } from "@/lib/hours-shared";
import { recordVersion, type VersionMeta } from "@/lib/versions-store";

// The functions that actually change what the public site shows. Called
// directly when the owner saves, by approveChange() when the owner approves
// someone else's proposal, and by restoreVersion() — so all three behave the
// same. Each one saves a before/after snapshot (content_versions) and returns
// its id, which the activity history links to ("Voir ce qui a changé").
//
// Photos are NOT deleted from Blob storage when an item stops using them any
// more: an older version may need them back when it's restored.

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

/** What a version stores for a menu item: its data plus identity and position. */
export interface MenuItemSnapshot extends MenuItemData {
  id: string;
  sortOrder: number;
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
    extraImages: d.extraImages?.length ? d.extraImages : undefined,
    imagePosition: d.imagePosition ?? undefined,
    tags: d.tags?.length ? d.tags : undefined,
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

// Best-effort — used only for photos of proposals that were never approved.
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

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSnapshot(r: any): MenuItemSnapshot {
  return {
    id: r.id,
    sortOrder: r.sort_order,
    name: r.name,
    description: r.description,
    category: r.category,
    priceText: r.price_text ?? null,
    priceNumeric: num(r.price_numeric),
    pricePer100g: num(r.price_per_100g),
    priceQuart: num(r.price_quart),
    priceDemi: num(r.price_demi),
    pricePlateau: num(r.price_plateau),
    image: r.image ?? null,
    extraImages: r.extra_images ?? [],
    imagePosition: r.image_position ?? null,
    tags: r.tags ?? [],
    isSignature: r.is_signature,
    isVegetarian: r.is_vegetarian,
    isComingSoon: r.is_coming_soon,
    isCustom: r.is_custom,
    isNew: r.is_new,
    isBestseller: r.is_bestseller,
    isDevPick: r.is_dev_pick,
    isPublished: r.is_published,
  };
}

export async function readItemSnapshot(id: string): Promise<MenuItemSnapshot | null> {
  const rows = await sql`SELECT * FROM menu_items WHERE id = ${id}`;
  return rows[0] ? rowToSnapshot(rows[0]) : null;
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

async function insertItem(id: string, d: MenuItemData, sortOrder: number) {
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
      ${d.isNew}, ${d.isBestseller}, ${d.isDevPick}, ${d.isPublished}, ${sortOrder}
    )
  `;
}

async function updateItem(id: string, d: MenuItemData) {
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
}

// ── Menu items ────────────────────────────────────────────────────────────

export async function applyMenuCreate(d: MenuItemData, meta: VersionMeta): Promise<{ id: string; versionId: number | null }> {
  const baseId = `${CATEGORY_PREFIX[d.category]}-${slugify(d.name)}`;
  let id = baseId;
  for (let i = 2; i < 20; i++) {
    const existing = await sql`SELECT 1 FROM menu_items WHERE id = ${id}`;
    if (existing.length === 0) break;
    id = `${baseId}-${i}`;
  }
  const sortRows = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM menu_items WHERE category = ${d.category}`;
  await insertItem(id, d, sortRows[0].next);
  const after = await readItemSnapshot(id);
  const versionId = await recordVersion({ entity: "menu_item", entityId: id, label: d.name, operation: "create", before: null, after, meta });
  revalidateSite();
  return { id, versionId };
}

/** Returns null if the item no longer exists. */
export async function applyMenuUpdate(id: string, d: MenuItemData, meta: VersionMeta): Promise<{ versionId: number | null } | null> {
  const before = await readItemSnapshot(id);
  if (!before) return null;
  await updateItem(id, d);
  const after = await readItemSnapshot(id);
  const versionId = await recordVersion({ entity: "menu_item", entityId: id, label: d.name, operation: "update", before, after, meta });
  revalidateSite();
  return { versionId };
}

export async function applyMenuDelete(id: string, meta: VersionMeta): Promise<{ versionId: number | null } | null> {
  const before = await readItemSnapshot(id);
  if (!before) return null;
  await sql`DELETE FROM menu_items WHERE id = ${id}`;
  const versionId = await recordVersion({ entity: "menu_item", entityId: id, label: before.name, operation: "delete", before, after: null, meta });
  revalidateSite();
  return { versionId };
}

export async function applyPublish(id: string, published: boolean, meta: VersionMeta): Promise<{ versionId: number | null } | null> {
  const before = await readItemSnapshot(id);
  if (!before) return null;
  await sql`UPDATE menu_items SET is_published = ${published}, updated_at = now() WHERE id = ${id}`;
  const versionId = await recordVersion({
    entity: "menu_item",
    entityId: id,
    label: before.name,
    operation: "update",
    before,
    after: { ...before, isPublished: published },
    meta,
  });
  revalidateSite();
  return { versionId };
}

/** Put an item back exactly as a snapshot describes it (same id and position) — used by restores. */
export async function applyMenuItemSnapshot(s: MenuItemSnapshot, meta: VersionMeta): Promise<{ versionId: number | null }> {
  const before = await readItemSnapshot(s.id);
  if (before) {
    await updateItem(s.id, s);
    await sql`UPDATE menu_items SET sort_order = ${s.sortOrder} WHERE id = ${s.id}`;
  } else {
    await insertItem(s.id, s, s.sortOrder);
  }
  const after = await readItemSnapshot(s.id);
  const versionId = await recordVersion({
    entity: "menu_item",
    entityId: s.id,
    label: s.name,
    operation: before ? "update" : "create",
    before,
    after,
    meta,
  });
  revalidateSite();
  return { versionId };
}

// Persists the full new order for one category in a single transaction
// (all-or-nothing, so a failure never leaves sort_order half-updated).
export async function applyReorder(category: string, orderedIds: string[], meta: VersionMeta): Promise<{ versionId: number | null }> {
  if (orderedIds.length === 0) return { versionId: null };
  const before = (await sql`SELECT id FROM menu_items WHERE category = ${category} ORDER BY sort_order, id`).map((r) => r.id as string);
  await sql.transaction((tx) =>
    orderedIds.map((id, index) => tx`UPDATE menu_items SET sort_order = ${index} WHERE id = ${id} AND category = ${category}`)
  );
  const after = (await sql`SELECT id FROM menu_items WHERE category = ${category} ORDER BY sort_order, id`).map((r) => r.id as string);
  const versionId = await recordVersion({ entity: "menu_order", entityId: category, label: category, operation: "update", before, after, meta });
  revalidateSite();
  return { versionId };
}

// ── Site settings ─────────────────────────────────────────────────────────

const writer = (meta: VersionMeta) => meta.approvedBy ?? meta.authorId ?? "";

export async function applyComingSoon(visible: boolean, meta: VersionMeta): Promise<{ versionId: number | null }> {
  const before = await getShowComingSoon();
  await setShowComingSoon(visible, writer(meta));
  const versionId = await recordVersion({
    entity: "coming_soon",
    label: "Section « Bientôt disponible »",
    operation: "update",
    before,
    after: visible,
    meta,
  });
  revalidateSite();
  return { versionId };
}

export async function applyPricing(tiers: PricingTiers, meta: VersionMeta): Promise<{ versionId: number | null }> {
  const before = await getPricingTiers().catch(() => null);
  await setPricingTiers(tiers, writer(meta));
  const versionId = await recordVersion({ entity: "pricing", label: "Tarifs", operation: "update", before, after: tiers, meta });
  revalidateSite();
  return { versionId };
}

export async function applyHoursSchedule(schedule: HoursSchedule, meta: VersionMeta): Promise<{ versionId: number | null }> {
  const before = await getHoursSchedule().catch(() => null);
  await setHoursSchedule(schedule, writer(meta));
  const versionId = await recordVersion({ entity: "hours_schedule", label: "Horaires", operation: "update", before, after: schedule, meta });
  revalidateSite();
  return { versionId };
}

export async function applyHoursOverride(value: HoursOverride, meta: VersionMeta): Promise<{ versionId: number | null }> {
  const before = await getHoursOverride().catch(() => null);
  await setHoursOverride(value, writer(meta));
  const versionId = await recordVersion({
    entity: "hours_override",
    label: "Ouverture / fermeture exceptionnelle",
    operation: "update",
    before,
    after: value,
    meta,
  });
  revalidateSite();
  return { versionId };
}

export async function applyContact(value: ContactSettings, meta: VersionMeta): Promise<{ versionId: number | null }> {
  const before = await getContactSettings().catch(() => null);
  await setContactSettings(value, writer(meta));
  const versionId = await recordVersion({ entity: "contact", label: "Coordonnées", operation: "update", before, after: value, meta });
  revalidateSite();
  return { versionId };
}
