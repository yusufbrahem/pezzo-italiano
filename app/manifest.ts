import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pezzo Italiano — Pizza al Taglio Sousse",
    short_name: "Pezzo Italiano",
    description:
      "Pizza al taglio authentique à Sousse, Tunisie. Commandez en un tap.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9f5ec",
    theme_color: "#0d3b2e",
    lang: "fr-TN",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
