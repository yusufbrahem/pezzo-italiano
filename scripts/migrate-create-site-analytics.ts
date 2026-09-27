// One-off migration: first-party, cookie-less visitor analytics
// (app/api/track/route.ts → /admin/audience). Safe to re-run — every
// statement uses IF NOT EXISTS. Mirrors the analytics block in scripts/schema.sql.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-create-site-analytics.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_events (
      id          BIGSERIAL PRIMARY KEY,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      visitor     TEXT NOT NULL,
      type        TEXT NOT NULL CHECK (type IN ('pageview','order_start','order_submit','call','whatsapp','directions','social','share')),
      path        TEXT,
      source      TEXT,
      device      TEXT,
      os          TEXT,
      browser     TEXT,
      country     TEXT,
      city        TEXT,
      standalone  BOOLEAN NOT NULL DEFAULT false
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS site_events_created_idx ON site_events (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS site_events_visitor_idx ON site_events (visitor, created_at)`;
  await sql`
    CREATE TABLE IF NOT EXISTS site_daily (
      day               DATE PRIMARY KEY,
      visitors          INTEGER NOT NULL DEFAULT 0,
      pageviews         INTEGER NOT NULL DEFAULT 0,
      order_starters    INTEGER NOT NULL DEFAULT 0,
      order_submitters  INTEGER NOT NULL DEFAULT 0,
      calls             INTEGER NOT NULL DEFAULT 0,
      whatsapp          INTEGER NOT NULL DEFAULT 0,
      directions        INTEGER NOT NULL DEFAULT 0,
      social            INTEGER NOT NULL DEFAULT 0,
      shares            INTEGER NOT NULL DEFAULT 0
    )
  `;
  console.log("✓ site_events + site_daily ready.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
