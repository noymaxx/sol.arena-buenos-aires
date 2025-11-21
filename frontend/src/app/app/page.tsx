"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BetCard } from "@/components/BetCard";
import { getProgram, safeToNumber } from "@/lib/anchorClient";

export default function AppPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBets();
  }, [connection]);

  const loadBets = async () => {
    try {
      setLoading(true);
      const program = getProgram(connection, wallet as any, true);
      // @ts-ignore - Temporary fix for TypeScript account name resolution
      const allBets = await program.account.bet.all();

      console.log("[loadBets] Raw bets data:", allBets);

      const sorted = allBets.sort((a: any, b: any) => {
        console.log("[loadBets] Processing bet:", a?.account);
        const aDeadline = safeToNumber(a?.account?.deadlineCrowd);
        const bDeadline = safeToNumber(b?.account?.deadlineCrowd);
        return bDeadline - aDeadline;
      });

      setBets(sorted);
      console.log("[loadBets] Sorted bets set:", sorted.length);
    } catch (error) {
      console.error("Error loading bets:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "Live duels",
      value: bets.length,
      tone: "from-emerald-500/80 to-emerald-300/60",
    },
    {
      label: "Active crowd",
      value: Math.max(bets.length * 2, 12),
      tone: "from-purple-500/80 to-indigo-400/60",
    },
    {
      label: wallet.connected ? "Wallet connected" : "Wallet disconnected",
      value: wallet.connected ? "Ready" : "Connect",
      tone: "from-amber-400/80 to-orange-400/60",
    },
  ];

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-white/5 h-48 animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-20 animate-grid-flow" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute right-10 bottom-10 h-80 w-80 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col gap-10">
          <header className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_100px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                  Live arena
                </p>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                    sol.arena
                  </h1>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-200 border border-emerald-500/40">
                    Devnet
                  </span>
                </div>
                <p className="text-lg text-white/75 max-w-2xl">
                  Pairs lock 1v1 stakes while the crowd adds liquidity on
                  predictions. A clean stage ready to bet or create.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
                  >
                    Create new duel
                  </a>
                  <button
                    onClick={loadBets}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-base font-semibold text-white/80 hover:text-white hover:border-emerald-400/40 hover:bg-emerald-500/10 transition"
                  >
                    Refresh feed
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto min-w-[260px]">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-2 text-3xl font-semibold bg-gradient-to-r ${stat.tone} bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_15px_70px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-white/60">
                  Arena feed
                </p>
                <h2 className="text-2xl font-bold">Pick your side</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200 border border-emerald-500/30">
                  {wallet.connected ? "Wallet connected" : "Connect to bet"}
                </span>
                <a
                  href="/create"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/10 transition"
                >
                  Create duel
                </a>
              </div>
            </div>

            {loading ? (
              renderSkeleton()
            ) : bets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-full bg-white/5 border border-white/10 p-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-400/40 blur-sm" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-white">
                    No duels yet
                  </p>
                  <p className="text-white/70">
                    Be the first to launch a duel and open the crowd market.
                  </p>
                </div>
                <a
                  href="/create"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] transition"
                >
                  Create first duel
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bets.map((bet) => (
                  <BetCard
                    key={bet.publicKey.toString()}
                    betPubkey={bet.publicKey}
                    bet={bet.account}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
