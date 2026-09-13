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
| `NEXT_PUBLIC_GSC_VERIFICATION` | Not set yet | From Google Search Console |
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
- Loaded via `@next/third-parties/google` → `<GoogleAnalytics>` in `app/(site)/layout.tsx`
- Loads `afterInteractive` — will not be detected by GA4's bot (that's expected, click "Set up later")

### Microsoft Clarity
- Component: `components/Analytics.tsx` (uses `next/script` strategy `afterInteractive`)
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
| `/admin` | Dashboard — item count, open/closed status, rating |
| `/admin/menu` | List by category, reorder (▲▼), inline delete, link to edit |
| `/admin/menu/new`, `/admin/menu/[id]/edit` | Add/edit — prices, photo, tags, flags (Signature/Nouveau/Coup de cœur/Choix du Dev/etc.) |
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
| `lib/auth/` | Session (JWT), password hashing |
| `lib/hours-shared.ts` | Pure open/closed computation + schedule formatting, used by both the admin UI and `/api/hours-status` |
| `lib/analytics.ts` | GA4 event tracking helpers |
| `lib/utils.ts` | `cn()`, `formatPrice()` |
| `data/menu.ts` | `MenuItem`/`MenuCategory` types + filter helpers only — **not** the actual data anymore |
| `components/Analytics.tsx` | Microsoft Clarity script |
| `components/StickyMobileCTA.tsx` | Sticky mobile bar + desktop WhatsApp button |

### Section order in `app/(site)/page.tsx`
```
Navbar → Hero → BrandStory → MenuShowcase → SignatureProducts → Reviews → Gallery → Contact → Footer → StickyMobileCTA → BackToTop → IOSInstallBanner
```

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

### Todo
- Submit `https://pezzo-italiano.com/sitemap.xml` to Google Search Console
- Add `NEXT_PUBLIC_GSC_VERIFICATION` once verified

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
- **Currently hidden** — `false &&` guard on both pizza tab and À Partager tab in `components/MenuShowcase.tsx`
- To re-enable: remove the `false &&` from lines ~359 and ~389 in MenuShowcase.tsx

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

- [ ] Google Search Console — add `https://pezzo-italiano.com` as URL prefix property, verify, submit sitemap
- [ ] Update Instagram/Facebook bio link to `pezzo-italiano.com`
- [ ] Re-enable coming soon section when pizzas are ready (remove `false &&` in MenuShowcase.tsx) — or move this toggle into `/admin` as a `site_settings` flag, now that the infrastructure exists
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
