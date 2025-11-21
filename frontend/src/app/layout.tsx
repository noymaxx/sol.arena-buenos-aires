import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "react-hot-toast";
import { WalletCorner } from "@/components/WalletCorner";
import { LogoBar } from "@/components/LogoBar";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "sol.arena - Solana Betting Protocol",
  description: "sol.arena betting with crowd prediction markets on Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body antialiased bg-arena-gradient`}>
        <WalletProvider>
          <LogoBar />
          <WalletCorner />
          <main className="min-h-screen text-white">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </WalletProvider>
      </body>
    </html>
  );
}
