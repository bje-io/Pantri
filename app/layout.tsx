import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Pantri — Your AI-Powered Kitchen Companion",
  description:
    "Plan delicious weekly meals, shop smarter, and cook with confidence. Pantri is your AI-powered kitchen companion.",
  keywords: ["meal planning", "recipes", "AI cooking", "grocery list", "meal prep"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, playfair.variable)}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
