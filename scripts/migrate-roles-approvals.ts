// One-off migration: admin roles + owner approval of menu/pricing changes.
//  - admin_users.role accepts 'administrator' (owner | administrator | staff)
//  - the database itself guarantees there is exactly one owner, and that the
//    owner account can never be deactivated (belt and braces under the app checks)
//  - pending_changes: menu/pricing edits submitted by staff/administrators,
//    applied only when the owner approves them (/admin/approvals)
// Safe to re-run.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-roles-approvals.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check`;
  await sql`ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('owner', 'administrator', 'staff'))`;
  await sql`ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_owner_active`;
  await sql`ALTER TABLE admin_users ADD CONSTRAINT admin_users_owner_active CHECK (role <> 'owner' OR is_active)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS admin_users_single_owner ON admin_users ((true)) WHERE role = 'owner'`;

  await sql`
    CREATE TABLE IF NOT EXISTS pending_changes (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kind          TEXT NOT NULL CHECK (kind IN (
                      'menu_create', 'menu_update', 'menu_delete', 'menu_publish',
                      'menu_reorder', 'coming_soon', 'pricing')),
      target        TEXT,            -- menu item id, or category for menu_reorder
      payload       JSONB NOT NULL,  -- validated server-side before storing
      summary       TEXT NOT NULL,   -- human label, e.g. "Modifier « Thon »"
      status        TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected', 'superseded', 'withdrawn')),
      submitted_by  UUID NOT NULL REFERENCES admin_users(id),
      submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      reviewed_by   UUID REFERENCES admin_users(id),
      reviewed_at   TIMESTAMPTZ,
      review_note   TEXT
    )
  `;
  // One open proposal per thing (a new submission replaces the previous one);
  // several new items can wait at the same time.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS pending_changes_one_open
    ON pending_changes (kind, COALESCE(target, '')) WHERE status = 'pending' AND kind <> 'menu_create'
  `;
  await sql`CREATE INDEX IF NOT EXISTS pending_changes_status_idx ON pending_changes (status, submitted_at DESC)`;

  const roles = await sql`SELECT role, count(*)::int AS n FROM admin_users GROUP BY role ORDER BY role`;
  console.log("✓ roles + pending_changes ready. Accounts:", roles.map((r) => `${r.role}=${r.n}`).join(", "));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
