import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOKEN JAR | Uniswap Fee Burn Monitor",
  description: "Monitor Uniswap TokenJar profitability for UNI burn claims - 16-bit retro style",
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
