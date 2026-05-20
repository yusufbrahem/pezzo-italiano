export type MenuCategory = "pizza" | "desserts" | "boissons" | "supplements" | "partager";

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
  isComingSoon?: boolean;
  pricePer100g?: number;
  priceQuart?: number;
  priceDemi?: number;
  pricePlateau?: number;
}

export interface MenuCategoryInfo {
  id: MenuCategory;
  label: string;
  labelFr: string;
  icon: string;
  description: string;
}

export const menuCategories: MenuCategoryInfo[] = [
  {
    id: "pizza",
    label: "Pizza al Taglio",
    labelFr: "Pizza al Taglio",
    icon: "🍕",
    description: "Notre pâte croustillante cuite chaque matin",
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
    description: "Boissons fraîches pour accompagner votre repas",
  },
  {
    id: "supplements",
    label: "Suppléments",
    labelFr: "Suppléments",
    icon: "➕",
    description: "Personnalisez votre commande avec nos extras",
  },
  {
    id: "partager",
    label: "À Partager",
    labelFr: "À Partager",
    icon: "🫱",
    description: "Nos pièces à partager entre amis et en famille",
  },
];

export const menuItems: MenuItem[] = [
  // ── PIZZA AL TAGLIO — disponibles ────────────────────────────────
  {
    id: "pizza-thon",
    name: "Thon",
    description: "Sauce tomate • Mozzarella • Thon • Persil • Tomate • Olive",
    price: "3.0 DT / 100g",
    pricePer100g: 3.0,
    priceQuart: 17,
    priceDemi: 33,
    pricePlateau: 66,
    category: "pizza",
    image: "/images/thon/DSC01925.jpg",
  },
  {
    id: "pizza-pepperoni",
    name: "Pepperoni",
    description: "Sauce tomate • Mozzarella • Pepperoni • Tomates séchées • Grana Padana",
    price: "3.0 DT / 100g",
    pricePer100g: 3.0,
    priceQuart: 17,
    priceDemi: 33,
    pricePlateau: 66,
    category: "pizza",
    image: "/images/pepperoni/DSC01891.jpg",
    tags: ["Épicé"],
    isSignature: true,
  },
  {
    id: "pizza-jambon-fume",
    name: "Jambon Fumé",
    description: "Sauce tomate • Mozzarella • Jambon fumé • Tomate • Champignons • Poivron vert",
    price: "3.0 DT / 100g",
    pricePer100g: 3.0,
    priceQuart: 17,
    priceDemi: 33,
    pricePlateau: 66,
    category: "pizza",
    image: "/images/jombon-fume/DSC01954.jpg",
  },
  {
    id: "pizza-bresola",
    name: "Bresaola",
    description: "Sauce tomate • Mozzarella • Roquette • Bresaola • Tomates cerises • Grana Padana • Noix • Sauce balsamique",
    price: "3.4 DT / 100g",
    pricePer100g: 3.4,
    priceQuart: 19,
    priceDemi: 38,
    pricePlateau: 72,
    category: "pizza",
    image: "/images/bresaola-boeuf/DSC01942.jpg",
    tags: ["Premium"],
    isSignature: true,
  },
  {
    id: "pizza-truffe",
    name: "Truffe",
    description: "Sauce à la truffe noire • Mozzarella • Champignons • Grana Padana",
    price: "3.4 DT / 100g",
    pricePer100g: 3.4,
    priceQuart: 19,
    priceDemi: 38,
    pricePlateau: 72,
    category: "pizza",
    image: "/images/truffe-champ/DSC01932.jpg",
    tags: ["Premium"],
    isSignature: true,
  },
  {
    id: "pizza-poulet-epice",
    name: "Poulet Épicé",
    description: "Sauce tomate • Mozzarella • Poulet épicé • Piment",
    price: "3.4 DT / 100g",
    pricePer100g: 3.4,
    priceQuart: 19,
    priceDemi: 38,
    pricePlateau: 72,
    category: "pizza",
    image: "/images/poulet-epice/DSC01966.jpg",
    tags: ["Épicé"],
  },
  {
    id: "pizza-poulet-pesto",
    name: "Poulet Pesto Champignons",
    description: "Sauce blanche • Mozzarella • Poulet • Champignons • Sauce pesto",
    price: "3.4 DT / 100g",
    pricePer100g: 3.4,
    priceQuart: 19,
    priceDemi: 38,
    pricePlateau: 72,
    category: "pizza",
    image: "/images/poulet-pesto-champ/DSC01901.jpg",
    isSignature: true,
  },
  {
    id: "pizza-quattro-formaggi",
    name: "Quattro Formaggi",
    description: "Sauce tomate • Mozzarella • Raclette • Camembert • Roquefort",
    price: "3.4 DT / 100g",
    pricePer100g: 3.4,
    priceQuart: 19,
    priceDemi: 38,
    pricePlateau: 72,
    category: "pizza",
    image: "/images/quatro-fromage/DSC01867.jpg",
    isVegetarian: true,
  },
  {
    id: "pizza-saumon",
    name: "Saumon",
    description: "Sauce blanche • Mozzarella • Saumon frais • Câpres • Aneth • Crème citronnée",
    price: "4.4 DT / 100g",
    pricePer100g: 4.4,
    priceQuart: 24,
    priceDemi: 48,
    pricePlateau: 91,
    category: "pizza",
    image: "/images/salmon/DSC01918.jpg",
    tags: ["Premium"],
    isSignature: true,
  },

  // ── PIZZA — bientôt disponibles ───────────────────────────────────
  {
    id: "pizza-sucree",
    name: "Pizza Sucrée",
    description: "Une création originale — base sucrée, garnitures gourmandes, parfaite en dessert",
    price: "3.3 DT / 100g",
    pricePer100g: 3.3,
    priceQuart: 18,
    priceDemi: 35,
    pricePlateau: 68,
    category: "pizza",
    isComingSoon: true,
  },
  {
    id: "pizza-vegetarienne",
    name: "Végétarienne",
    description: "Sauce tomate • Mozzarella • Légumes grillés de saison • Herbes fraîches",
    price: "3.0 DT / 100g",
    pricePer100g: 3.0,
    priceQuart: 17,
    priceDemi: 33,
    pricePlateau: 66,
    category: "pizza",
    isVegetarian: true,
    isComingSoon: true,
  },
  {
    id: "pizza-poulet-fume",
    name: "Poulet Fumé",
    description: "Sauce blanche • Mozzarella • Poulet fumé tendre • Oignons caramélisés",
    price: "3.5 DT / 100g",
    pricePer100g: 3.5,
    priceQuart: 19,
    priceDemi: 38,
    pricePlateau: 72,
    category: "pizza",
    isComingSoon: true,
  },
  {
    id: "pizza-mexican",
    name: "Mexican",
    description: "Sauce tomate épicée • Mozzarella • Bœuf haché • Jalapeños • Poivrons • Crème mexicaine",
    price: "3.8 DT / 100g",
    pricePer100g: 3.8,
    priceQuart: 23,
    priceDemi: 40,
    pricePlateau: 78,
    category: "pizza",
    tags: ["Épicé"],
    isComingSoon: true,
  },
  {
    id: "pizza-royal-thon",
    name: "Pizza Royal Thon",
    description: "Notre version royale — thon premium, garnitures généreuses, pâte spéciale",
    price: "3.3 DT / 100g",
    pricePer100g: 3.3,
    category: "pizza",
    isComingSoon: true,
  },
  {
    id: "pizza-royal-jambon",
    name: "Pizza Royal Jambon",
    description: "Notre version royale — jambon de qualité supérieure, garnitures généreuses",
    price: "3.3 DT / 100g",
    pricePer100g: 3.3,
    category: "pizza",
    isComingSoon: true,
  },
  {
    id: "pizza-royal-epinards",
    name: "Pizza Royal Épinards",
    description: "Notre version royale — épinards frais, ricotta, ail doré",
    price: "3.3 DT / 100g",
    pricePer100g: 3.3,
    category: "pizza",
    isVegetarian: true,
    isComingSoon: true,
  },
  {
    id: "pizza-crevette",
    name: "Crevette",
    description: "Sauce blanche • Mozzarella • Crevettes sautées à l'ail • Herbes de mer",
    price: "3.8 DT / 100g",
    pricePer100g: 3.8,
    priceQuart: 23,
    priceDemi: 40,
    pricePlateau: 78,
    category: "pizza",
    tags: ["Premium"],
    isComingSoon: true,
  },
  {
    id: "pizza-burrata",
    name: "Burrata",
    description: "Sauce tomate • Burrata crémeuse • Tomates cerises rôties • Basilic frais • Huile d'olive",
    price: "3.8 DT / 100g",
    pricePer100g: 3.8,
    priceQuart: 23,
    priceDemi: 40,
    pricePlateau: 80,
    category: "pizza",
    tags: ["Premium"],
    isVegetarian: true,
    isComingSoon: true,
  },
  {
    id: "pizza-pezzo-italiano",
    name: "Pizza Pezzo Italiano",
    description: "Notre création maison — la signature ultime de la maison, ingrédients secrets",
    price: "3.3 DT / 100g",
    pricePer100g: 3.3,
    priceQuart: 20,
    priceDemi: 40,
    pricePlateau: 78,
    category: "pizza",
    tags: ["Maison"],
    isSignature: true,
    isComingSoon: true,
  },

  // ── DESSERTS ─────────────────────────────────────────────────────
  {
    id: "dessert-tiramisu",
    name: "Tiramisu",
    description: "Recette traditionnelle, mascarpone, café espresso, cacao",
    price: 10,
    category: "desserts",
    isSignature: true,
  },

  // ── BOISSONS ─────────────────────────────────────────────────────
  {
    id: "boi-soda",
    name: "Soda",
    description: "Canette 33cl",
    price: 3,
    category: "boissons",
  },
  {
    id: "boi-eau",
    name: "Eau Minérale 0.5L",
    description: "Eau minérale naturelle 50cl",
    price: 1.5,
    category: "boissons",
  },

  // ── SUPPLÉMENTS ──────────────────────────────────────────────────
  {
    id: "sup-fromage",
    name: "Supplément Fromage",
    description: "Mozzarella extra ou Grana Padana râpé",
    price: 2,
    category: "supplements",
  },
  {
    id: "sup-charcuterie",
    name: "Supplément Charcuterie",
    description: "Jambon, bresola, ou pepperoni",
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
  {
    id: "sup-sauce",
    name: "Sauce Maison",
    description: "Pesto, sauce balsamique, ou crème citronnée",
    price: 1.5,
    category: "supplements",
  },

  // ── À PARTAGER ───────────────────────────────────────────────────
  {
    id: "partager-plateau-mixte",
    name: "Plateau Mixte",
    description: "Sélection de 4 pizzas au choix — idéal pour 3 à 4 personnes",
    price: "Sur demande",
    category: "partager",
    isComingSoon: true,
  },
  {
    id: "partager-plateau-signature",
    name: "Plateau Signatures",
    description: "Nos 3 pizzas signatures en version plateau — Bresaola, Poulet Pesto, Saumon",
    price: "Sur demande",
    category: "partager",
    isComingSoon: true,
  },
  {
    id: "partager-plateau-decouverte",
    name: "Plateau Découverte",
    description: "Le meilleur de notre carte pour partager — parfait pour les groupes",
    price: "Sur demande",
    category: "partager",
    isComingSoon: true,
  },
];

export const signatureItems = menuItems.filter((item) => item.isSignature && !item.isComingSoon);
export const availablePizzas = menuItems.filter((item) => item.category === "pizza" && !item.isComingSoon);
export const comingSoonPizzas = menuItems.filter((item) => item.category === "pizza" && item.isComingSoon);
