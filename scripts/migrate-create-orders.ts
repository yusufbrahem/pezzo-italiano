// One-off migration: creates the `orders` table (customer orders captured
// from the site's WhatsApp order form — see app/api/orders/route.ts).
// Safe to re-run — every statement uses IF NOT EXISTS. Mirrors the `orders`
// block in scripts/schema.sql.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-create-orders.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name        TEXT NOT NULL,
      phone_raw            TEXT NOT NULL,
      phone                TEXT NOT NULL,
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
      ip_hash              TEXT,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (phone, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS orders_ip_hash_idx ON orders (ip_hash, created_at)`;
  console.log("✓ orders table ready.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
