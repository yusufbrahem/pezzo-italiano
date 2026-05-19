import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pezzoitaliano.tn"),
  title: "Pezzo Italiano — Pizza al Taglio | Sousse, Tunisie",
  description:
    "Pezzo Italiano — Authentique pizza italienne al taglio à Sousse. Fraîche, croustillante, cuite chaque jour. Khzema Ouest, Rue Imam Moslem.",
  keywords: [
    "pizza al taglio",
    "Pezzo Italiano",
    "pizza Sousse",
    "restaurant italien Tunisie",
    "pizza fraîche",
    "panuozzo",
    "pizza artisanale",
  ],
  authors: [{ name: "Pezzo Italiano" }],
  creator: "Pezzo Italiano",
  openGraph: {
    type: "website",
    locale: "fr_TN",
    siteName: "Pezzo Italiano",
    title: "Pezzo Italiano — Pizza al Taglio Authentique",
    description:
      "L'Italie à chaque tranche. Pizza al taglio fraîche, croustillante, cuite chaque jour à Sousse.",
    images: [
      {
        url: "/images/DSC01860.jpg",
        width: 1200,
        height: 630,
        alt: "Pezzo Italiano — Pizza al Taglio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pezzo Italiano — Pizza al Taglio",
    description: "Authentique pizza italienne al taglio à Sousse, Tunisie.",
    images: ["/images/DSC01860.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Pezzo Italiano",
  image: "/images/DSC01860.jpg",
  description:
    "Authentique pizza italienne al taglio. Fraîche, croustillante, cuite chaque jour.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rue Imam Moslem",
    addressLocality: "Khzema Ouest, Sousse",
    postalCode: "4051",
    addressCountry: "TN",
  },
  telephone: ["+21653086089", "+21658057094"],
  servesCuisine: ["Italian", "Pizza"],
  priceRange: "$$",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "11:00",
      closes: "23:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/pezzo.italiano/",
    "https://www.facebook.com/1123669727485255",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${dmSans.variable} scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
      </head>
      <body className="min-h-screen bg-brand-cream antialiased">{children}</body>
    </html>
  );
}
