// Shown in the FAQ section (components/FAQ.tsx) and emitted as FAQPage
// JSON-LD in app/(site)/layout.tsx — both read this one list, so the
// structured data always matches the visible text (Google requires that).
// Written around real search queries: "meilleure pizza sousse",
// "pizza al taglio sousse", "best pizza sousse / tunisia".

export type FaqEntry = { question: string; answer: string; lang?: "en" };

export const FAQ: FaqEntry[] = [
  {
    question: "Où manger une bonne pizza italienne à Sousse ?",
    answer:
      "Pezzo Italiano, à Khzema Ouest (Rue Imam Moslem, Sousse), sert une pizza al taglio authentique à la romaine : pâte maison, cuite chaque jour, garnie d'ingrédients italiens comme la mozzarella fior di latte, la bresaola ou la truffe.",
  },
  {
    question: "Qu'est-ce que la pizza al taglio ?",
    answer:
      "« Al taglio » veut dire « à la coupe » en italien. C'est la pizza de rue de Rome : cuite en grandes plaques rectangulaires, puis découpée à la taille que vous voulez. Chez Pezzo Italiano, elle se commande en quart, en demi ou en plateau, et le prix dépend de la gamme (Classique, Premium, Prestige, Sélection Oro).",
  },
  {
    question: "Pourquoi Pezzo Italiano est-elle une des meilleures pizzas de Sousse ?",
    answer:
      "Une pâte faite maison, croustillante dessous et légère à l'intérieur, des produits importés d'Italie et une cuisson chaque jour. Nos clients nous le disent dans leurs avis Google — lisez-les dans la section « Avis » ci-dessus.",
  },
  {
    question: "Faites-vous la livraison à Sousse ?",
    answer:
      "Oui. Commandez directement sur ce site avec le bouton « Commander » : choisissez vos pizzas, la livraison ou le retrait sur place, et la commande est envoyée sur WhatsApp. Vous pouvez aussi nous appeler.",
  },
  {
    question: "Peut-on commander une pizza pour un groupe ou un événement ?",
    answer:
      "Oui, le format plateau est pensé pour ça : une grande plaque de pizza al taglio, parfaite pour un anniversaire, une réunion ou une soirée entre amis à Sousse. Contactez-nous sur WhatsApp pour une commande spéciale.",
  },
  {
    lang: "en",
    question: "Where can I find the best pizza in Sousse, Tunisia?",
    answer:
      "Pezzo Italiano in Khzema Ouest, Sousse, makes authentic Roman-style pizza al taglio (pizza by the slice): homemade dough baked fresh every day with Italian ingredients. Order online for delivery or take-away, or visit us on Rue Imam Moslem.",
  },
];
