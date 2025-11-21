"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BetCard } from "@/components/BetCard";
import { getProgram, lamportsToSol, safeToNumber } from "@/lib/anchorClient";

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
      const program = await getProgram(connection, wallet as any, true);
      // @ts-ignore - Temporary fix for TypeScript account name resolution
      const allBets = await program.account.bet.all();
      const sorted = allBets.sort((a: any, b: any) => {
        const aDeadline = safeToNumber(a?.account?.deadlineCrowd);
        const bDeadline = safeToNumber(b?.account?.deadlineCrowd);
        return bDeadline - aDeadline;
      });
      setBets(sorted);
    } catch (error) {
      console.error("Error loading bets:", error);
    } finally {
      setLoading(false);
    }
  };

  const shorten = (value?: string | null) =>
    value ? `${value.slice(0, 4)}...${value.slice(-3)}` : "—";

  const crowdLiquidity = useMemo(
    () =>
      bets.reduce((total, b) => {
        const account = b?.account;
        const supportA = lamportsToSol(account?.netSupportA || 0);
        const supportB = lamportsToSol(account?.netSupportB || 0);
        return total + supportA + supportB;
      }, 0),
    [bets]
  );

  const liveDuels = useMemo(
    () =>
      bets.filter((b) => {
        const status = b?.account?.status;
        return status && !("resolved" in status) && !("cancelled" in status);
      }).length,
    [bets]
  );

  const userExposure = useMemo(() => {
    if (!wallet.publicKey) return 0;
    const key = wallet.publicKey.toBase58();
    return bets.reduce((total, b) => {
      const account = b?.account;
      if (!account) return total;
      const isPlayer =
        account.userA?.toBase58?.() === key ||
        account.userB?.toBase58?.() === key;
      if (!isPlayer) return total;
      return total + lamportsToSol(account.stakeLamports || 0);
    }, 0);
  }, [bets, wallet.publicKey]);

  const stats = [
    {
      label: "Live duels",
      value: liveDuels,
      hint: "On stage right now",
      tone: "from-emerald-400/80 to-emerald-200/60",
    },
    {
      label: "Crowd liquidity",
      value: `${crowdLiquidity.toFixed(2)} ◎`,
      hint: "SOL backing odds",
      tone: "from-purple-400/80 to-indigo-300/60",
    },
    {
      label: "Your exposure",
      value: wallet.connected ? `${userExposure.toFixed(2)} ◎` : "Connect",
      hint: wallet.connected ? "Staked as A/B" : "Plug wallet to track",
      tone: "from-amber-300/80 to-orange-200/60",
    },
    {
      label: "Wallet",
      value: wallet.connected
        ? shorten(wallet.publicKey?.toBase58())
        : "Not connected",
      hint: wallet.connected ? "Ready to back" : "Connect to join",
      tone: "from-emerald-300/80 to-white/70",
    },
  ];

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 h-52"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-[shine_2.4s_linear_infinite]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-gradient" />
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-25 animate-grid-flow" />
        <div className="absolute inset-0 bg-arena-noise opacity-40" />
        <div className="absolute -left-28 top-6 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-10">
          <header className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,242,170,0.9)] animate-pulse" />
                  Live arena · sol.arena · Devnet
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
                    Arena HUD
                  </h1>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200">
                    Crowd first · Odds live
                  </span>
                </div>
                <p className="text-lg text-white/75 max-w-3xl">
                  Pairs lock 1v1 stakes while the crowd pushes odds and volume.
                  Step in to host or back a duel. The house spread flows to
                  creators, arbiters and the protocol.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(120deg,#22f2aa,#7c3aed,#22f2aa)] bg-[length:200%_200%] px-5 py-3 text-base font-semibold text-slate-950 shadow-[0_18px_60px_rgba(34,242,170,0.35)] transition hover:scale-[1.02]"
                    style={{ animation: "shine 7s linear infinite" }}
                  >
                    Host a duel
                  </a>
                  <a
                    href="#arena-feed"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-base font-semibold text-white/80 hover:text-white hover:border-emerald-400/40 hover:bg-emerald-500/10 transition"
                  >
                    Browse arena
                  </a>
                  <button
                    onClick={loadBets}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-100 hover:border-purple-300/60 hover:bg-purple-500/20 transition"
                  >
                    Refresh odds
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto min-w-[280px]">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-2 text-2xl font-semibold bg-gradient-to-r ${stat.tone} bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-white/50">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <section
            id="arena-feed"
            className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.45)]"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                  Arena feed
                </p>
                <h2 className="text-3xl font-display font-semibold">
                  Back a champion.
                </h2>
                <p className="text-sm text-white/60">
                  Live duels where the crowd sets the odds.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200 border border-emerald-500/30">
                  {wallet.connected ? "Wallet connected" : "Connect to bet"}
                </span>
                <a
                  href="/create"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/10 transition"
                >
                  Host a duel
                </a>
              </div>
            </div>

            {loading ? (
              renderSkeleton()
            ) : bets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500/15 to-purple-500/15 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-semibold text-white">
                    No duels on stage yet.
                  </p>
                  <p className="text-white/70">
                    Be the first to host a duel and open the crowd market.
                  </p>
                </div>
                <a
                  href="/create"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] transition"
                >
                  Open first arena
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
