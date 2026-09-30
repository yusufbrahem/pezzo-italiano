-- Admin panel schema — Pezzo Italiano
-- Run once via scripts/seed-menu.ts. Idempotent (safe to re-run): every
-- CREATE uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'administrator', 'staff')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_owner_active CHECK (role <> 'owner' OR is_active)  -- the owner can't be deactivated
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_single_owner ON admin_users ((true)) WHERE role = 'owner';

-- Menu / pricing changes by staff & administrators, applied only once the
-- owner approves them (/admin/approvals). See lib/data/changes.ts.
CREATE TABLE IF NOT EXISTS pending_changes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL CHECK (kind IN (
                  'menu_create', 'menu_update', 'menu_delete', 'menu_publish',
                  'menu_reorder', 'coming_soon', 'pricing')),
  target        TEXT,
  payload       JSONB NOT NULL,
  summary       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'superseded', 'withdrawn')),
  submitted_by  UUID NOT NULL REFERENCES admin_users(id),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by   UUID REFERENCES admin_users(id),
  reviewed_at   TIMESTAMPTZ,
  review_note   TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS pending_changes_one_open
  ON pending_changes (kind, COALESCE(target, '')) WHERE status = 'pending' AND kind <> 'menu_create';
CREATE INDEX IF NOT EXISTS pending_changes_status_idx ON pending_changes (status, submitted_at DESC);

-- Team activity history (owner-only, /admin/activity). See lib/data/activity.ts.
CREATE TABLE IF NOT EXISTS admin_activity (
  id          BIGSERIAL PRIMARY KEY,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  identifier  TEXT,
  action      TEXT NOT NULL,
  target      TEXT,
  details     JSONB,
  device      TEXT,
  browser     TEXT,
  os          TEXT,
  city        TEXT,
  country     TEXT,
  ip_hash     TEXT
);
CREATE INDEX IF NOT EXISTS admin_activity_at_idx ON admin_activity (at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_user_idx ON admin_activity (user_id, at DESC);
CREATE INDEX IF NOT EXISTS admin_activity_action_idx ON admin_activity (action, at DESC);

CREATE TABLE IF NOT EXISTS menu_items (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL CHECK (category IN ('pizza','desserts','boissons','supplements','partager')),
  price_text      TEXT,
  price_numeric   NUMERIC(10,2),
  price_per_100g  NUMERIC(10,2),
  price_quart     NUMERIC(10,2),
  price_demi      NUMERIC(10,2),
  price_plateau   NUMERIC(10,2),
  image           TEXT,
  image_position  TEXT,
  extra_images    TEXT[] NOT NULL DEFAULT '{}',  -- ordered extra photos; `image` is the main one
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_signature    BOOLEAN NOT NULL DEFAULT false,
  is_vegetarian   BOOLEAN NOT NULL DEFAULT false,
  is_coming_soon  BOOLEAN NOT NULL DEFAULT false,
  is_custom       BOOLEAN NOT NULL DEFAULT false,
  is_new          BOOLEAN NOT NULL DEFAULT false,
  is_bestseller   BOOLEAN NOT NULL DEFAULT false,
  is_dev_pick     BOOLEAN NOT NULL DEFAULT false,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS menu_items_category_sort_idx ON menu_items (category, sort_order);

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES admin_users(id)
);

-- Every "Commander via WhatsApp" submission from the site's order form.
-- A row means the customer *opened* WhatsApp with the order, not that they
-- actually sent it — staff tick is_confirmed once the order really happened.
-- Prices/names in `items` are recomputed server-side from menu_items, never
-- taken from the browser.
CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name        TEXT NOT NULL,
  phone_raw            TEXT NOT NULL,           -- as typed by the customer
  phone                TEXT NOT NULL,           -- normalized digits, e.g. 21653086089
  order_type           TEXT NOT NULL CHECK (order_type IN ('livraison', 'emporter')),
  items                JSONB NOT NULL,
  total                NUMERIC(10,2) NOT NULL DEFAULT 0,
  has_custom_items     BOOLEAN NOT NULL DEFAULT false,
  address              TEXT,
  zone                 TEXT,
  landmark             TEXT,
  notes                TEXT,
  is_confirmed         BOOLEAN NOT NULL DEFAULT false,
  review_requested_at  TIMESTAMPTZ,
  review_requested_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  ip_hash              TEXT,                    -- salted SHA-256, for rate limiting only — raw IPs are never stored
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (phone, created_at);
CREATE INDEX IF NOT EXISTS orders_ip_hash_idx ON orders (ip_hash, created_at);

-- Unsent order forms ("paniers non envoyés"): name + complete phone + cart
-- typed in the order form when the visitor never pressed "Commander".
-- Separate from `orders` and from the anonymous analytics below. One row per
-- form session (draft_key), updated while typing; deleted when that order is
-- actually sent, and purged after 30 days (lib/data/order-drafts.ts).
CREATE TABLE IF NOT EXISTS order_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_key         UUID UNIQUE NOT NULL,
  customer_name     TEXT NOT NULL DEFAULT '',
  phone_raw         TEXT NOT NULL,
  phone             TEXT NOT NULL,
  order_type        TEXT NOT NULL CHECK (order_type IN ('livraison', 'emporter')),
  items             JSONB NOT NULL DEFAULT '[]',
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,
  has_custom_items  BOOLEAN NOT NULL DEFAULT false,
  address           TEXT,
  zone              TEXT,
  landmark          TEXT,
  notes             TEXT,
  ip_hash           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_drafts_updated_idx ON order_drafts (updated_at DESC);
CREATE INDEX IF NOT EXISTS order_drafts_phone_idx ON order_drafts (phone, updated_at);
CREATE INDEX IF NOT EXISTS order_drafts_ip_idx ON order_drafts (ip_hash, created_at);

-- First-party, cookie-less visitor analytics (app/api/track → /admin/audience).
-- `visitor` is a hash of IP + browser + a salt that changes every day: it
-- counts unique visitors per day but can't identify or follow anyone.
-- Rows older than 90 days are folded into site_daily (totals only), then deleted.
CREATE TABLE IF NOT EXISTS site_events (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  visitor     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
                'pageview','order_start','order_submit','call','whatsapp','directions','social','share',
                'section_view','engagement','cart_add','order_abandon','gallery_open','menu_tab',
                'item_photos')),
  path        TEXT,
  detail      TEXT,           -- section id / menu item id / furthest form step / tab / photo type
  value       NUMERIC(12,2),  -- engaged seconds / cart total (DT)
  data        JSONB,          -- small server-built payload (never raw client JSON): lang, screen, dark, net, scroll, lcp, load, size, items…
  source      TEXT,     -- only on pageviews: instagram / facebook / google / direct / app / <domain>…
  device      TEXT,     -- mobile / tablet / desktop
  os          TEXT,
  browser     TEXT,
  country     TEXT,     -- ISO code, from Vercel's edge (never the IP itself)
  city        TEXT,
  standalone  BOOLEAN NOT NULL DEFAULT false  -- opened from the home-screen app
);
CREATE INDEX IF NOT EXISTS site_events_created_idx ON site_events (created_at);
CREATE INDEX IF NOT EXISTS site_events_visitor_idx ON site_events (visitor, created_at);
CREATE INDEX IF NOT EXISTS site_events_type_created_idx ON site_events (type, created_at);

CREATE TABLE IF NOT EXISTS site_daily (
  day               DATE PRIMARY KEY,   -- Tunis calendar day
  visitors          INTEGER NOT NULL DEFAULT 0,
  pageviews         INTEGER NOT NULL DEFAULT 0,
  order_starters    INTEGER NOT NULL DEFAULT 0,
  order_submitters  INTEGER NOT NULL DEFAULT 0,
  calls             INTEGER NOT NULL DEFAULT 0,
  whatsapp          INTEGER NOT NULL DEFAULT 0,
  directions        INTEGER NOT NULL DEFAULT 0,
  social            INTEGER NOT NULL DEFAULT 0,
  shares            INTEGER NOT NULL DEFAULT 0
);
