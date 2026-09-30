// One-off migration: content versions — a before/after snapshot of every
// change that reaches the public site (menu items, menu order, "Bientôt
// disponible", pricing, hours, exceptional open/close, contact), so the owner
// can see exactly what changed and restore the previous state
// (/admin/activity/v/[id]). Safe to re-run.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-content-versions.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS content_versions (
      id             BIGSERIAL PRIMARY KEY,
      at             TIMESTAMPTZ NOT NULL DEFAULT now(),
      entity         TEXT NOT NULL CHECK (entity IN (
                       'menu_item', 'menu_order', 'coming_soon', 'pricing',
                       'hours_schedule', 'hours_override', 'contact')),
      entity_id      TEXT,            -- menu item id, or category for menu_order
      label          TEXT NOT NULL,   -- human label, e.g. "Thon"
      operation      TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      before         JSONB,           -- null for a create
      after          JSONB,           -- null for a delete
      author_id      UUID REFERENCES admin_users(id) ON DELETE SET NULL, -- who made / proposed it
      approved_by    UUID REFERENCES admin_users(id) ON DELETE SET NULL, -- owner, when it came from a proposal
      change_id      UUID,            -- pending_changes row it came from, if any
      restored_from  BIGINT REFERENCES content_versions(id) ON DELETE SET NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS content_versions_entity_idx ON content_versions (entity, entity_id, at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS content_versions_at_idx ON content_versions (at DESC)`;
  console.log("✓ content_versions ready.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
