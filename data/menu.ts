export type MenuCategory = "pizza" | "desserts" | "boissons" | "supplements";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: MenuCategory;
  image?: string;
  tags?: string[];
  isSignature?: boolean;
  isVegetarian?: boolean;
}

export interface MenuCategoryInfo {
  id: MenuCategory;
  label: string;
  labelFr: string;
  icon: string;
  description: string;
}

export interface PricingTier {
  label: string;
  plateau: number;
  demiPlateau: number;
  quartPlateau: number;
}

export const menuPricing: PricingTier[] = [
  {
    label: "Menu Classique",
    plateau: 66,
    demiPlateau: 33,
    quartPlateau: 17,
  },
  {
    label: "Menu Truffe",
    plateau: 75,
    demiPlateau: 38,
    quartPlateau: 19,
  },
];

export const menuCategories: MenuCategoryInfo[] = [
  {
    id: "pizza",
    label: "Pizza al Taglio",
    labelFr: "Pizza al Taglio",
    icon: "🍕",
    description: "Notre pâte croustillante cuite chaque matin — 3 DT / 100g",
  },
  {
    id: "desserts",
    label: "Desserts",
    labelFr: "Desserts",
    icon: "🍮",
    description: "Une sélection de douceurs italiennes pour finir en beauté",
  },
  {
    id: "boissons",
    label: "Boissons",
    labelFr: "Boissons",
    icon: "🥤",
    description: "Boissons fraîches et chaudes pour accompagner votre repas",
  },
  {
    id: "supplements",
    label: "Suppléments",
    labelFr: "Suppléments",
    icon: "➕",
    description: "Personnalisez votre commande avec nos extras",
  },
];

export const menuItems: MenuItem[] = [
  // ── PIZZA AL TAGLIO ──────────────────────────────────────────────
  {
    id: "pizza-thon",
    name: "Thon",
    description: "Sauce tomate • Mozzarella • Thon • Persil • Tomate • Olive",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/thon/DSC01925.jpg",
  },
  {
    id: "pizza-pepperoni",
    name: "Pepperoni",
    description: "Sauce tomate • Mozzarella • Pepperoni • Tomates séchées • Grana Padana",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/pepperoni/DSC01891.jpg",
    tags: ["Épicé"],
    isSignature: true,
  },
  {
    id: "pizza-jambon-fume",
    name: "Jambon Fumé",
    description: "Sauce tomate • Mozzarella • Jambon fumé • Tomate • Champignons • Poivron vert",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/jombon-fume/DSC01954.jpg",
  },
  {
    id: "pizza-bresola",
    name: "Bresola",
    description: "Sauce tomate • Mozzarella • Roquette • Bresola • Tomates cerises • Grana Padana • Noix • Sauce balsamique",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/bresaola-boeuf/DSC01942.jpg",
    tags: ["Premium"],
    isSignature: true,
  },
  {
    id: "pizza-poulet-pesto",
    name: "Poulet Pesto Champignons",
    description: "Sauce blanche • Mozzarella • Poulet • Champignons • Sauce pesto",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/poulet-pesto-champ/DSC01901.jpg",
    isSignature: true,
  },
  {
    id: "pizza-poulet-epice",
    name: "Poulet Épicé",
    description: "Sauce tomate • Mozzarella • Poulet épicé • Piment",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/poulet-epice/DSC01966.jpg",
    tags: ["Épicé"],
  },
  {
    id: "pizza-quattro-formaggi",
    name: "Quattro Formaggi",
    description: "Sauce tomate • Mozzarella • Raclette • Camembert • Roquefort",
    price: "3 DT / 100g",
    category: "pizza",
    image: "/images/quatro-fromage/DSC01867.jpg",
    isVegetarian: true,
  },
  {
    id: "pizza-truffe",
    name: "Truffe",
    description: "Sauce à la truffe noire • Mozzarella • Champignons • Grana Padana",
    price: "Menu Truffe",
    category: "pizza",
    image: "/images/truffe-champ/DSC01932.jpg",
    tags: ["Premium"],
    isSignature: true,
  },

  // ── DESSERTS ─────────────────────────────────────────────────────
  {
    id: "dessert-tiramisu",
    name: "Tiramisu",
    description: "Recette traditionnelle, mascarpone, café espresso, cacao",
    price: 7,
    category: "desserts",
    isSignature: true,
  },
  {
    id: "dessert-panna-cotta",
    name: "Panna Cotta",
    description: "Panna cotta vanille, coulis de fruits rouges",
    price: 6,
    category: "desserts",
  },
  {
    id: "dessert-cannoli",
    name: "Cannoli Siciliani",
    description: "Tubes croustillants fourrés ricotta, zeste d'orange, pistache",
    price: 6,
    category: "desserts",
  },
  {
    id: "dessert-gelato",
    name: "Gelato Artisanal",
    description: "2 boules de glace artisanale — parfums du jour",
    price: 5,
    category: "desserts",
  },

  // ── BOISSONS ─────────────────────────────────────────────────────
  {
    id: "boi-eau",
    name: "Eau Minérale",
    description: "Eau minérale naturelle 50cl",
    price: 2,
    category: "boissons",
  },
  {
    id: "boi-limonade",
    name: "Limonade Maison",
    description: "Citron frais, menthe, sucre de canne, eau gazeuse",
    price: 5,
    category: "boissons",
  },
  {
    id: "boi-jus",
    name: "Jus Frais",
    description: "Orange, citron, mangue, fraise — pressé à la commande",
    price: 6,
    category: "boissons",
  },
  {
    id: "boi-coca",
    name: "Coca-Cola",
    description: "Canette 33cl",
    price: 3,
    category: "boissons",
  },
  {
    id: "boi-cafe",
    name: "Café Espresso",
    description: "Espresso simple, double, ou allongé",
    price: 3,
    category: "boissons",
  },
  {
    id: "boi-cafe-lait",
    name: "Café au Lait",
    description: "Espresso, lait vapeur onctueux",
    price: 4,
    category: "boissons",
  },

  // ── SUPPLÉMENTS ──────────────────────────────────────────────────
  {
    id: "sup-fromage",
    name: "Supplément Fromage",
    description: "Mozzarella extra ou parmesan râpé",
    price: 2,
    category: "supplements",
  },
  {
    id: "sup-charcuterie",
    name: "Supplément Charcuterie",
    description: "Jambon, salami, ou prosciutto",
    price: 3,
    category: "supplements",
  },
  {
    id: "sup-legumes",
    name: "Supplément Légumes",
    description: "Champignons, poivrons, artichauts, ou olives",
    price: 1.5,
    category: "supplements",
  },
  {
    id: "sup-roquette",
    name: "Supplément Roquette",
    description: "Roquette fraîche du jour",
    price: 1,
    category: "supplements",
  },
];

export const signatureItems = menuItems.filter((item) => item.isSignature);
