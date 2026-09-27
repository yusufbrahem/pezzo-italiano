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
}

// Per-visitor and site-wide ceilings, checked inside the INSERT itself (one
// round trip). Generous for real people, tight enough that a script can't
// flood the table.
const MAX_PER_VISITOR_10MIN = 120;
const MAX_GLOBAL_PER_MIN = 600;

/** Returns false when the event was dropped by a rate limit. */
export async function recordSiteEvent(e: NewSiteEvent): Promise<boolean> {
  const rows = await sql`
    INSERT INTO site_events (visitor, type, path, source, device, os, browser, country, city, standalone)
    SELECT ${e.visitor}, ${e.type}, ${e.path}, ${e.source}, ${e.device}, ${e.os}, ${e.browser},
           ${e.country}, ${e.city}, ${e.standalone}
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

/** Visitors over the last 7 Tunis days — dashboard card. */
export async function getVisitorsLast7Days(): Promise<number> {
  const to = tunisToday();
  const days = await getDailyAudience(shiftDay(to, -6), to);
  return days.reduce((s, d) => s + d.visitors, 0);
}
