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

// Menu items now live in the database (lib/data/menu.ts's getMenuItems()),
// editable from /admin without a deploy. These used to be module-level
// consts computed from a static array; now they're plain functions taking
// the fetched array as a parameter — same filter predicates as before.

export function getSignatureItems(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => item.isSignature && !item.isComingSoon);
}

export function getAvailablePizzas(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => item.category === "pizza" && !item.isComingSoon);
}

export function getComingSoonPizzas(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => item.category === "pizza" && item.isComingSoon);
}
