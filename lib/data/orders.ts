import "server-only";
import { sql } from "@/lib/db";
import type { OrderType, PizzaSize } from "@/lib/order";
import { resolveDateRange, type OrderFilters } from "@/lib/orders-filters";

export interface StoredOrderItem {
  menuItemId: string;
  name: string;
  category?: string; // absent on the very first orders, recorded from 2026-09-27
  size: PizzaSize | null;
  sizeLabel: string | null;
  quantity: number;
  unitPrice: number; // 0 = "prix à confirmer" (custom plateau)
  customNote: string | null;
}

export interface NewOrder {
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

export interface OrderRow {
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
  isConfirmed: boolean;
  reviewRequestedAt: string | null; // ISO — plain strings so rows pass straight to client components
  reviewRequestedByName: string | null;
  createdAt: string;
  customerOrderCount: number; // all-time orders from this phone number
}

// ── Public order form (app/api/orders/route.ts) ────────────────────────────

export async function insertOrder(o: NewOrder) {
  await sql`
    INSERT INTO orders (
      customer_name, phone_raw, phone, order_type, items, total, has_custom_items,
      address, zone, landmark, notes, ip_hash
    ) VALUES (
      ${o.customerName}, ${o.phoneRaw}, ${o.phone}, ${o.orderType}, ${JSON.stringify(o.items)},
      ${o.total}, ${o.hasCustomItems}, ${o.address}, ${o.zone}, ${o.landmark}, ${o.notes}, ${o.ipHash}
    )
  `;
}

/** One query for every rate-limit window the order endpoint checks. */
export async function getRecentOrderCounts(ipHash: string, phone: string) {
  const rows = await sql`
    SELECT
      (SELECT count(*) FROM orders WHERE ip_hash = ${ipHash} AND created_at > now() - interval '10 minutes') AS ip_10min,
      (SELECT count(*) FROM orders WHERE ip_hash = ${ipHash} AND created_at > now() - interval '24 hours')  AS ip_24h,
      (SELECT count(*) FROM orders WHERE phone = ${phone}    AND created_at > now() - interval '1 hour')    AS phone_1h,
      (SELECT count(*) FROM orders WHERE created_at > now() - interval '1 hour')                            AS global_1h
  `;
  const r = rows[0];
  return {
    ip10min: Number(r.ip_10min),
    ip24h: Number(r.ip_24h),
    phone1h: Number(r.phone_1h),
    global1h: Number(r.global_1h),
  };
}

// ── Admin filters → SQL ────────────────────────────────────────────────────
// Every value goes in as a bound parameter via composed `sql` fragments; the
// only raw SQL (ORDER BY) comes from a fixed whitelist below.

type Fragment = ReturnType<typeof sql>;

function and(parts: Fragment[]): Fragment {
  return parts.reduce((acc, p) => sql`${acc} AND ${p}`, sql`TRUE`);
}

function whereFor(f: OrderFilters, opts: { ignoreStatus?: boolean } = {}): Fragment {
  const parts: Fragment[] = [];

  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const digits = f.q.replace(/\D/g, "");
    // Only treat the query as a phone search once it has a few digits, so a
    // name like "Salle 2" doesn't match every phone containing a 2.
    parts.push(
      digits.length >= 3
        ? sql`(o.customer_name ILIKE ${like} OR o.phone LIKE ${`%${digits}%`})`
        : sql`o.customer_name ILIKE ${like}`
    );
  }

  if (!opts.ignoreStatus) {
    if (f.status === "pending") parts.push(sql`NOT o.is_confirmed`);
    if (f.status === "confirmed") parts.push(sql`o.is_confirmed`);
    if (f.status === "to_follow_up") parts.push(sql`o.is_confirmed AND o.review_requested_at IS NULL`);
    if (f.status === "reviewed") parts.push(sql`o.review_requested_at IS NOT NULL`);
  }

  if (f.type !== "all") parts.push(sql`o.order_type = ${f.type}`);

  // Dates are Tunis-local calendar days, inclusive on both ends.
  const { from, to } = resolveDateRange(f);
  if (from) parts.push(sql`o.created_at >= (${from}::date::timestamp AT TIME ZONE 'Africa/Tunis')`);
  if (to) parts.push(sql`o.created_at < ((${to}::date + 1)::timestamp AT TIME ZONE 'Africa/Tunis')`);

  return and(parts);
}

const ORDER_BY: Record<OrderFilters["sort"], string> = {
  newest: "o.created_at DESC",
  oldest: "o.created_at ASC",
  total_desc: "o.total DESC, o.created_at DESC",
  total_asc: "o.total ASC, o.created_at DESC",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): OrderRow {
  return {
    id: row.id,
    customerName: row.customer_name,
    phoneRaw: row.phone_raw,
    phone: row.phone,
    orderType: row.order_type,
    items: row.items,
    total: Number(row.total),
    hasCustomItems: row.has_custom_items,
    address: row.address,
    zone: row.zone,
    landmark: row.landmark,
    notes: row.notes,
    isConfirmed: row.is_confirmed,
    reviewRequestedAt: row.review_requested_at ? new Date(row.review_requested_at).toISOString() : null,
    reviewRequestedByName: row.review_requested_by_name ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    customerOrderCount: Number(row.customer_order_count),
  };
}

// ── Admin: table ───────────────────────────────────────────────────────────

export async function listOrders(f: OrderFilters): Promise<{ orders: OrderRow[]; total: number }> {
  const offset = (f.page - 1) * f.pageSize;
  const rows = await sql`
    SELECT o.*, c.customer_order_count, u.name AS review_requested_by_name,
           count(*) OVER () AS total_rows
    FROM orders o
    JOIN (SELECT phone, count(*) AS customer_order_count FROM orders GROUP BY phone) c ON c.phone = o.phone
    LEFT JOIN admin_users u ON u.id = o.review_requested_by
    WHERE ${whereFor(f)}
    ORDER BY ${sql.unsafe(ORDER_BY[f.sort])}
    LIMIT ${f.pageSize} OFFSET ${offset}
  `;
  let total = rows.length > 0 ? Number(rows[0].total_rows) : 0;
  // Past the last page (e.g. after a filter narrowed the results) the window
  // count is lost — fetch it so the pager can still offer a way back.
  if (rows.length === 0 && f.page > 1) {
    const c = await sql`SELECT count(*) FROM orders o WHERE ${whereFor(f)}`;
    total = Number(c[0].count);
  }
  return { orders: rows.map(rowToOrder), total };
}

/** Per-status counts under the other active filters — feeds the status tabs. */
export async function getStatusCounts(f: OrderFilters) {
  const rows = await sql`
    SELECT
      count(*) AS all,
      count(*) FILTER (WHERE NOT o.is_confirmed) AS pending,
      count(*) FILTER (WHERE o.is_confirmed) AS confirmed,
      count(*) FILTER (WHERE o.is_confirmed AND o.review_requested_at IS NULL) AS to_follow_up,
      count(*) FILTER (WHERE o.review_requested_at IS NOT NULL) AS reviewed
    FROM orders o
    WHERE ${whereFor(f, { ignoreStatus: true })}
  `;
  const r = rows[0];
  return {
    all: Number(r.all),
    pending: Number(r.pending),
    confirmed: Number(r.confirmed),
    to_follow_up: Number(r.to_follow_up),
    reviewed: Number(r.reviewed),
  };
}

// ── Admin: analytics ───────────────────────────────────────────────────────

export interface ItemStat {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  orders: number;
}

export interface OrderAnalytics {
  kpis: {
    orders: number;
    confirmedOrders: number;
    revenue: number;
    confirmedRevenue: number;
    avgBasket: number;
    customers: number;
    returningCustomers: number;
    delivery: number;
    pickup: number;
    reviewsRequested: number;
    customPriceOrders: number; // orders with a "prix à confirmer" line — not in revenue
  };
  items: ItemStat[]; // every item, by category, most sold first
  pizzaSizes: { size: string; quantity: number }[];
  timeline: { bucket: string; orders: number; revenue: number }[];
  timelineUnit: "day" | "week";
  hours: { hour: number; orders: number }[];
  zones: { zone: string; orders: number }[];
}

export async function getOrderAnalytics(f: OrderFilters): Promise<OrderAnalytics> {
  const where = whereFor(f);

  // Timeline window: the selected range, or the last 30 days of data when
  // unbounded; weekly buckets once it spans more than ~2 months.
  const range = resolveDateRange(f);
  const bounds = await sql`
    SELECT
      COALESCE(${range.from}::date, (min(o.created_at) AT TIME ZONE 'Africa/Tunis')::date) AS first_day,
      COALESCE(${range.to}::date, (now() AT TIME ZONE 'Africa/Tunis')::date) AS last_day
    FROM orders o WHERE ${where}
  `;
  const lastDay: string | null = bounds[0]?.last_day ? toYmd(bounds[0].last_day) : null;
  let firstDay: string | null = bounds[0]?.first_day ? toYmd(bounds[0].first_day) : null;
  if (!range.from && firstDay && lastDay) {
    const thirtyBefore = shiftYmd(lastDay, -29);
    if (firstDay < thirtyBefore) firstDay = thirtyBefore;
  }
  const spanDays = firstDay && lastDay ? daysBetween(firstDay, lastDay) + 1 : 0;
  const unit: "day" | "week" = spanDays > 62 ? "week" : "day";
  const unitSql = sql.unsafe(unit === "week" ? "'week'" : "'day'");
  const stepSql = sql.unsafe(unit === "week" ? "interval '1 week'" : "interval '1 day'");

  const [kpiRows, itemRows, sizeRows, timelineRows, hourRows, zoneRows] = await Promise.all([
    sql`
      SELECT
        count(*) AS orders,
        count(*) FILTER (WHERE o.is_confirmed) AS confirmed_orders,
        COALESCE(sum(o.total), 0) AS revenue,
        COALESCE(sum(o.total) FILTER (WHERE o.is_confirmed), 0) AS confirmed_revenue,
        COALESCE(avg(o.total) FILTER (WHERE o.total > 0), 0) AS avg_basket,
        count(DISTINCT o.phone) AS customers,
        count(*) FILTER (WHERE o.order_type = 'livraison') AS delivery,
        count(*) FILTER (WHERE o.order_type = 'emporter') AS pickup,
        count(*) FILTER (WHERE o.review_requested_at IS NOT NULL) AS reviews_requested,
        count(*) FILTER (WHERE o.has_custom_items) AS custom_price_orders,
        (SELECT count(*) FROM (
           SELECT o2.phone FROM orders o2 WHERE o2.phone IN (SELECT o.phone FROM orders o WHERE ${where})
           GROUP BY o2.phone HAVING count(*) > 1
         ) r) AS returning_customers
      FROM orders o
      WHERE ${where}
    `,
    sql`
      SELECT
        COALESCE(e->>'category', mi.category, 'autre') AS category,
        e->>'name' AS name,
        sum((e->>'quantity')::int) AS quantity,
        sum((e->>'quantity')::int * (e->>'unitPrice')::numeric) AS revenue,
        count(DISTINCT o.id) AS orders
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(o.items) e
      LEFT JOIN menu_items mi ON mi.id = e->>'menuItemId'
      WHERE ${where}
      GROUP BY 1, 2
      ORDER BY quantity DESC, revenue DESC
    `,
    sql`
      SELECT e->>'size' AS size, sum((e->>'quantity')::int) AS quantity
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(o.items) e
      WHERE ${where} AND e->>'size' IS NOT NULL
      GROUP BY 1
    `,
    firstDay && lastDay
      ? sql`
          WITH buckets AS (
            SELECT generate_series(
              date_trunc(${unitSql}, ${firstDay}::date::timestamp),
              date_trunc(${unitSql}, ${lastDay}::date::timestamp),
              ${stepSql}
            ) AS b
          ),
          agg AS (
            SELECT date_trunc(${unitSql}, o.created_at AT TIME ZONE 'Africa/Tunis') AS b,
                   count(*) AS orders, COALESCE(sum(o.total), 0) AS revenue
            FROM orders o
            WHERE ${where}
              AND o.created_at >= (${firstDay}::date::timestamp AT TIME ZONE 'Africa/Tunis')
            GROUP BY 1
          )
          SELECT to_char(buckets.b, 'YYYY-MM-DD') AS bucket,
                 COALESCE(agg.orders, 0) AS orders, COALESCE(agg.revenue, 0) AS revenue
          FROM buckets LEFT JOIN agg ON agg.b = buckets.b
          ORDER BY buckets.b
        `
      : Promise.resolve([]),
    sql`
      SELECT extract(hour FROM o.created_at AT TIME ZONE 'Africa/Tunis')::int AS hour, count(*) AS orders
      FROM orders o WHERE ${where}
      GROUP BY 1
    `,
    sql`
      SELECT initcap(lower(trim(o.zone))) AS zone, count(*) AS orders
      FROM orders o
      WHERE ${where} AND o.order_type = 'livraison' AND o.zone IS NOT NULL AND trim(o.zone) <> ''
      GROUP BY 1 ORDER BY orders DESC LIMIT 8
    `,
  ]);

  const k = kpiRows[0];
  const byHour = new Map(hourRows.map((r) => [Number(r.hour), Number(r.orders)]));

  return {
    kpis: {
      orders: Number(k.orders),
      confirmedOrders: Number(k.confirmed_orders),
      revenue: Number(k.revenue),
      confirmedRevenue: Number(k.confirmed_revenue),
      avgBasket: Number(k.avg_basket),
      customers: Number(k.customers),
      returningCustomers: Number(k.returning_customers),
      delivery: Number(k.delivery),
      pickup: Number(k.pickup),
      reviewsRequested: Number(k.reviews_requested),
      customPriceOrders: Number(k.custom_price_orders),
    },
    items: itemRows.map((r) => ({
      name: r.name,
      category: r.category,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
    pizzaSizes: sizeRows.map((r) => ({ size: r.size, quantity: Number(r.quantity) })),
    timeline: timelineRows.map((r) => ({
      bucket: r.bucket,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    })),
    timelineUnit: unit,
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, orders: byHour.get(hour) ?? 0 })),
    zones: zoneRows.map((r) => ({ zone: r.zone, orders: Number(r.orders) })),
  };
}

function toYmd(v: unknown): string {
  if (v instanceof Date) {
    // DATE columns come back as local-midnight Dates — read the local parts.
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  return String(v).slice(0, 10);
}
function shiftYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

// ── Admin: export ──────────────────────────────────────────────────────────

export const EXPORT_MAX_ROWS = 50_000;

export async function getOrdersForExport(f: OrderFilters | null): Promise<OrderRow[]> {
  const where = f ? whereFor(f) : sql`TRUE`;
  const orderBy = sql.unsafe(ORDER_BY[f?.sort ?? "newest"]);
  const rows = await sql`
    SELECT o.*, c.customer_order_count, u.name AS review_requested_by_name
    FROM orders o
    JOIN (SELECT phone, count(*) AS customer_order_count FROM orders GROUP BY phone) c ON c.phone = o.phone
    LEFT JOIN admin_users u ON u.id = o.review_requested_by
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ${EXPORT_MAX_ROWS}
  `;
  // Orders saved before items carried their category: fill it from the menu.
  const menu = await sql`SELECT id, category FROM menu_items`;
  const categoryById = new Map(menu.map((m) => [m.id as string, m.category as string]));
  return rows.map(rowToOrder).map((o) => ({
    ...o,
    items: o.items.map((i) => (i.category ? i : { ...i, category: categoryById.get(i.menuItemId) })),
  }));
}

// ── Admin: dashboard card + mutations ─────────────────────────────────────

export async function getOrderStats() {
  const rows = await sql`
    SELECT
      count(*) FILTER (WHERE created_at > now() - interval '7 days') AS last_7_days,
      count(*) FILTER (WHERE is_confirmed AND review_requested_at IS NULL) AS to_follow_up
    FROM orders
  `;
  return { last7Days: Number(rows[0].last_7_days), toFollowUp: Number(rows[0].to_follow_up) };
}

export async function setOrderConfirmed(id: string, confirmed: boolean) {
  await sql`UPDATE orders SET is_confirmed = ${confirmed} WHERE id = ${id}`;
}

export async function setReviewRequested(id: string, requested: boolean, userId: string) {
  if (requested) {
    // Asking for a review implies the order really happened.
    await sql`
      UPDATE orders
      SET review_requested_at = now(), review_requested_by = ${userId}, is_confirmed = true
      WHERE id = ${id}
    `;
  } else {
    await sql`UPDATE orders SET review_requested_at = NULL, review_requested_by = NULL WHERE id = ${id}`;
  }
}

export async function deleteOrder(id: string) {
  await sql`DELETE FROM orders WHERE id = ${id}`;
}
