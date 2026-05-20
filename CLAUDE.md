@AGENTS.md

# Pezzo Italiano — Website Project Log

## Project Overview

Restaurant website for **Pezzo Italiano** — an authentic pizza al taglio restaurant in Sousse, Tunisia (Khzema Ouest).

- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Hosting**: Vercel
- **Domain**: `pezzo-italiano.com` (registered on Cloudflare)
- **Production URL**: `https://pezzo-italiano.com`
- **Fallback URL**: `https://pezzo-italiano.vercel.app` (always active)

---

## Environment Variables

| Variable | Where set | Value / Notes |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Vercel + `.env.local` | Server-side only. Key restriction must be **None** (not HTTP referrer) — server requests have no referrer |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Vercel | `G-6H3FMDDRXQ` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Not set yet | Set up at clarity.microsoft.com first |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Not set yet | From Google Search Console |

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
- `app/layout.tsx` — canonical, Open Graph, JSON-LD schema
- `app/sitemap.ts`
- `app/robots.ts`

---

## Analytics

### Google Analytics 4
- Measurement ID: `G-6H3FMDDRXQ`
- Loaded via `@next/third-parties/google` → `<GoogleAnalytics>` in `app/layout.tsx`
- Loads `afterInteractive` — will not be detected by GA4's bot (that's expected, click "Set up later")

### Microsoft Clarity
- Component: `components/Analytics.tsx` (uses `next/script` strategy `afterInteractive`)
- Reads `NEXT_PUBLIC_CLARITY_PROJECT_ID` env var — returns null if not set
- **Not yet configured** — user needs to create project at clarity.microsoft.com

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

## Key Files

| File | Purpose |
|---|---|
| `app/layout.tsx` | Metadata, JSON-LD schemas, fonts, Analytics |
| `app/page.tsx` | Page composition — section order |
| `app/globals.css` | Brand tokens, focus-visible, reduced-motion |
| `app/sitemap.ts` | Auto-generated sitemap.xml |
| `app/robots.ts` | robots.txt |
| `next.config.ts` | Image optimization, security headers, www redirect |
| `lib/analytics.ts` | GA4 event tracking helpers |
| `lib/utils.ts` | `cn()`, `formatPrice()` |
| `data/menu.ts` | All menu items, categories, pricing |
| `components/Analytics.tsx` | Microsoft Clarity script |
| `components/StickyMobileCTA.tsx` | Sticky mobile bar + desktop WhatsApp button |

### Section order in `app/page.tsx`
```
Navbar → Hero → BrandStory → MenuShowcase → SignatureProducts → Reviews → Gallery → Contact → Footer → StickyMobileCTA
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
- Full metadata in `app/layout.tsx`
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
- Mounted in `app/layout.tsx` via `<OrderProvider>` wrapping `{children}`
- Triggered from: Hero "Commander maintenant" button, StickyMobileCTA mobile bar, desktop floating pill
- To change WhatsApp number: edit `WHATSAPP_NUMBER` in `lib/order.ts`
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

---

## Pending / To Do

- [ ] Set up Microsoft Clarity — create project at clarity.microsoft.com, add `NEXT_PUBLIC_CLARITY_PROJECT_ID` to Vercel env vars
- [ ] Google Search Console — add `https://pezzo-italiano.com` as URL prefix property, verify, submit sitemap
- [ ] Update Instagram/Facebook bio link to `pezzo-italiano.com`
- [ ] Re-enable coming soon section when pizzas are ready (remove `false &&` in MenuShowcase.tsx)
- [ ] Run Lighthouse audit to confirm performance score recovery after AVIF removal

---

## Phone Numbers
- Primary: `+216 53 086 089`
- Secondary: `+216 58 057 094`

## Social
- Instagram: `https://www.instagram.com/pezzo.italiano/`
- Facebook: `https://www.facebook.com/1123669727485255`
