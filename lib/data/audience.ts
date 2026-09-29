import "server-only";
import { sql } from "@/lib/db";
import { tunisToday } from "@/lib/orders-filters";
import { DETAIL_RETENTION_DAYS, shiftDay } from "@/lib/audience-filters";

export const SITE_EVENT_TYPES = [
  "pageview",
  "order_start",
  "order_submit",
  "call",
  "whatsapp",
  "directions",
  "social",
  "share",
  "section_view",
  "engagement",
  "cart_add",
  "order_abandon",
  "gallery_open",
  "menu_tab",
  "item_photos",
] as const;
export type SiteEventType = (typeof SITE_EVENT_TYPES)[number];

export interface NewSiteEvent {
  visitor: string;
  type: SiteEventType;
  path: string | null;
  source: string | null;
  device: string;
  os: string;
  browser: string;
  country: string | null;
  city: string | null;
  standalone: boolean;
  detail?: string | null;
  value?: number | null;
  data?: Record<string, string | number | boolean | null> | null;
}

// Per-visitor and site-wide ceilings, checked inside the INSERT itself (one
// round trip). Generous for real people, tight enough that a script can't
// flood the table.
const MAX_PER_VISITOR_10MIN = 200;
const MAX_GLOBAL_PER_MIN = 600;

/** Returns false when the event was dropped by a rate limit. */
export async function recordSiteEvent(e: NewSiteEvent): Promise<boolean> {
  const rows = await sql`
    INSERT INTO site_events (visitor, type, path, source, device, os, browser, country, city, standalone, detail, value, data)
    SELECT ${e.visitor}, ${e.type}, ${e.path}, ${e.source}, ${e.device}, ${e.os}, ${e.browser},
           ${e.country}, ${e.city}, ${e.standalone}, ${e.detail ?? null}, ${e.value ?? null},
           ${e.data ? JSON.stringify(e.data) : null}::jsonb
    WHERE (SELECT count(*) FROM site_events
           WHERE visitor = ${e.visitor} AND created_at > now() - interval '10 minutes') < ${MAX_PER_VISITOR_10MIN}
      AND (SELECT count(*) FROM site_events
           WHERE created_at > now() - interval '1 minute') < ${MAX_GLOBAL_PER_MIN}
    RETURNING id
  `;
  return rows.length > 0;
}

// ── Retention ──────────────────────────────────────────────────────────────

/** First Tunis day whose detailed rows are still kept. */
export function detailCutoffDay(now = new Date()): string {
  return shiftDay(tunisToday(now), -(DETAIL_RETENTION_DAYS - 1));
}

/**
 * Folds whole days older than the retention window into site_daily, then
 * deletes their detailed rows — in one transaction, so a day is never
 * counted twice or lost. The cutoff sits on a Tunis midnight and old days
 * can't receive new events, so each day is rolled up exactly once.
 * Idempotent and cheap when there's nothing to do.
 */
export async function rollupOldSiteEvents(): Promise<number> {
  const cutoff = detailCutoffDay();
  const pending = await sql`
    SELECT 1 FROM site_events
    WHERE created_at < (${cutoff}::date::timestamp AT TIME ZONE 'Africa/Tunis') LIMIT 1
  `;
  if (pending.length === 0) return 0;

  const [inserted] = await sql.transaction([
    sql`
      INSERT INTO site_daily (day, visitors, pageviews, order_starters, order_submitters, calls, whatsapp, directions, social, shares)
      SELECT (created_at AT TIME ZONE 'Africa/Tunis')::date,
             count(DISTINCT visitor) FILTER (WHERE type = 'pageview'),
             count(*) FILTER (WHERE type = 'pageview'),
             count(DISTINCT visitor) FILTER (WHERE type = 'order_start'),
             count(DISTINCT visitor) FILTER (WHERE type = 'order_submit'),
             count(*) FILTER (WHERE type = 'call'),
             count(*) FILTER (WHERE type = 'whatsapp'),
             count(*) FILTER (WHERE type = 'directions'),
             count(*) FILTER (WHERE type = 'social'),
             count(*) FILTER (WHERE type = 'share')
      FROM site_events
      WHERE created_at < (${cutoff}::date::timestamp AT TIME ZONE 'Africa/Tunis')
      GROUP BY 1
      ON CONFLICT (day) DO NOTHING
      RETURNING day
    `,
    sql`DELETE FROM site_events WHERE created_at < (${cutoff}::date::timestamp AT TIME ZONE 'Africa/Tunis')`,
  ]);
  return inserted.length;
}

// ── Admin queries ──────────────────────────────────────────────────────────

export interface DailyAudience {
  day: string; // YYYY-MM-DD, Tunis
  visitors: number;
  pageviews: number;
  orderStarters: number;
  orderSubmitters: number;
  calls: number;
  whatsapp: number;
  directions: number;
  social: number;
  shares: number;
  orders: number; // rows in `orders` that day (the real, server-recorded orders)
  revenue: number;
}

const startOf = (day: string) => sql`(${day}::date::timestamp AT TIME ZONE 'Africa/Tunis')`;
const endOf = (day: string) => sql`((${day}::date + 1)::timestamp AT TIME ZONE 'Africa/Tunis')`;

/** One row per Tunis day in [from, to]: rolled-up days + live detail rows + orders. */
export async function getDailyAudience(from: string, to: string): Promise<DailyAudience[]> {
  const rows = await sql`
    WITH live AS (
      SELECT (created_at AT TIME ZONE 'Africa/Tunis')::date AS day,
             count(DISTINCT visitor) FILTER (WHERE type = 'pageview') AS visitors,
             count(*) FILTER (WHERE type = 'pageview') AS pageviews,
             count(DISTINCT visitor) FILTER (WHERE type = 'order_start') AS order_starters,
             count(DISTINCT visitor) FILTER (WHERE type = 'order_submit') AS order_submitters,
             count(*) FILTER (WHERE type = 'call') AS calls,
             count(*) FILTER (WHERE type = 'whatsapp') AS whatsapp,
             count(*) FILTER (WHERE type = 'directions') AS directions,
             count(*) FILTER (WHERE type = 'social') AS social,
             count(*) FILTER (WHERE type = 'share') AS shares
      FROM site_events
      WHERE created_at >= ${startOf(from)} AND created_at < ${endOf(to)}
      GROUP BY 1
    ),
    combined AS (
      SELECT day, visitors, pageviews, order_starters, order_submitters, calls, whatsapp, directions, social, shares
      FROM site_daily WHERE day BETWEEN ${from}::date AND ${to}::date
      UNION ALL
      SELECT * FROM live
    ),
    ord AS (
      SELECT (created_at AT TIME ZONE 'Africa/Tunis')::date AS day, count(*) AS orders, COALESCE(sum(total), 0) AS revenue
      FROM orders
      WHERE created_at >= ${startOf(from)} AND created_at < ${endOf(to)}
      GROUP BY 1
    )
    SELECT to_char(g.d, 'YYYY-MM-DD') AS day,
           COALESCE(sum(c.visitors), 0) AS visitors,
           COALESCE(sum(c.pageviews), 0) AS pageviews,
           COALESCE(sum(c.order_starters), 0) AS order_starters,
           COALESCE(sum(c.order_submitters), 0) AS order_submitters,
           COALESCE(sum(c.calls), 0) AS calls,
           COALESCE(sum(c.whatsapp), 0) AS whatsapp,
           COALESCE(sum(c.directions), 0) AS directions,
           COALESCE(sum(c.social), 0) AS social,
           COALESCE(sum(c.shares), 0) AS shares,
           COALESCE(max(o.orders), 0) AS orders,
           COALESCE(max(o.revenue), 0) AS revenue
    FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS g(d)
    LEFT JOIN combined c ON c.day = g.d::date
    LEFT JOIN ord o ON o.day = g.d::date
    GROUP BY g.d
    ORDER BY g.d
  `;
  return rows.map((r) => ({
    day: r.day,
    visitors: Number(r.visitors),
    pageviews: Number(r.pageviews),
    orderStarters: Number(r.order_starters),
    orderSubmitters: Number(r.order_submitters),
    calls: Number(r.calls),
    whatsapp: Number(r.whatsapp),
    directions: Number(r.directions),
    social: Number(r.social),
    shares: Number(r.shares),
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));
}

export interface BreakdownRow {
  key: string;
  visitors: number;
  converted: number; // of those visitors, how many sent an order that day
}

export interface AudienceBreakdowns {
  from: string; // effective window (clamped to the retention cutoff)
  to: string;
  clamped: boolean;
  source: BreakdownRow[];
  device: BreakdownRow[];
  os: BreakdownRow[];
  browser: BreakdownRow[];
  country: BreakdownRow[];
  city: BreakdownRow[];
  hours: { hour: number; visitors: number }[];
}

/** Sources, devices, places and hours — only available for detailed (≤ 90-day-old) days. */
export async function getAudienceBreakdowns(from: string, to: string): Promise<AudienceBreakdowns | null> {
  const cutoff = detailCutoffDay();
  if (to < cutoff) return null;
  const effFrom = from < cutoff ? cutoff : from;

  const [dims, hourRows] = await Promise.all([
    sql`
      WITH ev AS (
        SELECT * FROM site_events WHERE created_at >= ${startOf(effFrom)} AND created_at < ${endOf(to)}
      ),
      first_pv AS (
        SELECT DISTINCT ON (visitor) visitor, source, device, os, browser, country, city
        FROM ev WHERE type = 'pageview' ORDER BY visitor, created_at
      ),
      conv AS (SELECT DISTINCT visitor FROM ev WHERE type = 'order_submit'),
      v AS (SELECT f.*, (c.visitor IS NOT NULL) AS converted FROM first_pv f LEFT JOIN conv c USING (visitor))
      SELECT 'source' AS dim, COALESCE(source, 'direct') AS key, count(*) AS visitors, count(*) FILTER (WHERE converted) AS converted FROM v GROUP BY 2
      UNION ALL SELECT 'device', COALESCE(device, '?'), count(*), count(*) FILTER (WHERE converted) FROM v GROUP BY 2
      UNION ALL SELECT 'os', COALESCE(os, '?'), count(*), count(*) FILTER (WHERE converted) FROM v GROUP BY 2
      UNION ALL SELECT 'browser', COALESCE(browser, '?'), count(*), count(*) FILTER (WHERE converted) FROM v GROUP BY 2
      UNION ALL SELECT 'country', COALESCE(country, '?'), count(*), count(*) FILTER (WHERE converted) FROM v GROUP BY 2
      UNION ALL SELECT 'city', COALESCE(city, '?'), count(*), count(*) FILTER (WHERE converted) FROM v GROUP BY 2
    `,
    sql`
      SELECT extract(hour FROM created_at AT TIME ZONE 'Africa/Tunis')::int AS hour, count(DISTINCT visitor) AS visitors
      FROM site_events
      WHERE type = 'pageview' AND created_at >= ${startOf(effFrom)} AND created_at < ${endOf(to)}
      GROUP BY 1
    `,
  ]);

  const pick = (dim: string): BreakdownRow[] =>
    dims
      .filter((r) => r.dim === dim)
      .map((r) => ({ key: r.key as string, visitors: Number(r.visitors), converted: Number(r.converted) }))
      .sort((a, b) => b.visitors - a.visitors);
  const byHour = new Map(hourRows.map((r) => [Number(r.hour), Number(r.visitors)]));

  return {
    from: effFrom,
    to,
    clamped: effFrom !== from,
    source: pick("source"),
    device: pick("device"),
    os: pick("os"),
    browser: pick("browser"),
    country: pick("country"),
    city: pick("city"),
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, visitors: byHour.get(hour) ?? 0 })),
  };
}

export interface AudienceBehaviour {
  visitors: number; // distinct visitors (pageviews) in the window — base for %
  sections: { id: string; visitors: number }[];
  engagement: {
    measured: number; // visitors with at least one engagement flush
    medianSec: number;
    avgScroll: number;
    quickExits: number; // < 10 s engaged
    scrollBuckets: { reached: 25 | 50 | 75 | 100; visitors: number }[];
  };
  speed: { device: string; samples: number; medianLoad: number | null; medianLcp: number | null }[];
  setup: {
    lang: { key: string; visitors: number }[];
    screen: { key: string; visitors: number }[];
    net: { key: string; visitors: number }[];
    darkVisitors: number;
    darkKnown: number;
  };
  dishes: {
    id: string;
    name: string;
    category: string | null;
    adds: number; // units added to a cart
    addVisitors: number;
    orderedQty: number; // units in recorded orders over the same window
  }[];
  abandon: {
    steps: { step: string; count: number; avgCart: number }[];
    totalCartValue: number;
    submits: number; // visitors who sent an order (same window) — for the completion rate
  };
  gallery: { key: string; opens: number }[];
  menuTabs: { key: string; views: number }[];
  /** Menu card photo viewer, per dish — most opened first. */
  itemPhotos: {
    id: string;
    name: string;
    opens: number;
    visitors: number;
    avgSeen: number; // distinct photos looked at per opening
    total: number; // photos the dish had (latest opening)
    sawAll: number; // openings where every photo was seen
  }[];
}

/** Anonymous behaviour details — like breakdowns, only for the last 90 days. */
export async function getAudienceBehaviour(from: string, to: string): Promise<AudienceBehaviour | null> {
  const cutoff = detailCutoffDay();
  if (to < cutoff) return null;
  const effFrom = from < cutoff ? cutoff : from;
  const inRange = sql`created_at >= ${startOf(effFrom)} AND created_at < ${endOf(to)}`;

  const [base, sections, eng, speed, setup, dishes, abandon, clicks, itemPhotos] = await Promise.all([
    sql`SELECT count(DISTINCT visitor) AS visitors FROM site_events WHERE type = 'pageview' AND ${inRange}`,
    sql`SELECT detail AS id, count(DISTINCT visitor) AS visitors FROM site_events WHERE type = 'section_view' AND ${inRange} GROUP BY 1`,
    sql`
      WITH v AS (
        SELECT visitor, sum(value) AS sec, max((data->>'scroll')::numeric) AS scroll
        FROM site_events WHERE type = 'engagement' AND ${inRange} GROUP BY visitor
      )
      SELECT count(*) AS measured,
             COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY sec), 0) AS median_sec,
             COALESCE(avg(scroll), 0) AS avg_scroll,
             count(*) FILTER (WHERE sec < 10) AS quick_exits,
             count(*) FILTER (WHERE scroll >= 25) AS s25,
             count(*) FILTER (WHERE scroll >= 50) AS s50,
             count(*) FILTER (WHERE scroll >= 75) AS s75,
             count(*) FILTER (WHERE scroll >= 95) AS s100
      FROM v
    `,
    sql`
      SELECT device,
             count(*) AS samples,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY (data->>'load')::numeric) FILTER (WHERE data->>'load' IS NOT NULL) AS median_load,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY (data->>'lcp')::numeric) FILTER (WHERE data->>'lcp' IS NOT NULL) AS median_lcp
      FROM site_events
      WHERE type = 'engagement' AND ${inRange} AND (data->>'load' IS NOT NULL OR data->>'lcp' IS NOT NULL)
      GROUP BY device
    `,
    sql`
      WITH pv AS (
        SELECT DISTINCT ON (visitor) visitor, data FROM site_events
        WHERE type = 'pageview' AND ${inRange} ORDER BY visitor, created_at
      )
      SELECT 'lang' AS dim, COALESCE(data->>'lang', '?') AS key, count(*) AS visitors FROM pv GROUP BY 2
      UNION ALL SELECT 'screen', COALESCE(data->>'screen', '?'), count(*) FROM pv GROUP BY 2
      UNION ALL SELECT 'net', COALESCE(data->>'net', '?'), count(*) FROM pv GROUP BY 2
      UNION ALL SELECT 'dark', data->>'dark', count(*) FROM pv WHERE data->>'dark' IS NOT NULL GROUP BY 2
    `,
    sql`
      WITH adds AS (
        SELECT detail AS id, count(*) AS adds, count(DISTINCT visitor) AS add_visitors
        FROM site_events WHERE type = 'cart_add' AND ${inRange} GROUP BY 1
      ),
      ordered AS (
        SELECT e->>'menuItemId' AS id, sum((e->>'quantity')::int) AS qty
        FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) e
        WHERE o.created_at >= ${startOf(effFrom)} AND o.created_at < ${endOf(to)}
        GROUP BY 1
      )
      SELECT COALESCE(a.id, d.id) AS id, mi.name, mi.category,
             COALESCE(a.adds, 0) AS adds, COALESCE(a.add_visitors, 0) AS add_visitors, COALESCE(d.qty, 0) AS ordered_qty
      FROM adds a FULL JOIN ordered d ON d.id = a.id
      LEFT JOIN menu_items mi ON mi.id = COALESCE(a.id, d.id)
      ORDER BY COALESCE(a.adds, 0) DESC, COALESCE(d.qty, 0) DESC
    `,
    sql`
      SELECT detail AS step, count(*) AS count, COALESCE(avg(value), 0) AS avg_cart, COALESCE(sum(value), 0) AS total
      FROM site_events WHERE type = 'order_abandon' AND ${inRange} GROUP BY 1
    `,
    sql`
      SELECT type, detail AS key, count(*) AS n,
             (SELECT count(DISTINCT visitor) FROM site_events WHERE type = 'order_submit' AND ${inRange}) AS submits
      FROM site_events WHERE type IN ('gallery_open', 'menu_tab', 'order_submit') AND ${inRange}
      GROUP BY 1, 2
    `,
    sql`
      WITH p AS (
        SELECT detail AS id, visitor, value AS seen, (data->>'total')::int AS total, created_at
        FROM site_events WHERE type = 'item_photos' AND ${inRange}
      )
      SELECT p.id, mi.name,
             count(*) AS opens,
             count(DISTINCT p.visitor) AS visitors,
             avg(p.seen) AS avg_seen,
             (array_agg(p.total ORDER BY p.created_at DESC))[1] AS total,
             count(*) FILTER (WHERE p.seen >= p.total) AS saw_all
      FROM p LEFT JOIN menu_items mi ON mi.id = p.id
      GROUP BY p.id, mi.name
      ORDER BY opens DESC, visitors DESC
    `,
  ]);

  const e = eng[0];
  const byDim = (dim: string) =>
    setup
      .filter((r) => r.dim === dim)
      .map((r) => ({ key: r.key as string, visitors: Number(r.visitors) }))
      .sort((a, b) => b.visitors - a.visitors);
  const dark = setup.filter((r) => r.dim === "dark");
  const STEP_ORDER = ["opened", "items", "details", "address"];

  return {
    visitors: Number(base[0].visitors),
    sections: sections.map((r) => ({ id: r.id as string, visitors: Number(r.visitors) })),
    engagement: {
      measured: Number(e.measured),
      medianSec: Math.round(Number(e.median_sec)),
      avgScroll: Math.round(Number(e.avg_scroll)),
      quickExits: Number(e.quick_exits),
      scrollBuckets: [
        { reached: 25, visitors: Number(e.s25) },
        { reached: 50, visitors: Number(e.s50) },
        { reached: 75, visitors: Number(e.s75) },
        { reached: 100, visitors: Number(e.s100) },
      ],
    },
    speed: speed.map((r) => ({
      device: r.device as string,
      samples: Number(r.samples),
      medianLoad: r.median_load !== null ? Math.round(Number(r.median_load)) : null,
      medianLcp: r.median_lcp !== null ? Math.round(Number(r.median_lcp)) : null,
    })),
    setup: {
      lang: byDim("lang"),
      screen: byDim("screen"),
      net: byDim("net"),
      darkVisitors: Number(dark.find((r) => r.key === "true")?.visitors ?? 0),
      darkKnown: dark.reduce((s, r) => s + Number(r.visitors), 0),
    },
    dishes: dishes.map((r) => ({
      id: r.id as string,
      name: (r.name as string | null) ?? (r.id as string),
      category: (r.category as string | null) ?? null,
      adds: Number(r.adds),
      addVisitors: Number(r.add_visitors),
      orderedQty: Number(r.ordered_qty),
    })),
    abandon: {
      steps: abandon
        .map((r) => ({ step: r.step as string, count: Number(r.count), avgCart: Number(r.avg_cart) }))
        .sort((a, b) => STEP_ORDER.indexOf(a.step) - STEP_ORDER.indexOf(b.step)),
      totalCartValue: abandon.reduce((s, r) => s + Number(r.total), 0),
      submits: Number(clicks[0]?.submits ?? 0),
    },
    gallery: clicks
      .filter((r) => r.type === "gallery_open")
      .map((r) => ({ key: r.key as string, opens: Number(r.n) }))
      .sort((a, b) => b.opens - a.opens),
    menuTabs: clicks
      .filter((r) => r.type === "menu_tab")
      .map((r) => ({ key: r.key as string, views: Number(r.n) }))
      .sort((a, b) => b.views - a.views),
    itemPhotos: itemPhotos.map((r) => ({
      id: r.id as string,
      name: (r.name as string | null) ?? (r.id as string),
      opens: Number(r.opens),
      visitors: Number(r.visitors),
      avgSeen: Number(r.avg_seen),
      total: Number(r.total),
      sawAll: Number(r.saw_all),
    })),
  };
}

/** Visitors over the last 7 Tunis days — dashboard card. */
export async function getVisitorsLast7Days(): Promise<number> {
  const to = tunisToday();
  const days = await getDailyAudience(shiftDay(to, -6), to);
  return days.reduce((s, d) => s + d.visitors, 0);
}
