// One-off migration: adds the TikTok link to site_settings.contact.social
// (the field was added after the initial seed). Safe to re-run — an existing
// tiktok value is left untouched. Afterwards it's editable from /admin/contact.
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-add-tiktok.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const TIKTOK_URL = "https://www.tiktok.com/@pezzo.italiano";

async function main() {
  const rows = await sql`
    UPDATE site_settings
    SET value = jsonb_set(value, '{social,tiktok}', to_jsonb(${TIKTOK_URL}::text)), updated_at = now()
    WHERE key = 'contact' AND value->'social'->>'tiktok' IS NULL
    RETURNING value->'social' AS social
  `;
  if (rows.length === 0) {
    console.log("contact.social.tiktok already set (or no contact row) — nothing to do.");
    return;
  }
  console.log("✓ Added TikTok link:", JSON.stringify(rows[0].social));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
