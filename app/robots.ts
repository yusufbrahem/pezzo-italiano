import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://pezzo-italiano.com/sitemap.xml",
    host: "https://pezzo-italiano.com",
  };
}
