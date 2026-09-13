// One-off migration script — NOT a permanent code path, never imported by
// the app. Run once against the production database:
//
//   vercel env pull .env.local   (if not already fresh)
//   node --env-file=.env.local --import tsx scripts/seed-menu.ts
//
// Safe to re-run: schema creation uses IF NOT EXISTS, menu items use
// ON CONFLICT (id) DO NOTHING, and admin_users/site_settings likewise won't
// duplicate rows. After a confirmed successful run in production, this file
// can be deleted or left in place as a no-op history record.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import readline from "node:readline/promises";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — run with --env-file=.env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// ── 1. Schema ────────────────────────────────────────────────────────────

async function runSchema() {
  const schemaSql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  const withoutComments = schemaSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`✓ Schema applied (${statements.length} statements)`);
}

// ── 2. Menu items — copied from data/menu.ts at the moment of migration ──
// (kept inline here rather than imported, since data/menu.ts's static
// `menuItems` array is removed once this migration lands)

type MenuCategory = "pizza" | "desserts" | "boissons" | "supplements" | "partager";

interface SeedMenuItem {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: MenuCategory;
  image?: string;
  tags?: string[];
  isSignature?: boolean;
  isVegetarian?: boolean;
  isComingSoon?: boolean;
  isCustom?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isDevPick?: boolean;
  imagePosition?: string;
  pricePer100g?: number;
  priceQuart?: number;
  priceDemi?: number;
  pricePlateau?: number;
}

const menuItems: SeedMenuItem[] = [
  {
    id: "pizza-poulet-fume", name: "Poulet Fumé",
    description: "Sauce tomate • Mozzarella • Poulet fumé • Roquette • Pistache concassée • Sauce maison • Grana Padano",
    price: "3.8 DT / 100g", pricePer100g: 3.8, priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", image: "/images/poulet-fume/poulet-fume-1.jpg", tags: ["Premium"], isNew: true,
  },
  {
    id: "pizza-thon", name: "Thon",
    description: "Sauce tomate • Mozzarella • Thon • Persil • Tomate • Olive",
    price: "3.2 DT / 100g", pricePer100g: 3.2, priceQuart: 18, priceDemi: 34, pricePlateau: 67,
    category: "pizza", image: "/images/thon/DSC01925.jpg",
  },
  {
    id: "pizza-pepperoni", name: "Pepperoni",
    description: "Sauce tomate • Mozzarella • Pepperoni • Tomates séchées • Grana Padana",
    price: "3.2 DT / 100g", pricePer100g: 3.2, priceQuart: 18, priceDemi: 34, pricePlateau: 67,
    category: "pizza", image: "/images/pepperoni/DSC01891.jpg", tags: ["Épicé"], isSignature: true,
  },
  {
    id: "pizza-jambon-fume", name: "Jambon Fumé",
    description: "Sauce tomate • Mozzarella • Jambon fumé • Tomate • Champignons • Poivron vert",
    price: "3.2 DT / 100g", pricePer100g: 3.2, priceQuart: 18, priceDemi: 34, pricePlateau: 67,
    category: "pizza", image: "/images/jombon-fume/DSC01954.jpg",
  },
  {
    id: "pizza-anchois", name: "Anchois",
    description: "Sauce tomate • Anchois • Oignon • Poivron vert • Tomate • Persil • Olive noire",
    price: "3.8 DT / 100g", pricePer100g: 3.8, priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", tags: ["Premium"], isComingSoon: true,
  },
  {
    id: "pizza-bresola", name: "Bresaola",
    description: "Sauce tomate • Mozzarella • Roquette • Bresaola • Tomates cerises • Grana Padana • Noix • Sauce balsamique",
    price: "dès 20 DT", priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", image: "/images/bresaola-boeuf/DSC01942.jpg", tags: ["Premium"], isSignature: true, isBestseller: true,
  },
  {
    id: "pizza-truffe", name: "Truffe",
    description: "Sauce à la truffe noire • Mozzarella • Champignons • Grana Padana",
    price: "dès 20 DT", priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", image: "/images/truffe-champ/DSC01932.jpg", tags: ["Premium"], isSignature: true,
  },
  {
    id: "pizza-poulet-epice", name: "Poulet Épicé",
    description: "Sauce tomate • Mozzarella • Poulet épicé • Piment",
    price: "3.5 DT / 100g", pricePer100g: 3.5, priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", image: "/images/poulet-epice/DSC01966.jpg", tags: ["Épicé"], isDevPick: true, isBestseller: true,
  },
  {
    id: "pizza-poulet-pesto", name: "Poulet Pesto Champignons",
    description: "Sauce blanche • Mozzarella • Poulet • Champignons • Sauce pesto",
    price: "3.5 DT / 100g", pricePer100g: 3.5, priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", image: "/images/poulet-pesto-champ/DSC01901.jpg", isSignature: true, isBestseller: true,
  },
  {
    id: "pizza-quattro-formaggi", name: "Quattro Formaggi",
    description: "Sauce tomate • Mozzarella • Raclette • Camembert • Roquefort",
    price: "3.5 DT / 100g", pricePer100g: 3.5, priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    category: "pizza", image: "/images/quatro-fromage/DSC01867.jpg", isVegetarian: true,
  },
  {
    id: "pizza-saumon", name: "Saumon",
    description: "Sauce blanche • Mozzarella • Saumon frais • Câpres • Aneth • Crème citronnée",
    price: "dès 25 DT", priceQuart: 25, priceDemi: 48,
    category: "pizza", image: "/images/salmon/DSC01918.jpg", tags: ["Premium"], isSignature: true,
  },
  {
    id: "pizza-margherita", name: "Margherita",
    description: "Sauce tomate • Mozzarella • Basilic séché",
    price: "3.2 DT / 100g", pricePer100g: 3.2, priceQuart: 18, priceDemi: 34, pricePlateau: 67,
    category: "pizza", isComingSoon: true,
  },
  {
    id: "pizza-plateau-varie", name: "Plateau Varié",
    description: "Composez votre plateau sur mesure — mélange de types de pizzas au choix. Poids et prix confirmés par message selon votre composition.",
    price: "Sur demande",
    category: "pizza", image: "/images/plateau-varie/plateau-varie.jpg", imagePosition: "center 65%", isCustom: true,
  },
  {
    id: "pizza-sucree", name: "Pizza Sucrée",
    description: "Une création originale — base sucrée, garnitures gourmandes, parfaite en dessert",
    price: "3.3 DT / 100g", pricePer100g: 3.3, priceQuart: 18, priceDemi: 35, pricePlateau: 68,
    category: "pizza", isComingSoon: true,
  },
  {
    id: "pizza-vegetarienne", name: "Végétarienne",
    description: "Sauce tomate • Mozzarella • Légumes grillés de saison • Herbes fraîches",
    price: "3.0 DT / 100g", pricePer100g: 3.0, priceQuart: 17, priceDemi: 33, pricePlateau: 66,
    category: "pizza", isVegetarian: true, isComingSoon: true,
  },
  {
    id: "pizza-mexican", name: "Mexican",
    description: "Sauce tomate épicée • Mozzarella • Bœuf haché • Jalapeños • Poivrons • Crème mexicaine",
    price: "3.8 DT / 100g", pricePer100g: 3.8, priceQuart: 23, priceDemi: 40, pricePlateau: 78,
    category: "pizza", tags: ["Épicé"], isComingSoon: true,
  },
  {
    id: "pizza-royal-thon", name: "Pizza Royal Thon",
    description: "Notre version royale — thon premium, garnitures généreuses, pâte spéciale",
    price: "3.3 DT / 100g", pricePer100g: 3.3,
    category: "pizza", isComingSoon: true,
  },
  {
    id: "pizza-royal-jambon", name: "Pizza Royal Jambon",
    description: "Notre version royale — jambon de qualité supérieure, garnitures généreuses",
    price: "3.3 DT / 100g", pricePer100g: 3.3,
    category: "pizza", isComingSoon: true,
  },
  {
    id: "pizza-royal-epinards", name: "Pizza Royal Épinards",
    description: "Notre version royale — épinards frais, ricotta, ail doré",
    price: "3.3 DT / 100g", pricePer100g: 3.3,
    category: "pizza", isVegetarian: true, isComingSoon: true,
  },
  {
    id: "pizza-crevette", name: "Crevette",
    description: "Sauce blanche • Mozzarella • Crevettes sautées à l'ail • Herbes de mer",
    price: "3.8 DT / 100g", pricePer100g: 3.8, priceQuart: 23, priceDemi: 40, pricePlateau: 78,
    category: "pizza", tags: ["Premium"], isComingSoon: true,
  },
  {
    id: "pizza-burrata", name: "Burrata",
    description: "Sauce tomate • Burrata crémeuse • Tomates cerises rôties • Basilic frais • Huile d'olive",
    price: "3.8 DT / 100g", pricePer100g: 3.8, priceQuart: 23, priceDemi: 40, pricePlateau: 80,
    category: "pizza", tags: ["Premium"], isVegetarian: true, isComingSoon: true,
  },
  {
    id: "pizza-pezzo-italiano", name: "Pizza Pezzo Italiano",
    description: "Notre création maison — la signature ultime de la maison, ingrédients secrets",
    price: "3.3 DT / 100g", pricePer100g: 3.3, priceQuart: 20, priceDemi: 40, pricePlateau: 78,
    category: "pizza", tags: ["Maison"], isSignature: true, isComingSoon: true,
  },
  {
    id: "dessert-tiramisu", name: "Tiramisu",
    description: "Recette traditionnelle, mascarpone, café espresso, cacao",
    price: 10, category: "desserts", isSignature: true,
  },
  { id: "boi-boga-cidre", name: "Boga Cidre", description: "Canette 33cl", price: 3, category: "boissons" },
  { id: "boi-boga-lime", name: "Boga Lime", description: "Canette 33cl", price: 3, category: "boissons" },
  { id: "boi-sprite", name: "Sprite", description: "Canette 33cl", price: 3, category: "boissons" },
  { id: "boi-apple", name: "Apple", description: "Canette 33cl", price: 3, category: "boissons" },
  { id: "boi-schweppes-ananas-coco", name: "Schweppes Ananas Coco", description: "Canette 33cl", price: 3, category: "boissons" },
  { id: "boi-schweppes-grenadine", name: "Schweppes Grenadine", description: "Canette 33cl", price: 3, category: "boissons" },
  { id: "boi-eau", name: "Eau Minérale 0.5L", description: "Eau minérale naturelle 50cl", price: 1.5, category: "boissons" },
  { id: "sup-thon", name: "Supplément Thon", description: "Thon supplémentaire", price: 3, category: "supplements" },
  { id: "sup-champignons", name: "Supplément Champignons", description: "Champignons frais", price: 2.5, category: "supplements" },
  { id: "sup-roquette", name: "Supplément Roquette", description: "Roquette fraîche du jour", price: 1.5, category: "supplements" },
  { id: "sup-raclette", name: "Supplément Raclette", description: "Raclette fondante", price: 3, category: "supplements" },
  { id: "sup-roquefort", name: "Supplément Roquefort", description: "Roquefort affiné", price: 2, category: "supplements" },
  { id: "sup-pepperoni", name: "Supplément Pepperoni", description: "Pepperoni épicé", price: 3, category: "supplements" },
  {
    id: "partager-plateau-mixte", name: "Plateau Mixte",
    description: "Sélection de 4 pizzas au choix — idéal pour 3 à 4 personnes",
    price: "Sur demande", category: "partager", isComingSoon: true,
  },
  {
    id: "partager-plateau-signature", name: "Plateau Signatures",
    description: "Nos 3 pizzas signatures en version plateau — Bresaola, Poulet Pesto, Saumon",
    price: "Sur demande", category: "partager", isComingSoon: true,
  },
  {
    id: "partager-plateau-decouverte", name: "Plateau Découverte",
    description: "Le meilleur de notre carte pour partager — parfait pour les groupes",
    price: "Sur demande", category: "partager", isComingSoon: true,
  },
];

async function seedMenuItems() {
  // sort_order = position within its own category, preserving today's order
  const perCategoryIndex: Record<string, number> = {};
  let inserted = 0;

  for (const item of menuItems) {
    const idx = perCategoryIndex[item.category] ?? 0;
    perCategoryIndex[item.category] = idx + 1;

    const priceText = typeof item.price === "string" ? item.price : null;
    const priceNumeric = typeof item.price === "number" ? item.price : null;

    const result = await sql`
      INSERT INTO menu_items (
        id, name, description, category, price_text, price_numeric,
        price_per_100g, price_quart, price_demi, price_plateau,
        image, image_position, tags,
        is_signature, is_vegetarian, is_coming_soon, is_custom,
        is_new, is_bestseller, is_dev_pick, sort_order
      ) VALUES (
        ${item.id}, ${item.name}, ${item.description}, ${item.category},
        ${priceText}, ${priceNumeric},
        ${item.pricePer100g ?? null}, ${item.priceQuart ?? null}, ${item.priceDemi ?? null}, ${item.pricePlateau ?? null},
        ${item.image ?? null}, ${item.imagePosition ?? null}, ${item.tags ?? []},
        ${item.isSignature ?? false}, ${item.isVegetarian ?? false}, ${item.isComingSoon ?? false}, ${item.isCustom ?? false},
        ${item.isNew ?? false}, ${item.isBestseller ?? false}, ${item.isDevPick ?? false}, ${idx}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) inserted++;
  }
  console.log(`✓ Menu items: ${inserted} inserted, ${menuItems.length - inserted} already existed`);
}

// ── 3. Site settings ─────────────────────────────────────────────────────

async function seedSiteSettings() {
  const contact = {
    address: {
      street: "Rue Imam Moslem",
      area: "Khzema Ouest",
      city: "Sousse",
      postalCode: "4051",
      country: "TN",
      lat: 35.8459323,
      lng: 10.6016556,
      mapsUrl: "https://www.google.com/maps/place/Pezzo+Italiano+Sousse/@35.8459323,10.6016556,17z",
      mapsEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d750!2d10.6016556!3d35.8459323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd8b8a05b14021%3A0xd0722a5defefb417!2sPezzo%20Italiano%20Sousse!5e0!3m2!1sfr!2stn!4v1748800000000!5m2!1sfr!2stn",
    },
    phone: {
      primary: "+21653086089",
      secondary: "+21658057094",
      primaryFormatted: "53 086 089",
      secondaryFormatted: "58 057 094",
    },
    whatsappNumber: "21653086089",
    social: {
      instagram: "https://www.instagram.com/pezzo.italiano/",
      facebook: "https://www.facebook.com/1123669727485255",
    },
  };

  const hoursSchedule = {
    Mon: { opens: "11:00", closes: "23:00", closed: false },
    Tue: { opens: "11:00", closes: "23:00", closed: false },
    Wed: { opens: "11:00", closes: "23:00", closed: false },
    Thu: { opens: "11:00", closes: "23:00", closed: false },
    Fri: { opens: "11:00", closes: "23:00", closed: false },
    Sat: { opens: "10:30", closes: "23:30", closed: false },
    Sun: { opens: "11:00", closes: "22:30", closed: false },
  };

  const hoursOverride = { active: false, mode: "open", reason: null, expiresAt: null };

  // The 4 pricing-tier legend cards shown above the pizza grid
  // (components/MenuShowcase.tsx's PizzaPricingTable) — editable from
  // /admin/pricing.
  const pricingTiers = {
    classique: {
      label: "Classique", pricePer100g: 3.2, itemsLabel: "Thon · Pepperoni · Jambon",
      tagline: null, priceQuart: 18, priceDemi: 34, pricePlateau: 67,
    },
    premium: {
      label: "Premium", pricePer100g: 3.5, itemsLabel: "Poulet Pesto · Poulet Épicé · 4 Fromages",
      tagline: "Nos incontournables, les plus commandés", priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    },
    prestige: {
      label: "Prestige", pricePer100g: 3.8, itemsLabel: "Bresaola · Truffe · Poulet Fumé · Anchois",
      tagline: "Ingrédients rares, saveurs d'exception", priceQuart: 20, priceDemi: 39, pricePlateau: 76,
    },
    oro: {
      label: "Saumon", pricePer100g: 4.5, itemsLabel: "Saumon frais · Crème citronnée",
      tagline: null, priceQuart: 25, priceDemi: 48, pricePlateau: null,
    },
  };

  for (const [key, value] of Object.entries({
    contact,
    hours_schedule: hoursSchedule,
    hours_override: hoursOverride,
    pricing_tiers: pricingTiers,
  })) {
    await sql`
      INSERT INTO site_settings (key, value) VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO NOTHING
    `;
  }
  console.log("✓ Site settings seeded (contact, hours_schedule, hours_override, pricing_tiers)");
}

// ── 4. First owner account ───────────────────────────────────────────────

async function seedOwner() {
  const existing = await sql`SELECT id FROM admin_users WHERE role = 'owner' LIMIT 1`;
  if (existing.length > 0) {
    console.log("✓ Owner account already exists — skipping");
    return;
  }

  // Non-interactive path (OWNER_EMAIL/OWNER_NAME/OWNER_PASSWORD env vars) —
  // falls back to interactive prompts when not set.
  let email = process.env.OWNER_EMAIL?.trim();
  let name = process.env.OWNER_NAME?.trim();
  let password = process.env.OWNER_PASSWORD?.trim();

  if (!email || !name || !password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    email = email ?? (await rl.question("Owner login (username or email): ")).trim();
    name = name ?? (await rl.question("Owner name: ")).trim();
    password = password ?? (await rl.question("Owner password (min 8 chars): ")).trim();
    rl.close();
  }

  if (!email || !name || password.length < 8) {
    console.error("Invalid input — login/name required, password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await sql`
    INSERT INTO admin_users (email, password_hash, name, role)
    VALUES (${email}, ${passwordHash}, ${name}, 'owner')
  `;
  console.log(`✓ Owner account created: ${email}`);
}

// ── Run ────────────────────────────────────────────────────────────────

async function main() {
  await runSchema();
  await seedMenuItems();
  await seedSiteSettings();
  await seedOwner();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
