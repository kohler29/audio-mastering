import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { seoConfig } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: "%s | " + seoConfig.siteName,
  },
  description: seoConfig.defaultDescription,
  applicationName: seoConfig.siteName,
  generator: "Next.js",
  keywords: [
    "audio",
    "mastering",
    "mastering online",
    "audio mastering online",
    "music mastering",
    "music mastering online",
    "professional mastering",
    "free mastering",
    "web audio",
    "browser audio mastering",
    "audio editor",
    "online audio editor",
    "plugin",
    "audio plugin",
    "mastering plugin",
    "multiband compressor",
    "stereo width",
    "reverb",
    "harmonizer",
    "saturation",
    "compressor",
    "limiter",
    "loudness meter",
    "LUFS",
    "spectrum analyzer",
    "audio effects",
    "audio processing",
    "audio normalization",
    "MP3 mastering",
    "WAV mastering",
    "FLAC mastering",
    "rock mastering",
    "electronic mastering",
    "acoustic mastering",
    "cinematic mastering",
  ],
  authors: [{ name: seoConfig.siteName }],
  creator: seoConfig.siteName,
  publisher: seoConfig.siteName,
  alternates: {
    canonical: seoConfig.siteUrl,
  },
  openGraph: {
    type: "website",
    url: seoConfig.siteUrl,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    siteName: seoConfig.siteName,
    images: [
      {
        // Ensure absolute URL for WhatsApp and other social media
        // WhatsApp requires absolute URLs that are publicly accessible
        url: seoConfig.ogImageUrl,
        width: 1200,
        height: 630,
        alt: seoConfig.siteName,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitterHandle,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [seoConfig.ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: seoConfig.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {seoConfig.stage?.toLowerCase() === "beta" && (
          <div className="w-full bg-amber-900/40 text-amber-300 text-xs px-3 py-2 text-center border-b border-amber-700">
            {seoConfig.bannerText}
          </div>
        )}
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
