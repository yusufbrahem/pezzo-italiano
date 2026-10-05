// One-off clean-up: delete the owner's recorded admin page views. The owner's
// navigation is no longer tracked (see trackAdminPage); this removes what was
// stored before that. Only `page_view` rows of the owner — every other history
// line (logins, menu edits…) is kept. Safe to re-run.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/purge-owner-page-views.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const rows = await sql`
    DELETE FROM admin_activity
    WHERE action = 'page_view'
      AND user_id IN (SELECT id FROM admin_users WHERE role = 'owner')
    RETURNING id
  `;
  console.log(`Deleted ${rows.length} owner page view(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
