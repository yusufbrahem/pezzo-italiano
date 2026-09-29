// One-off migration: several photos per menu item + photo-viewer tracking.
//  - menu_items.extra_images: ordered extra photos (menu_items.image stays the
//    main/card photo), managed from /admin/menu.
//  - Backfill: items whose main photo is a local /images/<folder>/ file get
//    the gallery photos from that same folder (what the site showed before).
//  - site_events: allow the new 'item_photos' event type.
// Safe to re-run (only fills items that have no extra photos yet).
//
// Run once against the shared DB: npx tsx --env-file=.env.local scripts/migrate-menu-photos.ts
import { neon } from "@neondatabase/serverless";
import { galleryImages } from "../data/gallery";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS extra_images TEXT[] NOT NULL DEFAULT '{}'`;

  const items = await sql`SELECT id, image FROM menu_items WHERE cardinality(extra_images) = 0 AND image LIKE '/images/%'`;
  for (const { id, image } of items as { id: string; image: string }[]) {
    const folder = image.slice(0, image.lastIndexOf("/") + 1);
    const extras = galleryImages.map((g) => g.src).filter((src) => src.startsWith(folder) && src !== image);
    if (extras.length === 0) continue;
    await sql`UPDATE menu_items SET extra_images = ${extras} WHERE id = ${id}`;
    console.log(`  ${id}: +${extras.length} photos`);
  }

  await sql`ALTER TABLE site_events DROP CONSTRAINT IF EXISTS site_events_type_check`;
  await sql`
    ALTER TABLE site_events ADD CONSTRAINT site_events_type_check CHECK (type IN (
      'pageview','order_start','order_submit','call','whatsapp','directions','social','share',
      'section_view','engagement','cart_add','order_abandon','gallery_open','menu_tab','item_photos'
    ))
  `;
  console.log("✓ menu_items.extra_images added/backfilled, site_events accepts 'item_photos'.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
