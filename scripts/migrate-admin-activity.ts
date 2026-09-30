// One-off migration: admin activity history (who logged in/out and what they
// did in /admin), shown to the owner only at /admin/activity. Safe to re-run.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-admin-activity.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_activity (
      id          BIGSERIAL PRIMARY KEY,
      at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      user_id     UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      identifier  TEXT,           -- login typed on a failed attempt (no user_id then)
      action      TEXT NOT NULL,  -- see lib/activity-actions.ts
      target      TEXT,           -- human label: item name, page path, account name…
      details     JSONB,          -- small, server-built extras (changed fields, pending…)
      device      TEXT,
      browser     TEXT,
      os          TEXT,
      city        TEXT,
      country     TEXT,
      ip_hash     TEXT            -- salted hash, never the raw IP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS admin_activity_at_idx ON admin_activity (at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS admin_activity_user_idx ON admin_activity (user_id, at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS admin_activity_action_idx ON admin_activity (action, at DESC)`;
  console.log("✓ admin_activity ready.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
