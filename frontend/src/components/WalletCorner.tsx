"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function WalletCorner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed right-4 top-4 sm:right-6 sm:top-6 z-50">
      <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-400 focus:!ring-2 focus:!ring-emerald-300" />
    </div>
  );
}
