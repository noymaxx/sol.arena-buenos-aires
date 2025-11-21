import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { Toaster } from "react-hot-toast";
import { WalletCorner } from "@/components/WalletCorner";
import { LogoBar } from "@/components/LogoBar";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <WalletProvider>
          <LogoBar />
          <WalletCorner />
          <main className="min-h-screen bg-arena-gradient text-white">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </WalletProvider>
      </body>
    </html>
  );
}
