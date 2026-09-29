import { createHash } from "node:crypto";
import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { recordSiteEvent, rollupOldSiteEvents, SITE_EVENT_TYPES } from "@/lib/data/audience";
import { tunisToday } from "@/lib/orders-filters";
import { isBot, parseBrowser, parseDevice, parseOs, parseSource } from "@/lib/visitor-info";

// First-party, cookie-less visit counting for /admin/audience.
//
// Privacy: no cookie or browser storage is used, and neither the IP nor the
// raw User-Agent is stored. `visitor` = hash(daily secret salt + IP + UA):
// stable for one person within one Tunis day (so unique visitors can be
// counted) but unlinkable across days and not reversible.
//
// Like /api/orders this is fire-and-forget from the browser: whatever
// happens here, the page never waits on it or breaks because of it.
//
// Defenses: same-origin + JSON only, tiny body cap, strict schema, bots and
// logged-in staff skipped, per-visitor and global rate limits in the INSERT.

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 3_000;

const Payload = z.object({
  t: z.enum(SITE_EVENT_TYPES),
  p: z.string().max(200).optional(), // path
  r: z.string().max(500).optional(), // document.referrer (pageviews only)
  u: z.string().max(100).optional(), // utm_source
  s: z.boolean().optional(), // opened as installed home-screen app
  d: z.string().max(64).optional(), // detail — validated per event type below
  v: z.number().finite().min(0).max(100_000).optional(), // numeric value — ditto
  x: z
    .object({
      lang: z.string().max(20),
      sw: z.number().int().min(0).max(10_000), // viewport width → bucketed, never stored raw
      dark: z.boolean(),
      net: z.string().max(10),
      scroll: z.number().min(0).max(100),
      lcp: z.number().min(0).max(60_000),
      load: z.number().min(0).max(120_000),
      size: z.string().max(10),
      items: z.number().int().min(0).max(500),
      ot: z.string().max(10),
    })
    .partial()
    .optional(),
});

type Built = { detail: string | null; value: number | null; data: Record<string, string | number | boolean | null> | null };

const SECTIONS = new Set(["hero", "histoire", "menu", "signatures", "avis", "galerie", "contact"]);
const FORM_STEPS = new Set(["opened", "items", "details", "address"]);
const SLUG = /^[a-z0-9_-]{1,64}$/;

function screenBucket(w: number | undefined): string | null {
  if (!w) return null;
  return w < 640 ? "phone" : w < 1024 ? "tablet" : w < 1440 ? "laptop" : "large";
}

/**
 * Only whitelisted, bounded fields are kept, per event type — the browser can
 * never make us store arbitrary text. Returns null to drop an invalid event.
 */
function buildFields(body: z.infer<typeof Payload>): Built | null {
  const x = body.x ?? {};
  const none: Built = { detail: null, value: null, data: null };
  switch (body.t) {
    case "pageview": {
      const lang = x.lang?.toLowerCase().match(/^[a-z]{2,3}/)?.[0] ?? null;
      const net = x.net && ["slow-2g", "2g", "3g", "4g"].includes(x.net) ? x.net : null;
      return { detail: null, value: null, data: { lang, screen: screenBucket(x.sw), dark: x.dark ?? null, net } };
    }
    case "section_view":
      return body.d && SECTIONS.has(body.d) ? { ...none, detail: body.d } : null;
    case "engagement":
      if (body.v === undefined || body.v > 1_800) return null; // ≤ 30 min per flush
      return {
        detail: null,
        value: Math.round(body.v),
        data: {
          scroll: x.scroll !== undefined ? Math.round(x.scroll) : null,
          lcp: x.lcp !== undefined ? Math.round(x.lcp) : null,
          load: x.load !== undefined ? Math.round(x.load) : null,
        },
      };
    case "cart_add":
      if (!body.d || !SLUG.test(body.d)) return null;
      return {
        detail: body.d,
        value: null,
        data: { size: x.size && ["quart", "demi", "plateau"].includes(x.size) ? x.size : null },
      };
    case "order_abandon":
      if (!body.d || !FORM_STEPS.has(body.d)) return null;
      return {
        detail: body.d,
        value: body.v !== undefined ? Math.round(body.v * 100) / 100 : null,
        data: {
          items: x.items ?? null,
          type: x.ot === "livraison" || x.ot === "emporter" ? x.ot : null,
        },
      };
    case "item_photos": {
      // value = distinct photos seen in one opening of a menu card's viewer, items = photos it has.
      const total = x.items;
      if (!body.d || !SLUG.test(body.d) || body.v === undefined || !total || total > 50) return null;
      const seen = Math.round(body.v);
      if (seen < 1 || seen > total) return null;
      return { detail: body.d, value: seen, data: { total } };
    }
    case "gallery_open":
    case "menu_tab":
      return body.d && SLUG.test(body.d) ? { ...none, detail: body.d } : null;
    default:
      return none;
  }
}

const done = () => new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });

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

// Only production traffic is real. Local dev and Vercel preview deployments
// share the same database, so they'd pollute the numbers — skipped unless
// TRACK_IN_DEV=1 (then tagged "dev:" so test rows are easy to delete).
function trackingMode(): "record" | "dev" | "off" {
  if (process.env.VERCEL_ENV === "production") return "record";
  if (process.env.NODE_ENV === "development" && process.env.TRACK_IN_DEV === "1") return "dev";
  return "off";
}

export async function POST(req: NextRequest) {
  try {
    const mode = trackingMode();
    if (mode === "off") return done();
    if (!isSameOrigin(req)) return new NextResponse(null, { status: 403 });
    if (!req.headers.get("content-type")?.startsWith("application/json")) return new NextResponse(null, { status: 415 });

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return new NextResponse(null, { status: 400 });
    }
    const parsed = Payload.safeParse(json);
    if (!parsed.success) return new NextResponse(null, { status: 400 });
    const body = parsed.data;
    const fields = buildFields(body);
    if (!fields) return new NextResponse(null, { status: 400 });

    const ua = req.headers.get("user-agent") ?? "";
    if (isBot(ua)) return done();
    // The owner and staff browsing their own site shouldn't inflate the numbers.
    if (req.cookies.has(SESSION_COOKIE)) return done();

    const ip =
      req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const dailySalt = createHash("sha256")
      .update(`${process.env.SESSION_SECRET ?? "pezzo"}:visitors:${tunisToday()}`)
      .digest("hex");
    const visitor = createHash("sha256").update(`${dailySalt}|${ip}|${ua}`).digest("hex").slice(0, 20);

    const standalone = body.s === true;
    const city = req.headers.get("x-vercel-ip-city");
    const path = (body.p ?? "/").slice(0, 100);

    await recordSiteEvent({
      visitor,
      type: body.t,
      path: mode === "dev" ? `dev:${path}` : path,
      source:
        body.t === "pageview"
          ? parseSource({
              ua,
              referrer: body.r || null,
              utmSource: body.u || null,
              ownHost: req.headers.get("host"),
              standalone,
            })
          : null,
      device: parseDevice(ua),
      os: parseOs(ua),
      browser: parseBrowser(ua),
      country: req.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
      city: city ? decodeURIComponent(city).slice(0, 60) : null,
      standalone,
      ...fields,
    });

    // Housekeeping without a cron job: now and then, fold >90-day-old detail
    // rows into daily totals — after the response, so no visitor waits on it.
    if (Math.random() < 0.01) {
      after(() => rollupOldSiteEvents().catch((err) => console.error("[track] rollup failed:", err)));
    }

    return done();
  } catch (err) {
    console.error("[api/track] failed:", err);
    return done(); // never surface errors to visitors
  }
}
