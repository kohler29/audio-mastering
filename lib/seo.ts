export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  twitterHandle: string;
  stage: string;
  bannerText: string;
}

export const seoConfig: SEOConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Master Pro",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  defaultTitle: process.env.NEXT_PUBLIC_DEFAULT_TITLE || "Master Pro - Professional Audio Mastering Plugin",
  defaultDescription:
    process.env.NEXT_PUBLIC_DEFAULT_DESCRIPTION ||
    "Professional audio mastering plugin with advanced controls and real-time visualization",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@masterpro",
  stage: process.env.NEXT_PUBLIC_APP_STAGE || "beta",
  bannerText: process.env.NEXT_PUBLIC_APP_BANNER || "Beta",
};
