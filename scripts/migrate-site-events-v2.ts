// One-off migration: richer anonymous behaviour events for /admin/audience
// (section reach, engaged time, dish interest, order-form abandonment,
// gallery/menu-tab usage, browser setup & load speed). Safe to re-run.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-site-events-v2.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS detail TEXT`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS value NUMERIC(12,2)`;
  await sql`ALTER TABLE site_events ADD COLUMN IF NOT EXISTS data JSONB`;
  await sql`ALTER TABLE site_events DROP CONSTRAINT IF EXISTS site_events_type_check`;
  await sql`
    ALTER TABLE site_events ADD CONSTRAINT site_events_type_check CHECK (type IN (
      'pageview','order_start','order_submit','call','whatsapp','directions','social','share',
      'section_view','engagement','cart_add','order_abandon','gallery_open','menu_tab'
    ))
  `;
  await sql`CREATE INDEX IF NOT EXISTS site_events_type_created_idx ON site_events (type, created_at)`;
  console.log("✓ site_events upgraded (detail / value / data + new event types).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
