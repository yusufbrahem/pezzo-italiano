-- Admin panel schema — Pezzo Italiano
-- Run once via scripts/seed-menu.ts. Idempotent (safe to re-run): every
-- CREATE uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_signature    BOOLEAN NOT NULL DEFAULT false,
  is_vegetarian   BOOLEAN NOT NULL DEFAULT false,
  is_coming_soon  BOOLEAN NOT NULL DEFAULT false,
  is_custom       BOOLEAN NOT NULL DEFAULT false,
  is_new          BOOLEAN NOT NULL DEFAULT false,
  is_bestseller   BOOLEAN NOT NULL DEFAULT false,
  is_dev_pick     BOOLEAN NOT NULL DEFAULT false,
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
