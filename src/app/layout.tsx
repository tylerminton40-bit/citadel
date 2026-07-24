import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Citadel — Competitive Deadlock",
  description: "XP matches, tournaments, and competitive play for Deadlock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}