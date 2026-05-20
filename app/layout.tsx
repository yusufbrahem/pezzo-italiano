import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Analytics from "@/components/Analytics";
import OrderProvider from "@/components/OrderProvider";
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

const SITE_URL = "https://pezzo-italiano.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Pezzo Italiano | Pizza al Taglio Authentique — Sousse, Tunisie",
    template: "%s | Pezzo Italiano",
  },

  description:
    "Pizza al taglio authentique à Sousse. Restaurant italien Pezzo Italiano, Khzema Ouest — pâte fraîche croustillante, cuite chaque jour. ☎ 53 086 089",

  keywords: [
    "pizza sousse",
    "pizza italienne sousse",
    "pizza al taglio sousse",
    "restaurant italien sousse",
    "pizza khzema",
    "pizza khzema ouest",
    "pezzo italiano",
    "pizza fraîche sousse",
    "pizza artisanale sousse",
    "pizza al taglio tunisie",
    "restaurant pizza tunisie",
    "meilleure pizza sousse",
    "pizza à emporter sousse",
    "pizza fraîche tunisie",
    "panuozzo sousse",
    "pizza croustillante sousse",
    "restaurant sousse tunisie",
  ],

  authors: [{ name: "Pezzo Italiano", url: SITE_URL }],
  creator: "Pezzo Italiano",
  publisher: "Pezzo Italiano",
  category: "Restaurant",

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    locale: "fr_TN",
    siteName: "Pezzo Italiano",
    title: "Pezzo Italiano — Pizza al Taglio Authentique à Sousse",
    description:
      "Restaurant de pizza italienne al taglio à Sousse, Tunisie. Pâte fraîche, ingrédients authentiques, cuite chaque jour à Khzema Ouest.",
    images: [
      {
        url: "/images/DSC01860.jpg",
        width: 1200,
        height: 630,
        alt: "Pezzo Italiano — Restaurant pizza al taglio Sousse, Tunisie",
      },
      {
        url: "/images/bresaola-boeuf/DSC01945.jpg",
        width: 1200,
        height: 630,
        alt: "Pizza al taglio Bresaola — Pezzo Italiano Sousse",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Pezzo Italiano | Pizza al Taglio à Sousse, Tunisie",
    description:
      "Authentique pizza italienne al taglio à Sousse. Fraîche, croustillante, cuite chaque jour à Khzema Ouest.",
    images: ["/images/DSC01860.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  other: {
    "geo.region": "TN-51",
    "geo.placename": "Sousse, Tunisie",
    "geo.position": "35.8459323;10.6016556",
    ICBM: "35.8459323, 10.6016556",
  },

  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION },
  }),
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": ["Restaurant", "LocalBusiness"],
  "@id": `${SITE_URL}/#restaurant`,
  name: "Pezzo Italiano",
  alternateName: "Pezzo Italiano Sousse",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo/monogram-green.jpeg`,
  image: [
    `${SITE_URL}/images/DSC01860.jpg`,
    `${SITE_URL}/images/bresaola-boeuf/DSC01945.jpg`,
    `${SITE_URL}/images/poulet-pesto-champ/DSC01904.jpg`,
    `${SITE_URL}/images/thon/DSC01930.jpg`,
    `${SITE_URL}/images/truffe-champ/DSC01934.jpg`,
    `${SITE_URL}/images/mixed-pizza/DSC01982.jpg`,
  ],
  description:
    "Authentique restaurant de pizza italienne al taglio à Sousse, Tunisie. Pâte fraîche, ingrédients sélectionnés, cuite chaque jour à Khzema Ouest.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rue Imam Moslem",
    addressLocality: "Khzema Ouest",
    addressRegion: "Sousse",
    postalCode: "4051",
    addressCountry: "TN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 35.8459323,
    longitude: 10.6016556,
  },
  hasMap:
    "https://www.google.com/maps/place/Pezzo+Italiano+Sousse/@35.8459323,10.6016556,17z",
  telephone: ["+21653086089", "+21658057094"],
  servesCuisine: ["Italian", "Pizza", "Pizza al Taglio", "Mediterranean"],
  menu: `${SITE_URL}/#menu`,
  priceRange: "$$",
  currenciesAccepted: "TND",
  paymentAccepted: "Cash, Credit Card",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "11:00",
      closes: "23:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "10:30",
      closes: "23:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "11:00",
      closes: "22:30",
    },
  ],
  sameAs: [
    "https://www.instagram.com/pezzo.italiano/",
    "https://www.facebook.com/1123669727485255",
    "https://www.google.com/maps/place/Pezzo+Italiano+Sousse/",
  ],
  areaServed: [
    { "@type": "City", name: "Sousse" },
    { "@type": "AdministrativeArea", name: "Gouvernorat de Sousse" },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Pezzo Italiano",
  description: "Restaurant de pizza al taglio authentique à Sousse, Tunisie",
  inLanguage: "fr-TN",
  publisher: {
    "@id": `${SITE_URL}/#restaurant`,
  },
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
        {/* Preconnect to external origins used after hydration */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(restaurantSchema).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-screen bg-brand-cream antialiased">
        <OrderProvider>{children}</OrderProvider>
      </body>
      <Analytics />
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
