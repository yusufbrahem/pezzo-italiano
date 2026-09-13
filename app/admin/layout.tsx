import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "../globals.css";

// Independent root layout for /admin — deliberately excludes everything
// customer-facing from the marketing site's root layout (OrderProvider,
// GA4, Clarity, PWA install tracking). See app/(site)/layout.tsx for that.

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Admin — Pezzo Italiano", template: "%s | Admin Pezzo Italiano" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-brand-cream antialiased">{children}</body>
    </html>
  );
}
