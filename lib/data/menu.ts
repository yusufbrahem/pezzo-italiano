import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";
import type { MenuItem } from "@/data/menu";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price_text ?? Number(row.price_numeric),
    category: row.category,
    image: row.image ?? undefined,
    imagePosition: row.image_position ?? undefined,
    tags: row.tags?.length ? row.tags : undefined,
    isSignature: row.is_signature,
    isVegetarian: row.is_vegetarian,
    isComingSoon: row.is_coming_soon,
    isCustom: row.is_custom,
    isNew: row.is_new,
    isBestseller: row.is_bestseller,
    isDevPick: row.is_dev_pick,
    pricePer100g: row.price_per_100g != null ? Number(row.price_per_100g) : undefined,
    priceQuart: row.price_quart != null ? Number(row.price_quart) : undefined,
    priceDemi: row.price_demi != null ? Number(row.price_demi) : undefined,
    pricePlateau: row.price_plateau != null ? Number(row.price_plateau) : undefined,
  };
}

/**
 * Per-request memoized (React cache()) — unlike getGoogleReviews()'s
 * fetch()-based dedup, a raw DB query doesn't get that for free, so this is
 * what makes app/layout.tsx and app/page.tsx share a single query per request.
 */
export const getMenuItems = cache(async (): Promise<MenuItem[]> => {
  const rows = await sql`SELECT * FROM menu_items ORDER BY category, sort_order ASC`;
  return rows.map(rowToMenuItem);
});
