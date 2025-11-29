import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = new URL(seoConfig.siteUrl);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: [new URL("/sitemap.xml", base).toString()],
    host: base.origin,
  };
}

