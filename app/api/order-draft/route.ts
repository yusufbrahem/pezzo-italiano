import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { purgeOldDrafts, upsertDraft } from "@/lib/data/order-drafts";
import { OrderFieldsSchema, clientIp, hashIp, priceCartItems, readJsonBody } from "@/lib/order-intake";
import { isCompletePhone, normalizePhone } from "@/lib/order";

// Saves what a visitor has typed in the order form before they send it
// ("paniers non envoyés" in /admin/clients) — only once the phone number is
// complete (8 digits) and the cart has at least one item. OrderModal calls
// this debounced while the visitor types; each form session has its own
// random draftKey, so the row is updated in place, never duplicated.
//
// Same defenses as /api/orders: same-origin + JSON only, size cap, strict
// schema, honeypot, DB-backed rate limits on new drafts, server-side pricing,
// no raw IP stored. Fire-and-forget from the browser — never blocks ordering.

export const dynamic = "force-dynamic";

const DraftPayload = OrderFieldsSchema.extend({
  draftKey: z.string().uuid(),
  hp: z.string().max(200).optional(),
});

function reply(status: number) {
  return new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  try {
    const read = await readJsonBody(req);
    if ("status" in read) return reply(read.status);
    const parsed = DraftPayload.safeParse(read.json);
    if (!parsed.success) return reply(400);
    const body = parsed.data;
    if (body.hp) return reply(204);

    // Only complete numbers — never half-typed ones.
    if (!isCompletePhone(body.telephone)) return reply(204);
    const phone = normalizePhone(body.telephone);
    if (!phone) return reply(204);

    const items = await priceCartItems(body.items);
    if (items.length === 0) return reply(204);

    const isDelivery = body.orderType === "livraison";
    const saved = await upsertDraft({
      draftKey: body.draftKey,
      customerName: body.nom,
      phoneRaw: body.telephone,
      phone,
      orderType: body.orderType,
      items,
      total: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      hasCustomItems: items.some((i) => i.unitPrice === 0),
      address: isDelivery && body.adresse ? body.adresse : null,
      zone: isDelivery && body.zone ? body.zone : null,
      landmark: isDelivery && body.repere ? body.repere : null,
      notes: body.notes || null,
      ipHash: hashIp(clientIp(req)),
    });

    // Housekeeping without a cron: drafts that never became orders go after 30 days.
    if (Math.random() < 0.05) after(() => purgeOldDrafts().catch((err) => console.error("[order-draft] purge failed:", err)));

    return reply(saved ? 204 : 429);
  } catch (err) {
    console.error("[api/order-draft] failed:", err);
    return reply(503);
  }
}
