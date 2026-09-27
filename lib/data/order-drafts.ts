import "server-only";
import { sql } from "@/lib/db";
import type { OrderType } from "@/lib/order";
import type { StoredOrderItem } from "@/lib/data/orders";

// Unsent order forms ("paniers non envoyés"): what a visitor typed in the
// order form — name, complete phone number, cart — when they never pressed
// "Commander". Kept apart from `orders` (real orders) and from the anonymous
// site_events statistics. One row per form session (`draft_key`), updated as
// the visitor keeps typing; removed as soon as that order is actually sent,
// and purged after DRAFT_RETENTION_DAYS if it never turns into an order.

export const DRAFT_RETENTION_DAYS = 30;

const LIMITS = { newPerIpHour: 15, newPerPhoneHour: 5, newGlobalHour: 300 };

export interface DraftInput {
  draftKey: string;
  customerName: string;
  phoneRaw: string;
  phone: string;
  orderType: OrderType;
  items: StoredOrderItem[];
  total: number;
  hasCustomItems: boolean;
  address: string | null;
  zone: string | null;
  landmark: string | null;
  notes: string | null;
  ipHash: string;
}

/** Insert or update this form session's draft. Returns false when rate-limited. */
export async function upsertDraft(d: DraftInput): Promise<boolean> {
  const existing = await sql`SELECT ip_hash FROM order_drafts WHERE draft_key = ${d.draftKey}`;
  if (existing.length > 0) {
    // Only the browser that created a draft may update it.
    if (existing[0].ip_hash !== d.ipHash) return false;
  } else {
    const [c] = await sql`
      SELECT
        (SELECT count(*) FROM order_drafts WHERE ip_hash = ${d.ipHash} AND created_at > now() - interval '1 hour') AS ip,
        (SELECT count(*) FROM order_drafts WHERE phone = ${d.phone} AND created_at > now() - interval '1 hour') AS phone,
        (SELECT count(*) FROM order_drafts WHERE created_at > now() - interval '1 hour') AS global
    `;
    if (
      Number(c.ip) >= LIMITS.newPerIpHour ||
      Number(c.phone) >= LIMITS.newPerPhoneHour ||
      Number(c.global) >= LIMITS.newGlobalHour
    ) {
      return false;
    }
  }

  await sql`
    INSERT INTO order_drafts (
      draft_key, customer_name, phone_raw, phone, order_type, items, total, has_custom_items,
      address, zone, landmark, notes, ip_hash
    ) VALUES (
      ${d.draftKey}, ${d.customerName}, ${d.phoneRaw}, ${d.phone}, ${d.orderType}, ${JSON.stringify(d.items)},
      ${d.total}, ${d.hasCustomItems}, ${d.address}, ${d.zone}, ${d.landmark}, ${d.notes}, ${d.ipHash}
    )
    ON CONFLICT (draft_key) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      phone_raw = EXCLUDED.phone_raw,
      phone = EXCLUDED.phone,
      order_type = EXCLUDED.order_type,
      items = EXCLUDED.items,
      total = EXCLUDED.total,
      has_custom_items = EXCLUDED.has_custom_items,
      address = EXCLUDED.address,
      zone = EXCLUDED.zone,
      landmark = EXCLUDED.landmark,
      notes = EXCLUDED.notes,
      updated_at = now()
    WHERE order_drafts.ip_hash = EXCLUDED.ip_hash
  `;
  return true;
}

/** The order was sent after all: drop this form's draft and same-phone drafts from the last few hours. */
export async function deleteDraftsForOrder(draftKey: string | null, phone: string) {
  await sql`
    DELETE FROM order_drafts
    WHERE (${draftKey}::uuid IS NOT NULL AND draft_key = ${draftKey}::uuid)
       OR (phone = ${phone} AND updated_at > now() - interval '3 hours')
  `;
}

export async function purgeOldDrafts(): Promise<number> {
  const rows = await sql`
    DELETE FROM order_drafts
    WHERE updated_at < now() - make_interval(days => ${DRAFT_RETENTION_DAYS})
    RETURNING id
  `;
  return rows.length;
}

// ── Admin ─────────────────────────────────────────────────────────────────

export interface DraftRow {
  id: string;
  customerName: string;
  phoneRaw: string;
  phone: string;
  orderType: OrderType;
  items: StoredOrderItem[];
  total: number;
  hasCustomItems: boolean;
  address: string | null;
  zone: string | null;
  landmark: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  pastOrders: number; // real orders ever sent from this number
}

export async function listDrafts(opts: { q: string; page: number; pageSize: number }) {
  const q = opts.q.trim();
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const digits = q.replace(/\D/g, "");
  const offset = (opts.page - 1) * opts.pageSize;
  const rows = await sql`
    SELECT d.*, COALESCE(o.n, 0) AS past_orders, count(*) OVER () AS total_rows
    FROM order_drafts d
    LEFT JOIN (SELECT phone, count(*) AS n FROM orders GROUP BY phone) o ON o.phone = d.phone
    WHERE (${q} = '' OR d.customer_name ILIKE ${like} OR (${digits.length >= 3} AND d.phone LIKE ${`%${digits}%`}))
    ORDER BY d.updated_at DESC
    LIMIT ${opts.pageSize} OFFSET ${offset}
  `;
  return {
    total: rows.length ? Number(rows[0].total_rows) : 0,
    drafts: rows.map(
      (r): DraftRow => ({
        id: r.id,
        customerName: r.customer_name,
        phoneRaw: r.phone_raw,
        phone: r.phone,
        orderType: r.order_type,
        items: r.items,
        total: Number(r.total),
        hasCustomItems: r.has_custom_items,
        address: r.address,
        zone: r.zone,
        landmark: r.landmark,
        notes: r.notes,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
        pastOrders: Number(r.past_orders),
      })
    ),
  };
}

export async function countDrafts(): Promise<number> {
  const [r] = await sql`SELECT count(*) FROM order_drafts`;
  return Number(r.count);
}

export async function deleteDraft(id: string) {
  await sql`DELETE FROM order_drafts WHERE id = ${id}`;
}
