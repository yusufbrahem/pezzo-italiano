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

const MAX_BODY_BYTES = 2_000;

const Payload = z.object({
  t: z.enum(SITE_EVENT_TYPES),
  p: z.string().max(200).optional(), // path
  r: z.string().max(500).optional(), // document.referrer (pageviews only)
  u: z.string().max(100).optional(), // utm_source
  s: z.boolean().optional(), // opened as installed home-screen app
});

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
