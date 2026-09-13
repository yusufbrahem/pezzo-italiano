// One-off migration: converts site_settings.pricing_tiers from the old fixed
// shape ({ classique, premium, prestige, oro }) to the new flexible shape
// (an array of tiers, any length, each with its own style/icon/badge and
// fully optional prices). Safe to re-run — if the stored value is already an
// array, it's left untouched.
//
// Run once against the shared DB: npx tsx scripts/migrate-pricing-tiers-to-array.ts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const STYLE_BY_KEY: Record<string, string> = {
  classique: "white",
  premium: "green",
  prestige: "charcoal",
  oro: "gold",
};
const ICON_BY_KEY: Record<string, string> = {
  classique: "none",
  premium: "star",
  prestige: "gem",
  oro: "crown",
};
const BADGE_BY_KEY: Record<string, string | null> = {
  classique: null,
  premium: null,
  prestige: null,
  oro: "Sélection Oro",
};
const ORDER = ["classique", "premium", "prestige", "oro"];

async function main() {
  const rows = await sql`SELECT value FROM site_settings WHERE key = 'pricing_tiers'`;
  if (rows.length === 0) {
    console.log("No pricing_tiers row found — nothing to migrate.");
    return;
  }

  const value = rows[0].value;
  if (Array.isArray(value)) {
    console.log("pricing_tiers is already an array — already migrated, nothing to do.");
    return;
  }

  const legacy = value as Record<
    string,
    { label: string; pricePer100g: number; itemsLabel: string; tagline: string | null; priceQuart: number; priceDemi: number; pricePlateau: number | null }
  >;

  const migrated = ORDER.filter((key) => legacy[key]).map((key) => {
    const t = legacy[key];
    return {
      id: key,
      label: t.label,
      itemsLabel: t.itemsLabel,
      tagline: t.tagline,
      badge: BADGE_BY_KEY[key] ?? null,
      style: STYLE_BY_KEY[key] ?? "white",
      icon: ICON_BY_KEY[key] ?? "none",
      pricePer100g: t.pricePer100g,
      priceQuart: t.priceQuart,
      priceDemi: t.priceDemi,
      pricePlateau: t.pricePlateau,
    };
  });

  await sql`
    UPDATE site_settings SET value = ${JSON.stringify(migrated)}, updated_at = now()
    WHERE key = 'pricing_tiers'
  `;
  console.log(`✓ Migrated pricing_tiers: ${ORDER.join(", ")} → array of ${migrated.length} tiers.`);
  console.log(JSON.stringify(migrated, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
