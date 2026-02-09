import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
});

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
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "UNI Jar Monitor | Uniswap Fee Burn Tracker",
    description: "Monitor Uniswap TokenJar profitability - Track when burning 4,000 UNI to claim accumulated protocol fees becomes profitable",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
