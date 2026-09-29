import type { MenuItem } from "@/data/menu";

// Photo library shared by the Gallery section and the menu cards' photo
// viewer — a menu item's extra photos are the gallery photos sitting in the
// same /images/<folder>/ as its main image (see getItemPhotos).

export type GalleryType = "tout" | "thon" | "pepperoni" | "jambon-fume" | "bresaola" | "poulet-pesto" | "poulet-epice" | "quattro-formaggi" | "truffe" | "restaurant";

export interface GalleryImage {
  src: string;
  alt: string;
  span: string;
  type: GalleryType;
}

export const galleryFilters: { id: GalleryType; label: string; icon: string }[] = [
  { id: "tout", label: "Tout", icon: "🍕" },
  { id: "bresaola", label: "Bresaola", icon: "🥩" },
  { id: "poulet-pesto", label: "Poulet Pesto", icon: "🌿" },
  { id: "truffe", label: "Truffe", icon: "✨" },
  { id: "pepperoni", label: "Pepperoni", icon: "🌶️" },
  { id: "thon", label: "Thon", icon: "🐟" },
  { id: "jambon-fume", label: "Jambon Fumé", icon: "🥓" },
  { id: "quattro-formaggi", label: "Quattro Formaggi", icon: "🧀" },
  { id: "poulet-epice", label: "Poulet Épicé", icon: "🔥" },
  { id: "restaurant", label: "Restaurant", icon: "🏪" },
];

export const galleryImages: GalleryImage[] = [
  // Restaurant / Facade
  { src: "/images/facade/DSC01860.jpg", alt: "Façade Pezzo Italiano de nuit", span: "col-span-1 row-span-2", type: "restaurant" },
  { src: "/images/facade/DSC01863.jpg", alt: "Entrée du restaurant", span: "col-span-1 row-span-1", type: "restaurant" },
  { src: "/images/facade/DSC01865.jpg", alt: "Vue de la salle", span: "col-span-1 row-span-1", type: "restaurant" },

  // Bresaola
  { src: "/images/bresaola-boeuf/DSC01942.jpg", alt: "Pizza Bresaola", span: "col-span-1 row-span-1", type: "bresaola" },
  { src: "/images/bresaola-boeuf/DSC01945.jpg", alt: "Pizza Bresaola détail", span: "col-span-1 row-span-2", type: "bresaola" },
  { src: "/images/bresaola-boeuf/DSC01947.jpg", alt: "Pizza Bresaola garnie", span: "col-span-1 row-span-1", type: "bresaola" },
  { src: "/images/bresaola-boeuf/DSC01948.jpg", alt: "Pizza Bresaola vue rapprochée", span: "col-span-1 row-span-1", type: "bresaola" },
  { src: "/images/bresaola-boeuf/DSC01951.jpg", alt: "Pizza Bresaola présentation", span: "col-span-1 row-span-1", type: "bresaola" },

  // Poulet Pesto Champignons
  { src: "/images/poulet-pesto-champ/DSC01901.jpg", alt: "Pizza Poulet Pesto Champignons", span: "col-span-1 row-span-1", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01904.jpg", alt: "Pizza Poulet Pesto détail", span: "col-span-2 row-span-1", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01905.jpg", alt: "Pizza Poulet Pesto garnie", span: "col-span-1 row-span-1", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01906.jpg", alt: "Pizza Poulet Pesto vue rapprochée", span: "col-span-1 row-span-2", type: "poulet-pesto" },
  { src: "/images/poulet-pesto-champ/DSC01914.jpg", alt: "Pizza Poulet Pesto présentation", span: "col-span-1 row-span-1", type: "poulet-pesto" },

  // Truffe
  { src: "/images/truffe-champ/DSC01932.jpg", alt: "Pizza Truffe", span: "col-span-1 row-span-1", type: "truffe" },
  { src: "/images/truffe-champ/DSC01934.jpg", alt: "Pizza Truffe détail", span: "col-span-1 row-span-2", type: "truffe" },
  { src: "/images/truffe-champ/DSC01935.jpg", alt: "Pizza Truffe champignons", span: "col-span-1 row-span-1", type: "truffe" },
  { src: "/images/truffe-champ/DSC01939.jpg", alt: "Pizza Truffe présentation", span: "col-span-1 row-span-1", type: "truffe" },

  // Pepperoni
  { src: "/images/pepperoni/DSC01891.jpg", alt: "Pizza Pepperoni", span: "col-span-1 row-span-1", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01893.jpg", alt: "Pizza Pepperoni détail", span: "col-span-1 row-span-1", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01894.jpg", alt: "Pizza Pepperoni garnie", span: "col-span-1 row-span-2", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01895.jpg", alt: "Pizza Pepperoni vue rapprochée", span: "col-span-1 row-span-1", type: "pepperoni" },
  { src: "/images/pepperoni/DSC01900.jpg", alt: "Pizza Pepperoni présentation", span: "col-span-1 row-span-1", type: "pepperoni" },

  // Thon
  { src: "/images/thon/DSC01925.jpg", alt: "Pizza Thon", span: "col-span-1 row-span-1", type: "thon" },
  { src: "/images/thon/DSC01926.jpg", alt: "Pizza Thon détail", span: "col-span-1 row-span-1", type: "thon" },
  { src: "/images/thon/DSC01927.jpg", alt: "Pizza Thon garnie", span: "col-span-1 row-span-1", type: "thon" },
  { src: "/images/thon/DSC01930.jpg", alt: "Pizza Thon présentation", span: "col-span-1 row-span-2", type: "thon" },

  // Jambon Fumé
  { src: "/images/jombon-fume/DSC01954.jpg", alt: "Pizza Jambon Fumé", span: "col-span-1 row-span-1", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01956.jpg", alt: "Pizza Jambon Fumé détail", span: "col-span-1 row-span-2", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01957.jpg", alt: "Pizza Jambon Fumé garnie", span: "col-span-1 row-span-1", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01959.jpg", alt: "Pizza Jambon Fumé champignons", span: "col-span-1 row-span-1", type: "jambon-fume" },
  { src: "/images/jombon-fume/DSC01962.jpg", alt: "Pizza Jambon Fumé présentation", span: "col-span-1 row-span-1", type: "jambon-fume" },

  // Quattro Formaggi
  { src: "/images/quatro-fromage/DSC01867.jpg", alt: "Pizza Quattro Formaggi", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01868.jpg", alt: "Pizza Quattro Formaggi fondue", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01871.jpg", alt: "Pizza Quattro Formaggi détail", span: "col-span-1 row-span-2", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01874.jpg", alt: "Pizza Quattro Formaggi garnie", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01875.jpg", alt: "Pizza Quattro Formaggi vue", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01882.jpg", alt: "Pizza Quattro Formaggi présentation", span: "col-span-1 row-span-1", type: "quattro-formaggi" },
  { src: "/images/quatro-fromage/DSC01885.jpg", alt: "Pizza Quattro Formaggi fondue 2", span: "col-span-1 row-span-1", type: "quattro-formaggi" },

  // Poulet Épicé
  { src: "/images/poulet-epice/DSC01966.jpg", alt: "Pizza Poulet Épicé", span: "col-span-1 row-span-2", type: "poulet-epice" },
  { src: "/images/poulet-epice/DSC01967.jpg", alt: "Pizza Poulet Épicé détail", span: "col-span-1 row-span-1", type: "poulet-epice" },
  { src: "/images/poulet-epice/DSC01971.jpg", alt: "Pizza Poulet Épicé piment", span: "col-span-1 row-span-1", type: "poulet-epice" },

  // Mixed
  { src: "/images/mixed-pizza/DSC01982.jpg", alt: "Assortiment pizzas al taglio", span: "col-span-2 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01984.jpg", alt: "Plateaux pizza al taglio", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01985.jpg", alt: "Pizza al taglio variées", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01988.jpg", alt: "Sélection du jour", span: "col-span-1 row-span-2", type: "tout" },
  { src: "/images/mixed-pizza/DSC01991.jpg", alt: "Pizzas fraîches du jour", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/mixed-pizza/DSC01994.jpg", alt: "Assortiment garnitures", span: "col-span-1 row-span-1", type: "tout" },

  // Salmon (bonus)
  { src: "/images/salmon/DSC01918.jpg", alt: "Pizza Saumon", span: "col-span-1 row-span-1", type: "tout" },
  { src: "/images/salmon/DSC01920.jpg", alt: "Pizza Saumon détail", span: "col-span-1 row-span-2", type: "tout" },
  { src: "/images/salmon/DSC01921.jpg", alt: "Pizza Saumon garnie", span: "col-span-1 row-span-1", type: "tout" },
];

export interface ItemPhoto {
  src: string;
  alt: string;
}

// The item's own photo first, then every gallery photo from the same local
// folder. Photos uploaded from /admin (Vercel Blob URLs) have no folder
// siblings, so those items just get their single photo.
export function getItemPhotos(item: Pick<MenuItem, "image" | "name">): ItemPhoto[] {
  if (!item.image) return [];
  const main = { src: item.image, alt: item.name };
  if (!item.image.startsWith("/images/")) return [main];

  const folder = item.image.slice(0, item.image.lastIndexOf("/") + 1);
  const siblings = galleryImages
    .filter((img) => img.src.startsWith(folder) && img.src !== item.image)
    .map(({ src, alt }) => ({ src, alt }));
  return [main, ...siblings];
}
