import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Aura — Your AI Fitness Coach",
    template: "%s · Aura",
  },
  description:
    "Aura is your premium AI health coach. Track workouts, nutrition, and progress, get personalized coaching, and stay motivated to transform your body.",
  keywords: ["fitness", "workout tracker", "nutrition", "AI coach", "weight loss", "muscle gain", "macros"],
  authors: [{ name: "Aura" }],
  openGraph: {
    title: "Aura — Your AI Fitness Coach",
    description: "Train smarter, eat better, and stay motivated with your personal AI coach.",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafe" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
