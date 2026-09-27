// One-off migration: unsent order forms ("paniers non envoyés") — see
// app/api/order-draft/route.ts and /admin/clients?view=drafts. Safe to re-run.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-create-order-drafts.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
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
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS order_drafts_updated_idx ON order_drafts (updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS order_drafts_phone_idx ON order_drafts (phone, updated_at)`;
  await sql`CREATE INDEX IF NOT EXISTS order_drafts_ip_idx ON order_drafts (ip_hash, created_at)`;
  console.log("✓ order_drafts ready.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
