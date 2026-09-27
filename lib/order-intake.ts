import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import type { StoredOrderItem } from "@/lib/data/orders";
import { PIZZA_SIZES, type PizzaSize } from "@/lib/order";

// Shared by the public order endpoints (/api/orders, /api/order-draft):
// request guards, the payload schema, and server-side re-pricing of the cart.

export const MAX_ORDER_BODY_BYTES = 16_000;

const text = (max: number) => z.string().trim().max(max);

export const OrderItemsSchema = z
  .array(
    z.object({
      menuItemId: text(64).min(1),
      size: z.enum(["quart", "demi", "plateau"]).nullable(),
      quantity: z.number().int().min(1).max(50),
      customNote: text(500).optional(),
    })
  )
  .max(40);

export const OrderFieldsSchema = z.object({
  orderType: z.enum(["livraison", "emporter"]),
  nom: text(80),
  telephone: text(30),
  adresse: text(200).default(""),
  zone: text(120).default(""),
  repere: text(200).default(""),
  notes: text(500).default(""),
  items: OrderItemsSchema,
});

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: NextRequest): string {
  // On Vercel these are set by the edge network itself, not passed through from the client.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Salted, truncated hash — raw IPs are never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? "pezzo"}:orders:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/** Same-origin JSON body under the size cap, or an HTTP status to reply with. */
export async function readJsonBody(req: NextRequest): Promise<{ json: unknown } | { status: number }> {
  if (!isSameOrigin(req)) return { status: 403 };
  if (!req.headers.get("content-type")?.startsWith("application/json")) return { status: 415 };
  if (Number(req.headers.get("content-length") ?? 0) > MAX_ORDER_BODY_BYTES) return { status: 413 };
  const raw = await req.text();
  if (raw.length > MAX_ORDER_BODY_BYTES) return { status: 413 };
  try {
    return { json: JSON.parse(raw) };
  } catch {
    return { status: 400 };
  }
}

/**
 * Rebuilds every cart line from the real menu — the browser only tells us
 * *which* item, size and quantity, never its name or price. Unknown,
 * unpublished or mis-sized lines are dropped.
 */
export async function priceCartItems(lines: z.infer<typeof OrderItemsSchema>): Promise<StoredOrderItem[]> {
  if (lines.length === 0) return [];
  const ids = [...new Set(lines.map((i) => i.menuItemId))];
  const menuRows = await sql`
    SELECT id, name, category, price_text, price_numeric, price_quart, price_demi, price_plateau,
           is_custom, is_coming_soon, is_published
    FROM menu_items WHERE id = ANY(${ids})
  `;
  const menu = new Map(menuRows.map((r) => [r.id as string, r]));

  const items: StoredOrderItem[] = [];
  for (const line of lines) {
    const m = menu.get(line.menuItemId);
    if (!m || m.is_coming_soon || !m.is_published) continue;

    if (m.is_custom) {
      if (!line.customNote) continue;
      items.push({
        menuItemId: m.id,
        name: m.name,
        category: m.category,
        size: null,
        sizeLabel: null,
        quantity: 1,
        unitPrice: 0,
        customNote: line.customNote,
      });
      continue;
    }

    let unitPrice: number | null = null;
    let size: PizzaSize | null = null;
    if (m.category === "pizza") {
      if (!line.size) continue;
      size = line.size;
      const col = { quart: m.price_quart, demi: m.price_demi, plateau: m.price_plateau }[size];
      unitPrice = col != null ? Number(col) : null;
    } else if (m.price_text == null && m.price_numeric != null) {
      unitPrice = Number(m.price_numeric);
    } else {
      unitPrice = 0;
    }
    if (unitPrice === null || !Number.isFinite(unitPrice)) continue;

    items.push({
      menuItemId: m.id,
      name: m.name,
      category: m.category,
      size,
      sizeLabel: size ? PIZZA_SIZES[size] : null,
      quantity: line.quantity,
      unitPrice,
      customNote: null,
    });
  }
  return items;
}
