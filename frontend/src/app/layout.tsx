import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentMarket - AI Agent Commerce Platform",
  description:
    "Autonomous AI agents that discover, negotiate, and pay each other across chains. Built on OG Chain with zero gas fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
