import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    "plugin",
    "saturation",
    "compressor",
    "limiter",
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
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitterHandle,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: "#0f172a",
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
      </body>
    </html>
  );
}
