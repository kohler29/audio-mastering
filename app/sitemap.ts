import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = new URL(seoConfig.siteUrl);
  const entries: MetadataRoute.Sitemap = [
    { url: new URL("/", base).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/logout", base).toString(), changeFrequency: "monthly", priority: 0.2 },
    { url: new URL("/sentry-example-page", base).toString(), changeFrequency: "monthly", priority: 0.1 },
  ];
  return entries;
}
