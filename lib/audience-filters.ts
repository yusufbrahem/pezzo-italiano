// Period filter for /admin/audience — kept in the URL (?range=…&from=…&to=…).
// Pure module, shared by the server page and the client toolbar.
import { tunisToday } from "@/lib/orders-filters";

export const AUDIENCE_RANGES = ["today", "7d", "30d", "90d", "month", "12m", "custom"] as const;
export type AudienceRange = (typeof AUDIENCE_RANGES)[number];

export const AUDIENCE_RANGE_LABELS: Record<AudienceRange, string> = {
  today: "Aujourd'hui",
  "7d": "7 jours",
  "30d": "30 jours",
  "90d": "90 jours",
  month: "Ce mois",
  "12m": "12 mois",
  custom: "Personnalisé",
};

export interface AudienceFilters {
  range: AudienceRange;
  from: string | null;
  to: string | null;
}

/** Detailed rows (sources, devices, places, hours) are kept this long; older days keep totals only. */
export const DETAIL_RETENTION_DAYS = 90;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function shiftDay(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

function validDate(v: string | null | undefined): string | null {
  if (!v || !DATE_RE.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

export function parseAudienceFilters(params: Record<string, string | string[] | undefined>): AudienceFilters {
  const get = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const r = get("range");
  const range = (AUDIENCE_RANGES as readonly string[]).includes(r ?? "") ? (r as AudienceRange) : "30d";
  return {
    range,
    from: range === "custom" ? validDate(get("from")) : null,
    to: range === "custom" ? validDate(get("to")) : null,
  };
}

/** Inclusive Tunis-local dates for the selected period (never in the future). */
export function resolveAudienceRange(f: AudienceFilters, now = new Date()): { from: string; to: string } {
  const today = tunisToday(now);
  switch (f.range) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: shiftDay(today, -6), to: today };
    case "90d":
      return { from: shiftDay(today, -89), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "12m":
      return { from: shiftDay(today, -364), to: today };
    case "custom": {
      let from = f.from ?? shiftDay(today, -29);
      let to = f.to ?? today;
      if (from > to) [from, to] = [to, from];
      if (to > today) to = today;
      if (daysBetween(from, to) > 730) from = shiftDay(to, -730); // keep queries bounded
      return { from, to };
    }
    default:
      return { from: shiftDay(today, -29), to: today };
  }
}

export function audienceSearchParams(f: AudienceFilters): string {
  const p = new URLSearchParams();
  if (f.range !== "30d") p.set("range", f.range);
  if (f.range === "custom") {
    if (f.from) p.set("from", f.from);
    if (f.to) p.set("to", f.to);
  }
  return p.toString();
}
