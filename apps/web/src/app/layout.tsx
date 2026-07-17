import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Cosmographic | Personalized Natal Chart Apparel",
    template: "%s · Cosmographic",
  },
  description:
    "Enter your birth data, generate an accurate Swiss Ephemeris natal chart, and shop personalized print-on-demand apparel — front wheel, back planet table, zero manual uploads.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.cosmographic.store",
  ),
  authors: [{ name: "Cosmographic Store", url: "https://www.cosmographic.store" }],
  openGraph: {
    title: "Cosmographic · Your natal chart, printed",
    description:
      "Swiss Ephemeris natal charts personalized on tees, hoodies, and more.",
    url: "https://www.cosmographic.store",
    siteName: "Cosmographic",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#birth-form"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-block focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-md focus:bg-[var(--color-electric-blue)] focus:px-3 focus:py-2 focus:text-[var(--color-void)]"
        >
          Skip to birth form
        </a>
        {children}
      </body>
    </html>
  );
}
