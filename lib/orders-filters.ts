// Filters for /admin/clients (table + stats) and its CSV export — the URL
// search params are the single source of truth, so filtered views are
// shareable/bookmarkable and the export always matches what's on screen.
// Pure module: used by the server page, the export route and the client
// toolbar alike.

export const ORDER_STATUSES = ["all", "pending", "confirmed", "to_follow_up", "reviewed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABELS: Record<OrderStatus, string> = {
  all: "Toutes",
  pending: "Non confirmées",
  confirmed: "Confirmées",
  to_follow_up: "À relancer",
  reviewed: "Avis demandé",
};

export const ORDER_TYPES = ["all", "livraison", "emporter"] as const;
export type OrderTypeFilter = (typeof ORDER_TYPES)[number];

export const DATE_RANGES = ["all", "today", "7d", "30d", "month", "custom"] as const;
export type DateRange = (typeof DATE_RANGES)[number];
export const RANGE_LABELS: Record<DateRange, string> = {
  all: "Tout",
  today: "Aujourd'hui",
  "7d": "7 jours",
  "30d": "30 jours",
  month: "Ce mois",
  custom: "Personnalisé",
};

export const ORDER_SORTS = ["newest", "oldest", "total_desc", "total_asc"] as const;
export type OrderSort = (typeof ORDER_SORTS)[number];
export const SORT_LABELS: Record<OrderSort, string> = {
  newest: "Plus récentes",
  oldest: "Plus anciennes",
  total_desc: "Montant ↓",
  total_asc: "Montant ↑",
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export type ClientsView = "orders" | "stats";

export interface OrderFilters {
  view: ClientsView;
  q: string;
  status: OrderStatus;
  type: OrderTypeFilter;
  range: DateRange;
  from: string | null; // YYYY-MM-DD, Tunis local date (only for range=custom)
  to: string | null;
  sort: OrderSort;
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: OrderFilters = {
  view: "orders",
  q: "",
  status: "all",
  type: "all",
  range: "all",
  from: null,
  to: null,
  sort: "newest",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function oneOf<T extends string>(list: readonly T[], v: string | undefined, fallback: T): T {
  return list.includes(v as T) ? (v as T) : fallback;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(v: string | undefined): string | null {
  if (!v || !DATE_RE.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

export function parseOrderFilters(params: RawParams): OrderFilters {
  const pageSize = Number(get(params, "size"));
  const range = oneOf(DATE_RANGES, get(params, "range"), "all");
  return {
    view: get(params, "view") === "stats" ? "stats" : "orders",
    q: (get(params, "q") ?? "").trim().slice(0, 80),
    status: oneOf(ORDER_STATUSES, get(params, "status"), "all"),
    type: oneOf(ORDER_TYPES, get(params, "type"), "all"),
    range,
    from: range === "custom" ? validDate(get(params, "from")) : null,
    to: range === "custom" ? validDate(get(params, "to")) : null,
    sort: oneOf(ORDER_SORTS, get(params, "sort"), "newest"),
    page: Math.max(1, Math.min(10_000, Number.parseInt(get(params, "page") ?? "1", 10) || 1)),
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  };
}

/** Only non-default values go in the URL, keeping it short and readable. */
export function filtersToSearchParams(f: OrderFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.view !== "orders") p.set("view", f.view);
  if (f.q) p.set("q", f.q);
  if (f.status !== "all") p.set("status", f.status);
  if (f.type !== "all") p.set("type", f.type);
  if (f.range !== "all") p.set("range", f.range);
  if (f.range === "custom" && f.from) p.set("from", f.from);
  if (f.range === "custom" && f.to) p.set("to", f.to);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  if (f.pageSize !== DEFAULT_PAGE_SIZE) p.set("size", String(f.pageSize));
  return p;
}

/** Today's date in Tunis as YYYY-MM-DD, whatever the server/browser timezone. */
export function tunisToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(now);
}

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Resolves the range preset to inclusive Tunis-local dates (null = unbounded). */
export function resolveDateRange(f: Pick<OrderFilters, "range" | "from" | "to">, now = new Date()) {
  const today = tunisToday(now);
  switch (f.range) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "custom": {
      // Tolerate a reversed range instead of showing nothing.
      if (f.from && f.to && f.from > f.to) return { from: f.to, to: f.from };
      return { from: f.from, to: f.to };
    }
    default:
      return { from: null, to: null };
  }
}

export function hasActiveFilters(f: OrderFilters): boolean {
  return f.q !== "" || f.status !== "all" || f.type !== "all" || f.range !== "all";
}

export function formatDT(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} DT`;
}
