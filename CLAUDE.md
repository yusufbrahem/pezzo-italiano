@AGENTS.md

# Pezzo Italiano — Website Project Log

## Project Overview

Restaurant website for **Pezzo Italiano** — an authentic pizza al taglio restaurant in Sousse, Tunisia (Khzema Ouest).

- **Framework**: Next.js 16.3.5 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Database**: Neon Postgres (Vercel Marketplace integration — see Admin Panel section)
- **File storage**: Vercel Blob (menu item photos uploaded via `/admin`)
- **Hosting**: Vercel
- **Domain**: `pezzo-italiano.com` (registered on Cloudflare)
- **Production URL**: `https://pezzo-italiano.com`
- **Fallback URL**: `https://pezzo-italiano.vercel.app` (always active)
- **Admin panel**: `https://pezzo-italiano.com/admin` — see Admin Panel section below

---

## Environment Variables

| Variable | Where set | Value / Notes |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Vercel + `.env.local` | Server-side only. Key restriction must be **None** (not HTTP referrer) — server requests have no referrer |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Vercel | `G-6H3FMDDRXQ` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Vercel (Production) + `.env.local` | `yhib0bm7ti` |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Not needed | Search Console is verified as a **Domain** property via a Cloudflare DNS `TXT` record (2026-09-29), not the meta tag. Only set this if a URL-prefix property is ever added |
| `SESSION_SECRET` | Vercel (Production + Development) + `.env.local` | Signs admin session JWTs (`jose`) — long random string, generated once |
| `DATABASE_URL` (+ `POSTGRES_*`/`PG*` aliases) | Vercel (all envs) + `.env.local` | Auto-injected by the Neon marketplace integration. All environments share the **same** database (no per-environment branching set up) |
| `BLOB_READ_WRITE_TOKEN` | Vercel (all envs) + `.env.local` | Auto-injected by the Vercel Blob store (`pezzo-italiano-media`) connected to this project |

**After `vercel env pull`**: it overwrites `.env.local` wholesale, dropping any vars not present in the environment you pulled (e.g. pulling `development` drops `NEXT_PUBLIC_GA_MEASUREMENT_ID`, which is Production-only). Re-add the missing ones from this table after pulling.

---

## Infrastructure

### DNS (Cloudflare → Vercel)
- Domain `pezzo-italiano.com` registered on **Cloudflare**
- DNS records in Cloudflare:
  - `A` — `@` → `76.76.21.21` — proxy: **DNS only (grey cloud)**
  - `CNAME` — `www` → `cname.vercel-dns.com` — proxy: **DNS only (grey cloud)**
- Proxy must stay grey — orange cloud conflicts with Vercel's SSL provisioning
- `www.pezzo-italiano.com` redirects (301) to `pezzo-italiano.com` via `next.config.ts`

### SITE_URL
Defined individually in 3 files — update all 3 when changing domain:
- `app/(site)/layout.tsx` — canonical, Open Graph, JSON-LD schema
- `app/sitemap.ts`
- `app/robots.ts`

---

## Analytics

### Google Analytics 4
- Measurement ID: `G-6H3FMDDRXQ`
- Loaded by `components/Analytics.tsx` (no longer `@next/third-parties`): a tiny inline init defines `window.gtag`/`dataLayer` early (`afterInteractive`), while `gtag.js` itself loads `lazyOnload` (after the load event, when idle) — events fired before that are queued, not lost. Done 2026-09-29 for mobile Lighthouse (third-party JS was ~1.5 s of startup main-thread time)
- `lib/analytics.ts` sends events via `window.gtag` — `sendGAEvent` from `@next/third-parties` only works when its own `<GoogleAnalytics>` component is mounted
- GA4's setup bot may not detect the tag (expected, click "Set up later"). `NEXT_PUBLIC_GA_MEASUREMENT_ID` is empty in `.env.local`, so GA never loads in local dev

### Microsoft Clarity
- Component: `components/Analytics.tsx` (uses `next/script` strategy `lazyOnload` — its snippet is a queueing stub, so loading it late loses nothing)
- Reads `NEXT_PUBLIC_CLARITY_PROJECT_ID` env var — returns null if not set
- **Configured** — project ID `yhib0bm7ti`, set in Vercel (Production) and `.env.local`

### PWA install tracking (`components/PWATracking.tsx`)
- `pwa_installed` — real install event, fires on Android/desktop Chrome only (`appinstalled`)
- `pwa_standalone_launch` — iOS proxy metric (Apple exposes no install event at all); fires when the site is opened already running installed (`display-mode: standalone`)
- `pwa_prompt_shown` / `pwa_prompt_dismissed` — fired by `components/IOSInstallBanner.tsx`, the dismissible "Add to Home Screen" banner shown only to real iOS Safari visitors (excludes in-app browsers and Chrome/Firefox for iOS)

### Custom Event Tracking (`lib/analytics.ts`)
All clickable elements are tracked. Available helpers:
```ts
track.ctaClick(label)
track.callClick(phone, source)
track.whatsappClick(source)
track.mapClick(source)
track.socialClick(platform)
track.menuTabClick(tab)
track.comingSoonToggle(opened)
track.reviewsCTAClick()
```

---

## Admin Panel

Lets the owner/staff change menu prices, add pizzas with photos, edit contact info, hours, and refresh Google Reviews — **without a code deploy**. Live at `/admin`.

### Stack
- **DB**: Neon Postgres via `@neondatabase/serverless` (`lib/db.ts`'s `sql` tagged template) — **not** `@vercel/postgres`, which is deprecated
- **Photos**: Vercel Blob, uploaded **client-side directly** (`@vercel/blob/client`'s `upload()`) rather than through a Server Action — Vercel Functions cap request bodies at 4.5 MB on every plan, too small for a real phone photo
- **Auth**: hand-rolled per Next.js's own official auth guide — `jose` (JWT) + `bcryptjs` (hashing) + `zod` (validation). No NextAuth — fewer dependencies to keep working across Next upgrades
- Everything runs on free tiers (Neon free plan, Vercel Blob free plan)

### How auth works
- `proxy.ts` (repo root) — **optimistic** gate: redirects to `/admin/login` if the session cookie is simply absent. Next 16 renamed `middleware.ts` → `proxy.ts`; it explicitly warns not to trust this as the only gate, since Server Actions are POST requests to their own page route, not separate entries in the proxy chain.
- `lib/auth/session.ts`'s `requireSession()`/`requireOwner()` — the **real** gate, called at the top of every admin page and every Server Action. Re-verifies the JWT **and** re-checks `admin_users.is_active` in the DB on every single call (wrapped in React's `cache()` so it's one DB query per request, not one per call site) — so deactivating a staff account takes effect on their very next request, not just their next login.
- 5 failed logins → account locked 15 minutes (DB-backed via `admin_users.failed_attempts`/`locked_until` — no in-memory state, since Vercel serverless instances aren't persistent).
- First owner account was created by `scripts/seed-menu.ts` (one-time, already run). **Credentials were not written anywhere in this repo** — ask whoever ran the seed script, or reset via direct DB access (`UPDATE admin_users SET password_hash = ...`) if lost. Additional staff accounts are created from `/admin/staff` (owner-only).

### Route structure — two separate root layouts
Next 16 supports "multiple root layouts" via route groups (no shared `app/layout.tsx`):
- `app/(site)/layout.tsx` + `app/(site)/page.tsx` — the marketing site (moved here from `app/layout.tsx`/`app/page.tsx`). Mounts `OrderProvider`, GA4, Clarity, PWA tracking.
- `app/admin/layout.tsx` — independent root layout for `/admin/*`. Deliberately **excludes** all of the above — no reason for GA/PWA/order-modal chrome on the admin panel. Sets `robots: noindex`.
  - `app/admin/login/` — public (outside the `(protected)` group, so `requireSession()` never redirects it to itself).
  - `app/admin/(protected)/` — everything else. Its `layout.tsx` calls `requireSession()`.

### Pages
| Route | Purpose |
|---|---|
| `/admin/login` | Login |
| `/admin` | Dashboard — orders this week / to follow up, item count, open/closed status, rating |
| `/admin/clients` | Every order submitted from the site's order form (see "Customer orders" below). Two tabs: **Commandes** (table on desktop / cards on phones, click → details drawer with "Confirmée" toggle + one-click "Demander un avis" WhatsApp link; pagination 10/25/50/100) and **Statistiques** (revenue, avg basket, customers/regulars, best sellers per category, pizza sizes, orders per day/week, peak hours, delivery zones). Live filters shared by both tabs: status tabs with counts, search, delivery/pickup, date range, sort — all stored in the URL. **Exporter** (owner-only) downloads an .xlsx. Delete is owner-only |
| `/admin/audience` | Visitors (unique per day), page views, order funnel (visit → form opened → order sent), direct contacts (calls/WhatsApp/directions), visitors per day/week, sources with conversion, devices/OS/browsers, cities/countries, hours & weekdays. Period presets + custom range, compared with the previous period. See "Audience" below |
| `/admin/menu` | List by category, reorder (▲▼), inline delete, link to edit |
| `/admin/menu/new`, `/admin/menu/[id]/edit` | Add/edit — prices, photos (up to 12, reorderable; the 1st is the card photo, all are shown in the card's photo viewer), tags, flags (Signature/Nouveau/Coup de cœur/Choix du Dev/etc.) |
| `/admin/pricing` | The 4 tier-legend cards above the pizza grid (Classique/Premium/Prestige/Sélection Oro in `MenuShowcase.tsx`'s `PizzaPricingTable`) — `site_settings.pricing_tiers`. Separate from individual pizza prices, which live on each `menu_items` row and are edited from `/admin/menu` |
| `/admin/contact` | Address, phone, WhatsApp number, social links |
| `/admin/hours` | Weekly schedule **and** the "exceptionally open/closed" override (with optional auto-expiry) |
| `/admin/reviews` | Current rating + "Rafraîchir maintenant" (forces an immediate Google Places re-fetch via `updateTag`, bypassing the normal 6h cache) |
| `/admin/staff` | Owner-only — create/deactivate staff, reset passwords |

### Data flow (the part that replaced the old static files)
- `data/menu.ts` no longer holds actual menu data — just `MenuItem`/`MenuCategory` **types** and 3 pure filter helpers (`getSignatureItems`, `getAvailablePizzas`, `getComingSoonPizzas`) that now take an `items` array as a parameter. The real data comes from `lib/data/menu.ts`'s `getMenuItems()` (DB query, `cache()`-wrapped).
- `app/(site)/layout.tsx` fetches `items` + `contact` once and passes them into `<OrderProvider items={...} contact={...}>`, which puts them on `OrderContext` — **any** client component already inside that tree (which is nearly everything: `MenuShowcase`, `SignatureProducts`, `OrderModal`, `Navbar`, `Footer`, `Gallery`, `Contact`, `StickyMobileCTA`) reads them via `useOrder()` instead of importing a static file.
- Contact info used to be hardcoded in **7 separate places** (including the actual WhatsApp number orders get sent to, in `lib/order.ts`). All now flow from one `site_settings.contact` row in the DB.
- Opening hours used to be hardcoded in **3 separate places** (`lib/hours.ts`, the JSON-LD in layout, and Contact's displayed hours list) — now one `site_settings.hours_schedule` row, with a separate `hours_override` row for the "exceptionally open" toggle. `lib/hours.ts`'s `useIsOpenNow()` hook now polls the public `GET /api/hours-status` route instead of computing locally — same signature, so `Contact.tsx`/`Footer.tsx` needed no changes for the badge itself.
- **`/` and `/admin` are separate root layouts** (see above) — `revalidatePath("/", "layout")` does **not** cascade to `/admin`. Every admin mutation calls both `revalidatePath("/", "layout")` **and** `revalidatePath("/admin", "layout")`, or the admin UI itself won't refresh after its own edits (found and fixed this exact bug during testing — the underlying DB write was always correct, just the admin page's own view didn't know to refetch).

### Gotchas hit building this (useful if extending it)
- Next 16.3+ changed `revalidateTag(tag)` to require a second `profile` argument (`revalidateTag(tag, "max")` or `{expire}`). For "I need this gone right now" inside a Server Action, use `updateTag(tag)` instead (new in Next 16, Server-Action-only, immediate — used by the reviews refresh button).
- `@vercel/postgres` is deprecated — use `@neondatabase/serverless`'s `neon()` instead.
- A critical Next.js CVE (proxy bypass, among others) affected `<=16.3.2` — this repo is pinned to `16.3.5`. Worth checking `npm audit` before ever downgrading Next.
- **Timezones:** an `<input type="datetime-local">` value has no zone — `new Date(value)` on the server uses the *server's* zone (UTC on Vercel, whatever the dev PC uses locally). This made the hours override expire an hour late. Always go through `lib/hours-shared.ts`'s `tunisLocalInputToIso()` / `isoToTunisLocalInput()`.
- **Closing after midnight:** a day whose `closes` ≤ `opens` (e.g. 11:00 → 01:00) is treated as closing the next night — `computeIsOpen()` also checks the previous day's overnight tail.
- **`/admin/contact` validation is strict on purpose:** the WhatsApp number is normalized to digits (every site order goes to `wa.me/<it>`, so spaces/"+" would break ordering); map/social links must be `https` on the expected host (they're rendered as links and an `<iframe>` on the public site, and plain `z.url()` accepts `javascript:` URLs).
- `formData.get("missing_field")` returns `null`, not `undefined` — but `z.string().optional()` only accepts `undefined`. Reading fields individually (as `/admin/pricing`'s form does, since some tiers omit the tagline/plateau inputs entirely) needs `formData.get(name) ?? undefined` before passing to Zod, or validation silently rejects the whole submission. `Object.fromEntries(formData.entries())` (used by the other admin forms) sidesteps this — an absent field is just an absent key, which Zod's `.optional()` handles correctly.

### Menu item photos
- `menu_items.image` = main/card photo, `menu_items.extra_images TEXT[]` = the rest, in order (`MenuItem.extraImages`; `getItemPhotos()` in `data/menu.ts` returns them all). On the site the card photo is swipeable (`CardPhotoCarousel` in `MenuShowcase.tsx` — dots, hover arrows on desktop; photos browsed there are sent as one `item_photos` event when the page is hidden). Tapping it opens `components/ItemPhotosLightbox.tsx` on the current photo (portaled to `<body>` — the cards are CSS-transformed, which would trap a fixed overlay).
- Managed from `/admin/menu` via `PhotosUpload.tsx` (multi-select, one-at-a-time client-side Blob uploads). `actions.ts` only accepts `/images/…` or our `*.public.blob.vercel-storage.com` URLs, max 12, and deletes Blob files that were removed from the list.
- `scripts/migrate-menu-photos.ts` (already run, 2026-09-29) added the column and seeded each item with the Gallery photos from its `/images/<folder>/` (`data/gallery.ts` — the Gallery section's own list).

### Customer orders (`orders` table → `/admin/clients`)
- When a customer taps "Commander via WhatsApp", `components/OrderModal.tsx`'s `recordOrder()` POSTs to `app/api/orders/route.ts` — **fire-and-forget** (`keepalive`, never awaited, errors swallowed). WhatsApp opens immediately regardless, so a DB outage / 429 / crash only means that one order isn't recorded; ordering itself never depends on it. Verified by forcing the request to hang forever — WhatsApp still opened instantly.
- A row means the customer *opened* WhatsApp with the order, not that they sent it — hence the "Confirmée" toggle.
- No consent checkbox on the form (owner's decision, 2026-09-27).
- **Security / anti-spam in the route** (all verified against the dev server): same-origin check (403) + JSON-only (415), 16 KB body cap (413), strict Zod schema with length/count caps (400), honeypot field `pi_hp_contact_url` → silent fake 204, DB-backed rate limits (per IP 10/10 min + 60/24 h — generous because Tunisian mobile carriers share IPs via CGNAT; per phone 5/h; global 300/h) → 429. **Item names and prices are recomputed from `menu_items`** — the browser only sends item id/size/quantity, so a tampered price is ignored. Raw IPs are never stored (salted SHA-256 `ip_hash`, salt = `SESSION_SECRET`).
- Phone numbers are normalized to wa.me digits (`lib/order.ts`'s `normalizePhone`: bare 8 digits → `216…`); "N commandes" badge groups by that normalized number.
- Review message text + Google review link: `buildReviewRequestUrl()` / `GOOGLE_REVIEW_URL` in `lib/order.ts`.
- Table created by `scripts/migrate-create-orders.ts` (already run against the shared DB, 2026-09-27); also in `scripts/schema.sql`.
- Filters: `lib/orders-filters.ts` (pure, shared by page, client toolbar and export) parses/serializes the URL params; `lib/data/orders.ts`'s `whereFor()` turns them into composed, fully parameterized `sql` fragments (Neon's driver supports nesting `sql\`…\`` inside `sql\`…\``). The only raw SQL is `ORDER BY`, taken from a fixed whitelist via `sql.unsafe`. Date ranges are Tunis-local days.
- Stats: `getOrderAnalytics()` — items are unpacked from the `items` JSONB with `jsonb_array_elements`. Each stored item carries its `category` (orders from before that was added fall back to the current `menu_items.category`). Revenue excludes "prix à confirmer" (custom plateau) lines.
- Export: `GET /api/admin/orders/export?scope=all|filtered` → `lib/orders-export.ts` (`exceljs`). **Deliberately .xlsx, not CSV** — CSV's separator depends on the viewer's Excel locale (`;` in French, `,` in English) and opened as one crammed column. 3 sheets: Résumé / Commandes / Articles; dates written as Tunis wall-clock; header frozen + autofilter; `SUBTOTAL` totals row that follows Excel filters. Customer text is always a plain string cell, so formula injection (`=HYPERLINK(…)` as a name) is inert.
- `package.json` has `overrides.uuid: ^11.1.1` — exceljs pins an old `uuid` with a (non-exploitable here) advisory; the override keeps `npm audit` clean for it.

### Unsent order forms (`order_drafts` → `/admin/clients?view=drafts`, "Non envoyés")
- Owner's decision (2026-09-27, taking responsibility, lawyer to be consulted): the name, **complete** phone number (8 local digits — `isCompletePhone()` in `lib/order.ts`) and cart typed in the order form are saved **even if the visitor never presses "Commander"**, with no notice on the form. Kept separate from `orders` and from the anonymous `site_events` analytics.
- `OrderModal` → `POST /api/order-draft` debounced 1.5 s after typing stops, plus once on `pagehide`; only when the cart has ≥ 1 item and the number is complete. One row per opening of the modal (random `draftKey`, upserted in place).
- When the order is actually sent, `/api/orders` receives the same `draftKey` and deletes that draft plus same-phone drafts from the last 3 h (`deleteDraftsForOrder`). Drafts are purged after 30 days (`purgeOldDrafts`, via `after()` from `/admin/clients` loads and ~5% of draft saves).
- Same defenses as `/api/orders` (shared in `lib/order-intake.ts`: same-origin + JSON, size cap, Zod, honeypot, server-side re-pricing via `priceCartItems`, salted IP hash). Rate limit on *new* drafts: 15/IP/h, 5/phone/h, 300/h global. A draft can only be updated by the IP hash that created it (another visitor reusing a key gets 429, row untouched).
- Table created by `scripts/migrate-create-order-drafts.ts` (already run, 2026-09-27); also in `scripts/schema.sql`.

### Audience — first-party visitor analytics (`site_events` / `site_daily` → `/admin/audience`)
- `components/SiteTracker.tsx` (mounted in `app/(site)/layout.tsx`) sends one `pageview` per page load; `lib/analytics.ts`'s `track.*` helpers additionally send `order_start`, `order_submit`, `call`, `whatsapp`, `directions`, `social`, `share` (via `lib/site-tracking.ts`). All fire-and-forget `keepalive` fetches to `POST /api/track`.
- **No cookies, no browser storage, no IP stored.** `visitor` = SHA-256(daily salt derived from `SESSION_SECRET` + Tunis date | IP | UA): unique per person *per day*, unlinkable across days → "visitors" are always unique-per-day, summed over a period.
- `/api/track` skips: bots (UA regex in `lib/visitor-info.ts`), anyone with the admin session cookie (owner/staff don't inflate numbers), and every non-production environment — **it only records when `VERCEL_ENV === "production"`** (dev + preview share the prod DB). For local testing set `TRACK_IN_DEV=1` in `.env.local`; rows are then tagged `path = 'dev:…'` for easy deletion. Same-origin + JSON-only, 2 KB cap, Zod schema, rate limits inside the INSERT (120/visitor/10 min, 600/min site-wide).
- Source detection (`parseSource`): `?utm_source=` → in-app browser UA (Instagram/Facebook/TikTok/Snapchat send no referrer) → referrer domain → `app` (home-screen) / `direct`. Country/city come from Vercel's `x-vercel-ip-country` / `x-vercel-ip-city` headers.
- **Retention:** detailed rows are kept 90 days (`DETAIL_RETENTION_DAYS`). `rollupOldSiteEvents()` folds whole older Tunis days into `site_daily` totals and deletes them, in one transaction — idempotent, no cron: triggered via `after()` from `/admin/audience` page loads and ~1% of `/api/track` hits. Breakdowns (sources/devices/places/hours) therefore only exist for the last 90 days; totals/timeline/funnel work for any range (`getDailyAudience` unions `site_daily` + live rows).
- Tables created by `scripts/migrate-create-site-analytics.ts` (already run, 2026-09-27); also in `scripts/schema.sql`.
- **Behaviour events** (added by `scripts/migrate-site-events-v2.ts`, already run): `section_view` (IntersectionObserver on the 7 section ids in `SiteTracker`), `engagement` (active seconds — visible tab + interaction in the last 60 s — max scroll %, plus LCP/load time on the first flush; flushed on `visibilitychange→hidden` and `pagehide`), `cart_add` (`OrderModal.addItem`), `order_abandon` (modal closed or page left after reaching the form without sending: furthest step `opened|items|details|address` + cart total + item count — never name/phone), `gallery_open`, `menu_tab`, `item_photos` (menu card photo viewer closed: item id, distinct photos seen, photos it has — added by `scripts/migrate-menu-photos.ts`, already run 2026-09-29). The pageview row carries `data` = language, screen-size bucket, dark mode, connection type.
- Columns `detail` / `value` / `data` are **built server-side** in `/api/track`'s `buildFields()` from whitelisted, bounded fields per event type (section ids, form steps, slug regex for item ids…). Unknown client keys are stripped; invalid events get 400. Never store raw client JSON there.
- Shown in `/admin/audience` → "Comportement sur le site" (`BehaviourView.tsx`, `getAudienceBehaviour()`): engaged time, scroll, quick exits, section reach, form abandonment (step + cart value), dish interest (cart units added vs units in real `orders`), gallery/menu-tab usage, language/screen/dark mode, speed (median LCP & load by device), and "Photos des pizzas regardées" (viewer opens per dish, avg photos seen / total, % who saw them all). Only for the last 90 days, like other breakdowns.
- Shared admin chart components (`Stat`, `BarList`, `Columns`) live in `app/admin/(protected)/charts.tsx`, used by both `/admin/clients` stats and `/admin/audience`.

### One-time migration
`scripts/seed-menu.ts` — already run against production. Not a permanent code path (not imported by the app). Re-running is safe (every insert uses `ON CONFLICT DO NOTHING`) but pointless post-migration.

---

## Key Files

| File | Purpose |
|---|---|
| `app/(site)/layout.tsx` | Metadata, JSON-LD schemas, fonts, Analytics, `OrderProvider` |
| `app/(site)/page.tsx` | Page composition — section order |
| `app/admin/` | Admin panel — see Admin Panel section above |
| `proxy.ts` | Optimistic auth redirect for `/admin/*` (Next 16's renamed `middleware.ts`) |
| `app/globals.css` | Brand tokens, focus-visible, reduced-motion |
| `app/sitemap.ts` | Auto-generated sitemap.xml |
| `app/robots.ts` | robots.txt (disallows `/admin`) |
| `next.config.ts` | Image optimization (incl. Vercel Blob `remotePatterns`), security headers, www redirect |
| `lib/db.ts` | Neon Postgres client |
| `lib/data/menu.ts`, `lib/data/settings.ts` | DB-backed reads for menu items / contact / hours |
| `lib/data/orders.ts`, `app/api/orders/route.ts` | Customer order capture + `/admin/clients` queries |
| `lib/orders-filters.ts`, `lib/orders-export.ts` | `/admin/clients` URL filters; Excel export builder |
| `lib/auth/` | Session (JWT), password hashing |
| `lib/hours-shared.ts` | Pure open/closed computation + schedule formatting, used by both the admin UI and `/api/hours-status` |
| `lib/analytics.ts` | GA4 event tracking helpers |
| `lib/utils.ts` | `cn()`, `formatPrice()` |
| `data/menu.ts` | `MenuItem`/`MenuCategory` types + filter helpers only — **not** the actual data anymore |
| `components/Analytics.tsx` | Microsoft Clarity script |
| `components/StickyMobileCTA.tsx` | Sticky mobile bar + desktop WhatsApp button |

### Section order in `app/(site)/page.tsx`
```
Navbar → Hero → BrandStory → MenuShowcase → SignatureProducts → Reviews → Gallery → Contact → Footer → StickyMobileCTA → BackToTop
```
(`IOSInstallBanner` — the "Installez Pezzo Italiano" bar — was removed from the page on 2026-09-27; the component file is kept in `components/` if it's ever wanted back.)

---

## SEO

### Target keywords
- pizza sousse
- pizza italienne sousse
- pizza al taglio sousse
- restaurant italien sousse

### Implemented
- Full metadata (title, description, keywords, canonical, Open Graph, Twitter Card)
- Geo meta tags (`geo.region: TN-51`, coordinates: `35.8459323, 10.6016556`)
- JSON-LD: `Restaurant` + `LocalBusiness` + `WebSite` schemas
- `sitemap.xml` at `/sitemap.xml`
- `robots.txt` at `/robots.txt`

### Google Search Console
- **Done 2026-09-29:** Domain property `pezzo-italiano.com` (covers www/http/https), verified by DNS `TXT` record in Cloudflare — keep that record or verification is lost.
- Sitemap submitted as the full URL `https://pezzo-italiano.com/sitemap.xml` (a Domain property rejects a bare `sitemap.xml`) — status Success.

---

## Completed Work (chronological)

### Initial build
- Full restaurant website: Hero, BrandStory, MenuShowcase, SignatureProducts, Gallery, Contact, Footer, Navbar
- Pezzo Italiano logo + favicon
- Brand color tokens: `brand-green (#0d3b2e)`, `brand-gold (#c9a84c)`, `brand-cream (#f9f5ec)`

### Menu updates
- Organized images by pizza type into subfolders under `/public/images/`
- Updated pricing tiers: Classique 3.0 DT/100g, Premium 3.4 DT/100g, Prestige 4.4 DT/100g
- Fixed logo contrast inside gold circle (used `mix-blend-mode: multiply`)
- Simplified menu to current offerings only

### Google Reviews section
- Server component using Google Places API (New) — POST `places.googleapis.com/v1/places:searchText`
- Revalidates every 24h (ISR)
- API key must have **no HTTP referrer restriction** (server requests have no referrer)
- Fixed 403 error by removing referrer restriction in Google Cloud Console

### Conversion flow
- Moved Reviews section between Signatures and Gallery for better conversion flow

### Google Maps
- Replaced placeholder map with actual Pezzo Italiano Sousse location embed

### Coming soon section
- Added collapsible accordion for "Bientôt disponible" pizzas in MenuShowcase
- **On/off switch at the top of `/admin/menu`** (`ComingSoonToggle.tsx` → `site_settings.show_coming_soon`, read by `getShowComingSoon()`, passed to `MenuShowcase` via `OrderContext.showComingSoon`). Hidden by default (setting absent = off). Which items are "coming soon" is still the per-item "Bientôt disponible" flag.

### Analytics (full pass)
- GA4 via `@next/third-parties/google`
- Microsoft Clarity via `next/script`
- Custom `track.*` helpers on all clickable elements (CTAs, calls, WhatsApp, social, map, menu tabs)
- Tracked components: Hero, Navbar, Footer, Contact, MenuShowcase, Reviews, StickyMobileCTA

### SEO optimization
- Full metadata in `app/(site)/layout.tsx`
- Canonical URL, Open Graph, Twitter Card, geo tags
- Restaurant + WebSite JSON-LD schemas
- `sitemap.ts` and `robots.ts` created
- Security headers in `next.config.ts` (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)

### Sticky mobile CTA bar
- `components/StickyMobileCTA.tsx`
- Mobile: fixed bottom bar with WhatsApp / Call / Menu / Directions — visible after 400px scroll
- Desktop: floating WhatsApp pill (bottom-right)
- iPhone safe area: `env(safe-area-inset-bottom)`
- WhatsApp URL: `https://wa.me/21653086089?text=Bonjour%2C%20je%20souhaite%20commander%20%F0%9F%8D%95`
- Maps URL: `https://www.google.com/maps/dir/?api=1&destination=35.8459323%2C10.6016556`

### WhatsApp order flow
- `lib/order.ts` — types (`CartItem`, `OrderForm`), validation, WhatsApp message builder
- `context/OrderContext.tsx` — React context with `openOrder` / `closeOrder`
- `components/OrderProvider.tsx` — client wrapper; wraps children + renders `<OrderModal>`
- `components/OrderModal.tsx` — full order form modal (French UI, mobile-first)
- Mounted in `app/(site)/layout.tsx` via `<OrderProvider items={...} contact={...}>` wrapping `{children}`
- Triggered from: Hero "Commander maintenant" button, StickyMobileCTA mobile bar, desktop floating pill
- To change the WhatsApp number: **use `/admin/contact`**, not code — `buildWhatsAppUrl(form, whatsappNumber)` in `lib/order.ts` takes it as a parameter, sourced from `OrderContext`'s `contact.whatsappNumber` (DB-backed)
- To change message template: edit `buildWhatsAppMessage()` in `lib/order.ts`
- Pizza sizes: Quart/Demi/Plateau — uses `priceQuart` / `priceDemi` / `pricePlateau` from `data/menu.ts`
- All customer-facing text is in French inside `components/OrderModal.tsx`

### Typo fix
- "Bresola" → "Bresaola" fixed everywhere (`data/menu.ts`, `components/SignatureProducts.tsx`, all occurrences)

### Mobile performance pass (2026-09-29)
- Lighthouse mobile was 35 (LCP 9.5 s, TBT 2.25 s). LCP element was the hero text, kept at `opacity: 0` by Framer `initial` until hydration.
- All hero entrance animations are now pure CSS (`.hero-rise/.hero-fade/.hero-pop/.hero-bob` in `globals.css`) — **don't reintroduce Framer `initial={{ opacity: 0 }}` on above-the-fold hero content.**
- GA4 + Clarity deferred to `lazyOnload` (see Analytics).

### Performance fix (regression recovery)
- Performance optimization pass caused Lighthouse score to drop from 70+ to 57
- Root cause 1: AVIF image format — high CPU decode cost under 4× throttle → **removed, kept WebP only**
- Root cause 2: `dynamic()` import for Gallery with `ssr: true` — added JS chunk waterfall → **reverted to static import**
- Kept: `minimumCacheTTL: 31536000`, security headers, `focus-visible` styles, `prefers-reduced-motion` CSS

### Domain setup
- `pezzo-italiano.com` purchased on Cloudflare (2026-05-20)
- Added to Vercel via `vercel domains add`
- Cloudflare DNS configured with A + CNAME records (DNS only / grey cloud)
- SITE_URL updated in `layout.tsx`, `sitemap.ts`, `robots.ts`
- www → root 301 redirect added in `next.config.ts`

### PWA + mobile/engagement pass
- Installable PWA (`app/manifest.ts`, home-screen icons, iOS install banner)
- Live "Ouvert maintenant/Fermé" badge (real Tunis time, both Contact and Footer)
- `aggregateRating` in the JSON-LD schema from the live Google rating
- Native share button on menu cards + Footer (`components/ShareButton.tsx`)
- Post-order review nudge on a repeat customer's WhatsApp order
- Swipeable gallery lightbox, back-to-top button, "Coup de cœur"/"Choix du Dev" menu badges

### Admin panel (see dedicated section above)
- Full `/admin` panel: menu (CRUD + photo upload + reorder), contact, hours (+ exceptional-open override), Google Reviews manual refresh, staff accounts
- Neon Postgres + Vercel Blob provisioned via Vercel Marketplace; hand-rolled JWT auth per Next's own guide
- Upgraded Next.js 16.2.6 → 16.3.5 first (patches a proxy-bypass CVE the whole auth model depends on)
- Migrated `data/menu.ts`'s static array, `lib/config.ts`'s contact info, and the 3x-duplicated hours schedule into the database — see Admin Panel section for exactly where each now lives

---

## Pending / To Do

- [ ] Update Instagram/Facebook bio link to `pezzo-italiano.com`
- [ ] Turn on the "Bientôt disponible" section from `/admin/menu` when those pizzas are ready
- [ ] Run Lighthouse audit to confirm performance score recovery after AVIF removal
- [ ] Verify the admin panel end-to-end against **production** (it was verified thoroughly against the local dev server + the same shared database, but never driven through a real browser against the live domain)
- [ ] Add real staff accounts from `/admin/staff` and retire/rotate the seed script's owner password
- [ ] Consider Gallery photo management + Hero copy editing from `/admin` — listed as "optional future additions" during planning, not built

---

## Phone Numbers / Social / Address
**Editable from `/admin/contact`** — no longer hardcoded in the codebase (see Admin Panel section). Values below are what's currently set, for reference only — this file will go stale if edited from the admin panel without also updating here, so treat it as "last known," not authoritative.
- Primary: `+216 53 086 089` · Secondary: `+216 58 057 094`
- WhatsApp: `21653086089`
- Instagram: `https://www.instagram.com/pezzo.italiano/`
- Facebook: `https://www.facebook.com/1123669727485255`
- Rue Imam Moslem, Khzema Ouest, Sousse 4051, Tunisie
