import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://uni-token-jar-monitor.up.railway.app";

export const metadata: Metadata = {
  title: "UNI Jar Monitor | Uniswap Fee Burn Tracker",
  description: "Monitor Uniswap TokenJar profitability - Track when burning 4,000 UNI to claim accumulated protocol fees becomes profitable",
  icons: {
    icon: [
      { url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦄</text></svg>", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "UNI Jar Monitor | Uniswap Fee Burn Tracker",
    description: "Monitor Uniswap TokenJar profitability - Track when burning 4,000 UNI to claim accumulated protocol fees becomes profitable",
    url: siteUrl,
    siteName: "UNI Jar Monitor",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "UNI Jar Monitor - Uniswap Fee Burn Tracker",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UNI Jar Monitor | Uniswap Fee Burn Tracker",
    description: "Monitor Uniswap TokenJar profitability - Track when burning 4,000 UNI to claim accumulated protocol fees becomes profitable",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
