import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { parseBrowser, parseDevice, parseOs } from "@/lib/visitor-info";
import { actionsInGroup, type ActivityAction, type ActivityGroup } from "@/lib/activity-actions";
import type { Role } from "@/lib/auth/roles";

// Admin activity history — every login/logout and everything done in /admin,
// readable by the owner only (/admin/activity). Logging never throws and never
// blocks the action it describes: a failure here is only console-logged.

const RETENTION_DAYS = 365;

export interface ActivityInput {
  userId: string | null;
  action: ActivityAction;
  target?: string | null;
  details?: Record<string, string | number | boolean | string[] | null> | null;
  identifier?: string | null; // failed logins: what was typed
}

export async function logActivity(e: ActivityInput) {
  try {
    const h = await headers();
    const ua = h.get("user-agent") ?? "";
    const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ipHash = ip
      ? createHash("sha256").update(`${process.env.SESSION_SECRET ?? "pezzo"}:admin-ip:${ip}`).digest("hex").slice(0, 16)
      : null;
    const city = h.get("x-vercel-ip-city");
    await sql`
      INSERT INTO admin_activity (user_id, identifier, action, target, details, device, browser, os, city, country, ip_hash)
      VALUES (
        ${e.userId}, ${e.identifier?.slice(0, 120) ?? null}, ${e.action}, ${e.target?.slice(0, 200) ?? null},
        ${e.details ? JSON.stringify(e.details) : null}::jsonb,
        ${ua ? parseDevice(ua) : null}, ${ua ? parseBrowser(ua) : null}, ${ua ? parseOs(ua) : null},
        ${city ? decodeURIComponent(city).slice(0, 60) : null}, ${h.get("x-vercel-ip-country")?.slice(0, 2) ?? null},
        ${ipHash}
      )
    `;
  } catch (err) {
    console.error("[activity] log failed:", err);
  }
}

/** Page views: one per page per minute per person, so a refresh loop doesn't flood the history. */
export async function logPageView(userId: string, path: string) {
  const recent = await sql`
    SELECT 1 FROM admin_activity
    WHERE user_id = ${userId} AND action = 'page_view' AND target = ${path} AND at > now() - interval '1 minute'
    LIMIT 1
  `.catch(() => []);
  if (recent.length) return;
  await logActivity({ userId, action: "page_view", target: path });
}

export async function purgeOldActivity() {
  await sql`DELETE FROM admin_activity WHERE at < now() - make_interval(days => ${RETENTION_DAYS})`;
}

// ── Reading (owner-only page) ─────────────────────────────────────────────

export const ACTIVITY_PERIODS = { today: "Aujourd'hui", "7d": "7 jours", "30d": "30 jours", "90d": "90 jours", all: "Tout" } as const;
export type ActivityPeriod = keyof typeof ACTIVITY_PERIODS;

export interface ActivityFilters {
  userId: string | null;
  group: ActivityGroup | null;
  period: ActivityPeriod;
  pages: boolean; // include page views
  page: number;
}

export interface ActivityRow {
  id: string;
  at: string;
  userId: string | null;
  userName: string | null;
  userRole: Role | null;
  identifier: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  country: string | null;
  ipHash: string | null;
}

export const ACTIVITY_PAGE_SIZE = 50;

function periodStart(p: ActivityPeriod): Date | null {
  const now = Date.now();
  if (p === "all") return null;
  if (p === "today") {
    // Midnight in Tunis (UTC+1, no DST).
    const tunis = new Date(now + 60 * 60 * 1000);
    tunis.setUTCHours(0, 0, 0, 0);
    return new Date(tunis.getTime() - 60 * 60 * 1000);
  }
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

function whereFor(f: ActivityFilters) {
  const start = periodStart(f.period);
  const actions = f.group ? actionsInGroup(f.group) : null;
  return sql`
    WHERE TRUE
    ${f.userId ? sql`AND a.user_id = ${f.userId}` : sql``}
    ${start ? sql`AND a.at >= ${start.toISOString()}` : sql``}
    ${actions ? sql`AND a.action = ANY(${actions})` : sql``}
    ${!f.pages && f.group !== "navigation" ? sql`AND a.action <> 'page_view'` : sql``}
  `;
}

export async function listActivity(f: ActivityFilters): Promise<{ rows: ActivityRow[]; total: number }> {
  const where = whereFor(f);
  const offset = (Math.max(1, f.page) - 1) * ACTIVITY_PAGE_SIZE;
  const [rows, count] = await Promise.all([
    sql`
      SELECT a.*, u.name AS user_name, u.role AS user_role
      FROM admin_activity a LEFT JOIN admin_users u ON u.id = a.user_id
      ${where}
      ORDER BY a.at DESC, a.id DESC
      LIMIT ${ACTIVITY_PAGE_SIZE} OFFSET ${offset}
    `,
    sql`SELECT count(*)::int AS n FROM admin_activity a ${where}`,
  ]);
  return {
    total: count[0].n,
    rows: rows.map((r) => ({
      id: String(r.id),
      at: new Date(r.at).toISOString(),
      userId: r.user_id,
      userName: r.user_name ?? null,
      userRole: r.user_role ?? null,
      identifier: r.identifier,
      action: r.action,
      target: r.target,
      details: r.details,
      device: r.device,
      browser: r.browser,
      os: r.os,
      city: r.city,
      country: r.country,
      ipHash: r.ip_hash,
    })),
  };
}

export interface MemberActivity {
  id: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLogin: string | null;
  lastSeen: string | null;
  actions7d: number; // excluding page views
  failed7d: number;
}

export async function getMembersActivity(): Promise<MemberActivity[]> {
  const rows = await sql`
    SELECT u.id, u.name, u.role, u.is_active,
      (SELECT max(at) FROM admin_activity WHERE user_id = u.id AND action = 'login') AS last_login,
      (SELECT max(at) FROM admin_activity WHERE user_id = u.id) AS last_seen,
      (SELECT count(*)::int FROM admin_activity WHERE user_id = u.id AND at > now() - interval '7 days'
         AND action NOT IN ('page_view', 'login', 'logout', 'login_failed', 'login_locked')) AS actions_7d,
      (SELECT count(*)::int FROM admin_activity WHERE user_id = u.id AND at > now() - interval '7 days'
         AND action IN ('login_failed', 'login_locked')) AS failed_7d
    FROM admin_users u
    ORDER BY CASE u.role WHEN 'owner' THEN 0 WHEN 'administrator' THEN 1 ELSE 2 END, u.created_at
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    isActive: r.is_active,
    lastLogin: r.last_login ? new Date(r.last_login).toISOString() : null,
    lastSeen: r.last_seen ? new Date(r.last_seen).toISOString() : null,
    actions7d: r.actions_7d,
    failed7d: r.failed_7d,
  }));
}
