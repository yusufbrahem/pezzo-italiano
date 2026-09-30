"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { needsApproval } from "@/lib/auth/roles";
import { submitChange } from "@/lib/data/changes";
import {
  applyComingSoon,
  applyMenuCreate,
  applyMenuDelete,
  applyMenuUpdate,
  applyPublish,
  applyReorder,
  type MenuItemData,
} from "@/lib/menu-apply";

// Every menu change is validated here. The owner's changes apply immediately;
// staff / administrators' changes are stored as proposals and only reach the
// public site once the owner approves them (/admin/approvals).

const CATEGORIES = ["pizza", "desserts", "boissons", "supplements", "partager"] as const;

// Photos are rendered on the public site (next/image + the photo viewer), so
// only accept our own Blob store or the repo's /public/images files.
const MAX_PHOTOS = 12; // same limit as PhotosUpload.tsx
const photoUrl = z
  .string()
  .trim()
  .refine(
    (u) =>
      (/^\/images\/[\w\-./ ()]+$/.test(u) && !u.includes("..")) ||
      /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>]+$/i.test(u),
    "Adresse de photo invalide."
  );
const extraImagesField = z.preprocess((v) => {
  if (typeof v !== "string" || v === "") return [];
  try {
    return JSON.parse(v);
  } catch {
    return v; // fails the array check below
  }
}, z.array(photoUrl).max(MAX_PHOTOS - 1, `${MAX_PHOTOS} photos maximum.`));

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
  image: z.union([z.literal(""), photoUrl]).optional(),
  extraImages: extraImagesField,
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

/** Form → normalized MenuItemData (also what a proposal stores), or an error message. */
function parseForm(formData: FormData): { data: MenuItemData } | { error: string } {
  const raw = Object.fromEntries(formData.entries());
  const parsed = MenuItemSchema.safeParse({
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const d = parsed.data;
  const image = d.image || null;
  return {
    data: {
      name: d.name,
      description: d.description,
      category: d.category,
      priceText: d.priceText || null,
      priceNumeric: d.priceNumeric ?? null,
      pricePer100g: d.pricePer100g ?? null,
      priceQuart: d.priceQuart ?? null,
      priceDemi: d.priceDemi ?? null,
      pricePlateau: d.pricePlateau ?? null,
      image,
      // Extra photos minus the main one and duplicates (none without a main photo).
      extraImages: image ? [...new Set(d.extraImages)].filter((u) => u !== image) : [],
      imagePosition: d.imagePosition || null,
      tags: d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      isSignature: d.isSignature,
      isVegetarian: d.isVegetarian,
      isComingSoon: d.isComingSoon,
      isCustom: d.isCustom,
      isNew: d.isNew,
      isBestseller: d.isBestseller,
      isDevPick: d.isDevPick,
      isPublished: d.isPublished,
    },
  };
}

export interface MenuItemFormState {
  error?: string;
}

/** What a list control should show after an action: applied now, or waiting for the owner. */
export type ChangeOutcome = { status: "applied" | "pending" };

async function itemName(id: string): Promise<string | null> {
  const rows = await sql`SELECT name FROM menu_items WHERE id = ${id}`;
  return (rows[0]?.name as string) ?? null;
}

export async function createMenuItem(
  _prevState: MenuItemFormState | undefined,
  formData: FormData
): Promise<MenuItemFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  if (needsApproval(session.role)) {
    await submitChange("menu_create", null, parsed.data, `Ajouter « ${parsed.data.name} »`, session.userId);
    redirect("/admin/menu?sent=1");
  }
  await applyMenuCreate(parsed.data);
  redirect("/admin/menu");
}

export async function updateMenuItem(
  id: string,
  _prevState: MenuItemFormState | undefined,
  formData: FormData
): Promise<MenuItemFormState> {
  const session = await requireSession();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  const current = await itemName(id);
  if (current === null) return { error: "Cet article n'existe plus." };

  if (needsApproval(session.role)) {
    await submitChange("menu_update", id, parsed.data, `Modifier « ${current} »`, session.userId);
    redirect("/admin/menu?sent=1");
  }
  await applyMenuUpdate(id, parsed.data);
  redirect("/admin/menu");
}

// Shows/hides the "Bientôt disponible" items (is_coming_soon) in the public menu.
export async function setComingSoonVisible(visible: boolean): Promise<ChangeOutcome> {
  const session = await requireSession();
  if (needsApproval(session.role)) {
    await submitChange(
      "coming_soon",
      null,
      { visible },
      visible ? "Afficher la section « Bientôt disponible »" : "Masquer la section « Bientôt disponible »",
      session.userId
    );
    return { status: "pending" };
  }
  await applyComingSoon(visible, session.userId);
  return { status: "applied" };
}

// One-click publish/hide from the menu list.
export async function togglePublished(id: string, published: boolean): Promise<ChangeOutcome> {
  const session = await requireSession();
  if (needsApproval(session.role)) {
    const name = await itemName(id);
    if (name === null) return { status: "applied" };
    await submitChange(
      "menu_publish",
      id,
      { published, name },
      published ? `Publier « ${name} »` : `Masquer « ${name} » du site`,
      session.userId
    );
    return { status: "pending" };
  }
  await applyPublish(id, published);
  return { status: "applied" };
}

export async function deleteMenuItem(id: string): Promise<ChangeOutcome> {
  const session = await requireSession();
  if (needsApproval(session.role)) {
    const name = await itemName(id);
    if (name === null) return { status: "applied" };
    await submitChange("menu_delete", id, { name }, `Supprimer « ${name} »`, session.userId);
    return { status: "pending" };
  }
  await applyMenuDelete(id);
  return { status: "applied" };
}

// Drag-and-drop reorder of one category.
export async function reorderMenuItems(category: string, orderedIds: string[]): Promise<ChangeOutcome> {
  const session = await requireSession();
  if (!(CATEGORIES as readonly string[]).includes(category) || orderedIds.length === 0 || orderedIds.length > 200) {
    return { status: "applied" };
  }
  // Only ids that really are in this category, each once.
  const valid = new Set(
    (await sql`SELECT id FROM menu_items WHERE category = ${category}`).map((r) => r.id as string)
  );
  const ids = [...new Set(orderedIds)].filter((id) => valid.has(id));

  if (needsApproval(session.role)) {
    await submitChange("menu_reorder", category, { orderedIds: ids }, `Réorganiser la catégorie « ${category} »`, session.userId);
    return { status: "pending" };
  }
  await applyReorder(category, ids);
  return { status: "applied" };
}
