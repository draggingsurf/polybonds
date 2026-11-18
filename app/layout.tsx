import type { Metadata } from "next";
import { Albert_Sans, Alumni_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const albert = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-albert",
  display: "swap",
});

const alumni = Alumni_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-alumni",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://polybonds.fun"),
  title: "PolyBonds: near-certain Polymarket predictions ending this year",
  description:
    "Screen near-certain Polymarket markets priced 95¢–99.5¢ that pay out before Dec 31. See total liquidity, returns, and trade links.",
  openGraph: {
    title: "PolyBonds: near-certain Polymarket predictions ending this year",
    description:
      "Near-certain Polymarket predictions that pay out before Dec 31 — liquidity, returns, and trade links.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolyBonds: near-certain Polymarket predictions ending this year",
    description:
      "Near-certain Polymarket predictions that pay out before Dec 31 — liquidity, returns, and trade links.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${albert.variable} ${alumni.variable} ${jetbrains.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
