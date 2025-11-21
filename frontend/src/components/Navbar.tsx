"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Wallet button needs to be client-only to avoid SSR hydration mismatches
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-emerald-300">
                sol.arena
              </span>
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
              >
                Explore
              </Link>
              <Link
                href="/create"
                className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
              >
                Create Duel
              </Link>
              <Link
                href="/me"
                className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
              >
                My Bets
              </Link>
            </div>
          </div>
          <div>{mounted ? <WalletMultiButton /> : null}</div>
        </div>
      </div>
    </nav>
  );
}
