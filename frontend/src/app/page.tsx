"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const SwordsIcon = () => (
  <svg viewBox="0 0 32 32" className="h-5 w-5 text-emerald-300">
    <path
      fill="currentColor"
      d="M6.9 4.7 4.7 6.9l8.6 8.6-1.6 1.6-5.3-4.8-1.8 1.8 4.8 5.3-1.5 1.5 1.7 1.7 1.5-1.5 5.3 4.8 1.8-1.8-4.8-5.3 1.6-1.6 8.6 8.6 2.2-2.2L6.9 4.7Z"
    />
  </svg>
);

const CrowdIcon = () => (
  <svg viewBox="0 0 32 32" className="h-4 w-4 text-purple-200">
    <path
      fill="currentColor"
      d="M9.5 14.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm13 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm-6.5-2a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm-9 3.5c-2 0-4 1.1-4 3v4.5h6.8v-2.3a4.5 4.5 0 0 1 4.7-4.5c-.9-.4-1.9-.7-3.2-.7h-4.3Zm18 0h-4.3c-1.3 0-2.3.3-3.2.7a4.5 4.5 0 0 1 4.7 4.5v2.3H29V19c0-1.9-2-3-4-3Zm-9 1.5c-2.4 0-5 1.2-5 3.7v3.3h10v-3.3c0-2.5-2.6-3.7-5-3.7Z"
    />
  </svg>
);

const Chip = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 shadow-[0_10px_40px_rgba(34,242,170,0.08)] backdrop-blur"
  >
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
      {icon}
    </span>
    {text}
  </motion.div>
);

const LiveDuelCard = () => {
  return (
    <motion.div
      className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.55)]"
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,242,170,0.12),transparent_30%),radial-gradient(circle_at_80%_60%,rgba(124,58,237,0.16),transparent_32%)]" />
        <div className="absolute inset-[-1px] rounded-2xl border border-white/10 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
      </div>

      <div className="relative p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,242,170,0.9)] animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
              Live duel
            </span>
          </div>
          <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
            Crowd open
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-white/60">Challenger</span>
            <span className="text-lg font-semibold text-white">Monkey</span>
          </div>

          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_15px_30px_rgba(124,58,237,0.18)]">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_120deg,var(--arena-accent),rgba(34,242,170,0.12),rgba(124,58,237,0.16),rgba(34,242,170,0.12))] opacity-70 animate-[spin_10s_linear_infinite]" />
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 border border-white/10">
              <SwordsIcon />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-white/60">Challenger</span>
            <span className="text-lg font-semibold text-purple-100">
              Ant
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Crowd A · 2.4 SOL
          </div>
          <div className="flex items-center justify-end gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-right">
            Crowd B · 2.9 SOL
            <span className="h-2 w-2 rounded-full bg-purple-300" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200"
              initial={{ width: "45%" }}
              animate={{ width: ["45%", "58%", "46%"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400"
              initial={{ width: "55%" }}
              animate={{ width: ["55%", "42%", "54%"] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/65">
            <span>45% backing Monkey</span>
            <span>55% backing Ant</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-white/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            Crowd closes in 01:23:45
          </div>
          <div className="flex items-center gap-2">
            <CrowdIcon />
            186 bettors watching
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const router = useRouter();

  const handleEnterArena = () => {
    router.push("/app");
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-gradient" />
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-25 animate-grid-flow" />
        <div className="absolute inset-0 bg-arena-noise opacity-50" />
        <motion.div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
          animate={{ opacity: [0.4, 0.65, 0.4], y: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3], y: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(34,242,170,0.6)] animate-pulse" />
                Sol Arena Lobby
              </div>

              <motion.h1
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] drop-shadow-[0_10px_60px_rgba(0,0,0,0.45)]"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                Two wallets.{"\n"}
                One duel.{"\n"}
                <span className="bg-gradient-to-r from-emerald-300 via-white to-purple-300 bg-clip-text text-transparent">
                  A crowd behind it.
                </span>
              </motion.h1>

              <motion.p
                className="max-w-2xl text-lg text-white/75"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                On-chain 1v1 bets where the main players earn a spread from
                everyone watching and betting on them. Step into a Solana
                coliseum with neon odds and loud crowds.
              </motion.p>

              <div className="flex flex-wrap gap-3">
                <Chip icon={<SwordsIcon />} text="1v1 duels on Solana" />
                <Chip
                  icon={<CrowdIcon />}
                  text="Crowd prediction pools"
                />
                <Chip
                  icon={<span className="text-lg text-amber-300">◎</span>}
                  text="Spread for players & judges"
                />
              </div>
            </div>

            <div className="relative flex w-full flex-col items-center gap-6 lg:items-end">
              <motion.div
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,242,170,0.12),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.12),transparent_26%)]" />
                <div className="absolute inset-px rounded-[22px] border border-emerald-200/10" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    Arena access
                    <span className="flex items-center gap-2 text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live on Devnet
                    </span>
                  </div>

                  <button
                    onClick={handleEnterArena}
                    className="relative w-full overflow-hidden rounded-2xl border border-emerald-400/50 bg-[linear-gradient(120deg,#22f2aa,rgba(34,242,170,0.3),#7c3aed,#22f2aa)] bg-[length:220%_220%] px-6 py-4 text-lg font-semibold text-slate-950 shadow-[0_20px_60px_rgba(34,242,170,0.35)] transition hover:scale-[1.02] hover:shadow-[0_25px_70px_rgba(124,58,237,0.4)]"
                    style={{ animation: "shine 8s linear infinite" }}
                  >
                    <span className="relative z-10">Launch Sol Arena</span>
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.22),transparent_35%)] opacity-60" />
                  </button>

                  <p className="text-sm text-white/70">
                    Connect your wallet, pick a side and feel the crowd. Host a
                    duel or back a champion.
                  </p>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        ◎
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                          House spread
                        </p>
                        <p className="font-semibold">2% flows from crowd</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">Arbiter · Judge</p>
                      <p className="font-semibold text-emerald-200">Claim 20%</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <LiveDuelCard />

              <motion.div
                className="flex items-center gap-3 text-sm text-white/60"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="uppercase tracking-[0.22em] text-xs">
                  Powered by Solana
                </span>
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </motion.div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Next duels spin up every minute. Bring your rival.
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <span className="font-semibold text-emerald-200">◎ DEVNET</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">sol.arena · crowd-first betting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
