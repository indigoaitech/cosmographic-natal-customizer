import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Syne } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Cosmographi · Birth Map Generator",
    template: "%s · Cosmographi",
  },
  description:
    "Enter birth date, time, and place. Generate a print-ready classic natal chart with Swiss Ephemeris and a brief astrological reading.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.cosmographic.store",
  ),
  openGraph: {
    title: "Cosmographi · Birth Map Generator",
    description:
      "Classic print-ready natal charts from Swiss Ephemeris — cosmic cartography & data design.",
    url: "https://www.cosmographic.store",
    siteName: "Cosmographi",
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#birth-form"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-md focus:bg-[var(--color-gold)] focus:px-3 focus:py-2 focus:text-[var(--color-void)]"
        >
          Skip to birth form
        </a>
        {children}
      </body>
    </html>
  );
}
