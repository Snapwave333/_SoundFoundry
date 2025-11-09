import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoundFoundry — Craft Your Sound",
  description: "Generate full tracks from a prompt. Add lyrics, guide with a reference, and export when ready.",
  keywords: ["AI music", "music generation", "text to music", "AI audio"],
  authors: [{ name: "SoundFoundry" }],
  openGraph: {
    title: "SoundFoundry — Craft Your Sound",
    description: "Generate full tracks from a prompt. Add lyrics, guide with a reference, and export when ready.",
    type: "website",
    images: [
      {
        url: "/og/social_preview.png",
        width: 1200,
        height: 630,
        alt: "SoundFoundry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundFoundry — Craft Your Sound",
    description: "Generate full tracks from a prompt. Add lyrics, guide with a reference, and export when ready.",
    images: ["/og/social_preview.png"],
  },
  themeColor: "hsl(220 14% 9%)",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <meta name="theme-color" content="hsl(220 14% 9%)" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
