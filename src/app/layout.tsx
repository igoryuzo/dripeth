import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ethdca | Automated Ethereum DCA on Base - Dollar Cost Average ETH",
  description: "Automated dollar-cost averaging for Ethereum. Set your schedule and let ethdca buy ETH for you weekly. No gas fees. Built on Base with Privy and 0x Protocol.",
  keywords: ["DCA", "Dollar Cost Averaging", "Ethereum", "ETH", "Crypto", "Base", "Automated Trading", "0x", "Privy", "DeFi", "Crypto Automation"],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  openGraph: {
    title: "ethdca | Automated Ethereum DCA on Base",
    description: "Automated dollar-cost averaging for Ethereum. Set your schedule and let ethdca buy ETH for you weekly. No gas fees.",
    url: "https://ethdca.vercel.app",
    siteName: "ethdca",
    images: [
      {
        url: "/share-image.png",
        width: 1200,
        height: 630,
        alt: "ethdca - Automated Dollar Cost Averaging for Ethereum",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ethdca | Automated Ethereum DCA on Base",
    description: "Automated dollar-cost averaging for Ethereum. Set your schedule and let ethdca buy ETH for you weekly. No gas fees.",
    images: ["/share-image.png"],
  },
  alternates: {
    canonical: "https://ethdca.vercel.app",
  },
  metadataBase: new URL("https://ethdca.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ethdca",
    "description": "Automated Dollar Cost Averaging for Ethereum",
    "url": "https://ethdca.vercel.app",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Automated Ethereum DCA",
      "Gasless transactions",
      "Weekly automated swaps",
      "Embedded wallet",
      "0x Protocol integration"
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
