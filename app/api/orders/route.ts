import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { insertOrder, getRecentOrderCounts } from "@/lib/data/orders";
import { deleteDraftsForOrder } from "@/lib/data/order-drafts";
import { OrderFieldsSchema, clientIp, hashIp, priceCartItems, readJsonBody } from "@/lib/order-intake";
import { normalizePhone } from "@/lib/order";

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

const LIMITS = {
  ip10min: 10, // generous: Tunisian mobile carriers put many customers behind one IP (CGNAT)
  ip24h: 60,
  phone1h: 5,
  global1h: 300, // hard ceiling so a distributed flood can't fill the DB
};

const OrderPayload = OrderFieldsSchema.extend({
  nom: OrderFieldsSchema.shape.nom.min(1),
  telephone: OrderFieldsSchema.shape.telephone.min(1),
  items: OrderFieldsSchema.shape.items.min(1),
  hp: z.string().max(200).optional(), // honeypot — must stay empty
  draftKey: z.string().uuid().optional(), // this form's unsent-cart row, removed once sent
});

function reply(status: number) {
  return new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  try {
    const read = await readJsonBody(req);
    if ("status" in read) return reply(read.status);
    const parsed = OrderPayload.safeParse(read.json);
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

    const items = await priceCartItems(body.items);
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

    // It was sent after all — the unsent-cart copy is no longer a lead.
    await deleteDraftsForOrder(body.draftKey ?? null, phone);

    return reply(204);
  } catch (err) {
    // DB down, bad env, anything — log it and move on; the customer's
    // WhatsApp order was never waiting on us.
    console.error("[api/orders] failed to record order:", err);
    return reply(503);
  }
}
