import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Analytics from "@/components/Analytics";
import PWATracking from "@/components/PWATracking";
import { getGoogleReviews } from "@/lib/google-places";
import { getMenuItems } from "@/lib/data/menu";
import { getContactSettings, getHoursSchedule, getPricingTiers, type ContactSettings } from "@/lib/data/settings";
import { buildOpeningHoursSpecification, type HoursSchedule } from "@/lib/hours-shared";
import OrderProvider from "@/components/OrderProvider";
import "../globals.css";

// Menu/contact/hours now come from the database (raw queries, not fetch())
// so Next can't infer a revalidate window from them the way it does for
// getGoogleReviews()'s fetch() call. This is a fallback ceiling only — every
// admin mutation calls revalidatePath("/", "layout") for an instant update;
// this just bounds staleness if that were ever missed.
export const revalidate = 3600;

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

  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pezzo Italiano",
  },

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

export const viewport: Viewport = {
  themeColor: "#0d3b2e",
};

function buildRestaurantSchema(
  rating: { rating: number; totalRatings: number } | null,
  contact: ContactSettings,
  schedule: HoursSchedule
) {
  return {
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
    streetAddress: contact.address.street,
    addressLocality: contact.address.area,
    addressRegion: contact.address.city,
    postalCode: contact.address.postalCode,
    addressCountry: contact.address.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: contact.address.lat,
    longitude: contact.address.lng,
  },
  hasMap: contact.address.mapsUrl,
  telephone: [contact.phone.primary, contact.phone.secondary],
  servesCuisine: ["Italian", "Pizza", "Pizza al Taglio", "Mediterranean"],
  menu: `${SITE_URL}/#menu`,
  priceRange: "$$",
  currenciesAccepted: "TND",
  paymentAccepted: "Cash, Credit Card",
  // Deliberately the regular posted schedule only — never the live
  // "exceptionally open" override, since search engines cache this data.
  openingHoursSpecification: buildOpeningHoursSpecification(schedule),
  sameAs: [
    contact.social.instagram,
    contact.social.facebook,
    contact.address.mapsUrl,
  ],
  areaServed: [
    { "@type": "City", name: "Sousse" },
    { "@type": "AdministrativeArea", name: "Gouvernorat de Sousse" },
  ],
  ...(rating && rating.totalRatings > 0 && {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating.rating,
      ratingCount: rating.totalRatings,
      bestRating: 5,
      worstRating: 1,
    },
  }),
  };
}

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reuses the same cached fetch as page.tsx (Next dedupes identical
  // requests) — no extra Places API cost from also reading it here.
  const reviewsData = await getGoogleReviews();
  // Unpublished items stay in the DB (and remain editable from /admin/menu)
  // but never reach the public site — the whole tree downstream of
  // OrderProvider (menu grid, order modal, signature picks) only ever sees
  // this filtered list.
  const items = (await getMenuItems()).filter((item) => item.isPublished !== false);
  const contact = await getContactSettings();
  const schedule = await getHoursSchedule();
  const pricingTiers = await getPricingTiers();
  const restaurantSchema = buildRestaurantSchema(reviewsData, contact, schedule);

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
        <OrderProvider items={items} contact={contact} pricingTiers={pricingTiers}>{children}</OrderProvider>
      </body>
      <Analytics />
      <PWATracking />
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
