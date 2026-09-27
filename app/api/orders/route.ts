import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { insertOrder, getRecentOrderCounts, type StoredOrderItem } from "@/lib/data/orders";
import { PIZZA_SIZES, normalizePhone, type PizzaSize } from "@/lib/order";

// Records a submission of the site's WhatsApp order form so staff can follow
// up for a Google review from /admin/clients.
//
// The order itself never depends on this route: OrderModal fires it with
// `keepalive` and opens WhatsApp without waiting, so a DB outage, a 429 or a
// crash here only means this one order isn't recorded — the customer's order
// still goes through exactly as before.
//
// Defenses, in order:
//  1. Same-origin check + JSON-only content type (a cross-site form or
//     fetch can't post here without a CORS preflight we never answer).
//  2. Body size cap before parsing.
//  3. Strict Zod schema with length/count caps on every field.
//  4. Honeypot field — bots that fill it get a silent fake success.
//  5. DB-backed rate limits (per IP, per phone, global) — no in-memory state,
//     since Vercel serverless instances aren't persistent.
//  6. Item names and prices are recomputed from menu_items — nothing
//     price-related from the browser is trusted or stored.
//  7. Parameterized SQL only; raw IPs are never stored (salted hash).

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_000;

const LIMITS = {
  ip10min: 10, // generous: Tunisian mobile carriers put many customers behind one IP (CGNAT)
  ip24h: 60,
  phone1h: 5,
  global1h: 300, // hard ceiling so a distributed flood can't fill the DB
};

const text = (max: number) => z.string().trim().max(max);

const OrderPayload = z.object({
  orderType: z.enum(["livraison", "emporter"]),
  nom: text(80).min(1),
  telephone: text(30).min(1),
  adresse: text(200).default(""),
  zone: text(120).default(""),
  repere: text(200).default(""),
  notes: text(500).default(""),
  items: z
    .array(
      z.object({
        menuItemId: text(64).min(1),
        size: z.enum(["quart", "demi", "plateau"]).nullable(),
        quantity: z.number().int().min(1).max(50),
        customNote: text(500).optional(),
      })
    )
    .min(1)
    .max(40),
  hp: z.string().max(200).optional(), // honeypot — must stay empty
});

function reply(status: number) {
  return new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: NextRequest): string {
  // On Vercel these are set by the edge network itself, not passed through from the client.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? "pezzo"}:orders:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return reply(403);
    if (!req.headers.get("content-type")?.startsWith("application/json")) return reply(415);

    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BODY_BYTES) return reply(413);
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return reply(413);

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return reply(400);
    }
    const parsed = OrderPayload.safeParse(json);
    if (!parsed.success) return reply(400);
    const body = parsed.data;

    // Honeypot tripped — pretend it worked so the bot learns nothing.
    if (body.hp) return reply(204);

    const phone = normalizePhone(body.telephone);
    if (!phone) return reply(400);
    if (body.orderType === "livraison" && (!body.adresse || !body.zone)) return reply(400);

    const ipHash = hashIp(clientIp(req));
    const counts = await getRecentOrderCounts(ipHash, phone);
    if (
      counts.ip10min >= LIMITS.ip10min ||
      counts.ip24h >= LIMITS.ip24h ||
      counts.phone1h >= LIMITS.phone1h ||
      counts.global1h >= LIMITS.global1h
    ) {
      return reply(429);
    }

    // Rebuild every line from the real menu — the browser only tells us
    // *which* item, size and quantity, never its name or price.
    const ids = [...new Set(body.items.map((i) => i.menuItemId))];
    const menuRows = await sql`
      SELECT id, name, category, price_text, price_numeric, price_quart, price_demi, price_plateau,
             is_custom, is_coming_soon, is_published
      FROM menu_items WHERE id = ANY(${ids})
    `;
    const menu = new Map(menuRows.map((r) => [r.id as string, r]));

    const items: StoredOrderItem[] = [];
    for (const line of body.items) {
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
    if (items.length === 0) return reply(400);

    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const isDelivery = body.orderType === "livraison";

    await insertOrder({
      customerName: body.nom,
      phoneRaw: body.telephone,
      phone,
      orderType: body.orderType,
      items,
      total,
      hasCustomItems: items.some((i) => i.unitPrice === 0),
      address: isDelivery ? body.adresse : null,
      zone: isDelivery ? body.zone : null,
      landmark: isDelivery && body.repere ? body.repere : null,
      notes: body.notes || null,
      ipHash,
    });

    return reply(204);
  } catch (err) {
    // DB down, bad env, anything — log it and move on; the customer's
    // WhatsApp order was never waiting on us.
    console.error("[api/orders] failed to record order:", err);
    return reply(503);
  }
}
