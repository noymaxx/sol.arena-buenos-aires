"use client";

import React from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { lamportsToSol, safeToNumber } from "@/lib/anchorClient";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

interface BetCardProps {
  betPubkey: PublicKey;
  bet: any;
}

export function BetCard({ betPubkey, bet }: BetCardProps) {
  const wallet = useWallet();
  const supportA = bet?.netSupportA ? lamportsToSol(bet.netSupportA) : 0;
  const supportB = bet?.netSupportB ? lamportsToSol(bet.netSupportB) : 0;
  const totalCrowdPool = supportA + supportB;
  const oddA = supportA > 0 ? (totalCrowdPool / supportA).toFixed(2) : "—";
  const oddB = supportB > 0 ? (totalCrowdPool / supportB).toFixed(2) : "—";
  const stakeSOL = lamportsToSol(bet?.stakeLamports);
  const total = supportA + supportB || 1;
  const percentA = ((supportA / total) * 100).toFixed(1);
  const percentB = ((supportB / total) * 100).toFixed(1);

  const shorten = (value: any) => {
    if (!value) return "Unknown";
    const asString = value?.toBase58?.() || value?.toString?.() || String(value);
    return `${asString.slice(0, 4)}...${asString.slice(-3)}`;
  };

  const getStatus = () => {
    const statusField = bet?.status;
    if (!statusField) return "Open";
    if ("resolved" in statusField) return "Resolved";
    if ("cancelled" in statusField) return "Cancelled";

    const now = Date.now() / 1000;
    const hasDeposits = bet?.userADeposited && bet?.userBDeposited;
    const deadlineDuel = safeToNumber(bet?.deadlineDuel);
    const deadlineCrowd = safeToNumber(bet?.deadlineCrowd);
    const resolveTs = safeToNumber(bet?.resolveTs);

    if (!hasDeposits) {
      if (deadlineDuel && now >= deadlineDuel) return "Deposits closed";
      return "Awaiting deposits";
    }

    if (deadlineCrowd && now < deadlineCrowd) return "Crowd open";
    if (resolveTs && now < resolveTs) return "Awaiting arbiter";
    return "Open";
  };

  const statusMeta = () => {
    const status = getStatus();
    if (status === "Resolved")
      return {
        label: "Settled",
        dot: "bg-emerald-400",
        badge:
          "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
      };
    if (status === "Deposits closed")
      return {
        label: "Deposits closed",
        dot: "bg-red-400",
        badge: "border border-red-400/40 bg-red-500/10 text-red-100",
      };
    if (status === "Cancelled")
      return {
        label: "Cancelled",
        dot: "bg-red-400",
        badge: "border border-red-400/40 bg-red-500/10 text-red-100",
      };
    if (status === "Crowd open")
      return {
        label: "Crowd open",
        dot: "bg-purple-300",
        badge: "border border-purple-400/40 bg-purple-500/10 text-purple-100",
      };
    if (status === "Awaiting deposits")
      return {
        label: "Deposits open",
        dot: "bg-amber-300",
        badge: "border border-amber-300/40 bg-amber-500/10 text-amber-100",
      };
    if (status === "Awaiting arbiter")
      return {
        label: "Awaiting judge",
        dot: "bg-sky-300",
        badge: "border border-sky-300/40 bg-sky-500/10 text-sky-100",
      };
    return {
      label: "Arena open",
      dot: "bg-white/60",
      badge: "border border-white/20 bg-white/5 text-white/80",
    };
  };

  const formatCountdown = () => {
    const now = Date.now() / 1000;
    const closesAt = safeToNumber(bet?.deadlineCrowd);
    if (!closesAt) return "—";
    const diff = closesAt - now;
    if (diff <= 0) return "Window closed";
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
      2,
      "0"
    )}m`;
  };

  const meta = statusMeta();
  const duelNumber = betPubkey.toString().slice(0, 6);
  const minEntry = Math.max(0.01, Number((stakeSOL || 0) / 10)).toFixed(2);
  const roleBadge = useMemo(() => {
    if (!wallet.publicKey) return null;
    if (wallet.publicKey.equals(bet?.userA)) return { label: "You play (A)", tone: "from-emerald-400 to-emerald-200" };
    if (wallet.publicKey.equals(bet?.userB)) return { label: "You play (B)", tone: "from-purple-400 to-indigo-300" };
    if (wallet.publicKey.equals(bet?.arbiter)) return { label: "You arbitrate", tone: "from-sky-400 to-cyan-300" };
    return null;
  }, [wallet.publicKey, bet]);

  return (
    <Link
      href={`/bet/${betPubkey.toString()}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_15px_60px_rgba(0,0,0,0.4)] transition hover:-translate-y-1 hover:border-emerald-400/40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,242,170,0.08),transparent_32%),radial-gradient(circle_at_80%_60%,rgba(124,58,237,0.08),transparent_30%)] opacity-80" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full shadow-[0_0_12px_rgba(34,242,170,0.5)] ${meta.dot}`}
            />
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>
          <span className="text-xs text-white/50 font-mono">
            #{duelNumber}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-white/50">Challenger A</p>
            <p className="text-lg font-semibold text-white">
              {shorten(bet?.userA)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs font-semibold uppercase tracking-wide text-white/80">
              VS
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">Challenger B</p>
            <p className="text-lg font-semibold text-purple-100">
              {shorten(bet?.userB)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 flex items-center gap-2 text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            {percentA}% · {oddA}x
          </div>
          <div className="rounded-xl border border-purple-400/25 bg-purple-500/10 px-3 py-2 flex items-center justify-end gap-2 text-purple-100">
            {oddB}x · {percentB}%
            <span className="h-2 w-2 rounded-full bg-purple-300" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-1 h-2.5 rounded-full overflow-hidden bg-white/10">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-200"
              style={{ width: `${percentA}%` }}
            />
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
              style={{ width: `${percentB}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>Arbiter: {shorten(bet?.arbiter)}</span>
            <span>Crowd closes in {formatCountdown()}</span>
          </div>
        </div>

        {roleBadge && (
          <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${roleBadge.tone} px-3 py-1 text-xs font-semibold text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)]`}>
            ◎ {roleBadge.label}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
              Stake
            </p>
            <p className="font-semibold text-white">
              {stakeSOL.toFixed(2)} ◎ each
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
              Crowd pool
            </p>
            <p className="font-semibold text-emerald-200">
              {totalCrowdPool.toFixed(2)} ◎
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/bet/${betPubkey.toString()}?side=A#book`}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-100 shadow-[0_10px_30px_rgba(34,242,170,0.2)] transition group-hover:shadow-[0_15px_40px_rgba(34,242,170,0.28)]"
          >
            Back {shorten(bet?.userA)}
          </Link>
          <Link
            href={`/bet/${betPubkey.toString()}?side=B#book`}
            className="rounded-xl border border-purple-400/40 bg-purple-500/15 px-4 py-3 text-center text-sm font-semibold text-purple-50 shadow-[0_10px_30px_rgba(124,58,237,0.2)] transition group-hover:shadow-[0_15px_40px_rgba(124,58,237,0.3)]"
          >
            Back {shorten(bet?.userB)}
          </Link>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            From {minEntry} ◎ · min slip
          </span>
          <span className="text-white/60">Tap to open duel</span>
        </div>

        {bet?.winnerSide && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-sm font-semibold text-emerald-200">
              Winner: Side {bet.winnerSide.a ? "A" : "B"}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
