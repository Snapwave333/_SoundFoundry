import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "@/lib/providers";
import { AnalyticsScript } from "@/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://promptbloom.app";
const siteName = "PromptBloom";
const siteDescription = "Generate professional-quality music tracks from text prompts. Add lyrics, guide with references, and export when ready.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Craft Your Sound`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  keywords: ["AI music", "music generation", "text to music", "AI audio", "music AI"],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: `${siteName} — Craft Your Sound`,
    description: siteDescription,
    images: [
      {
        url: "/branding/social-card_1200x630.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Craft Your Sound`,
    description: siteDescription,
    images: ["/branding/social-card_1200x630.png"],
    creator: "@promptbloom",
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
  icons: {
    icon: [
      { url: "/branding/favicon.ico" },
      { url: "/branding/icon_256.png", sizes: "256x256", type: "image/png" },
      { url: "/branding/icon_512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/branding/icon_512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0F" },
  ],
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" href="/branding/favicon.ico" />
        <link rel="apple-touch-icon" href="/branding/icon_512.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <AnalyticsScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
