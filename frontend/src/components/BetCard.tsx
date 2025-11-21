"use client";

import React from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { lamportsToSol, safeToNumber } from "@/lib/anchorClient";

interface BetCardProps {
  betPubkey: PublicKey;
  bet: any;
}

export function BetCard({ betPubkey, bet }: BetCardProps) {
  const supportA = bet?.netSupportA ? lamportsToSol(bet.netSupportA) : 0;
  const supportB = bet?.netSupportB ? lamportsToSol(bet.netSupportB) : 0;
  const totalCrowdPool = supportA + supportB;
  const stakeSOL = lamportsToSol(bet?.stakeLamports);

  const total = supportA + supportB || 1;
  const percentA = ((supportA / total) * 100).toFixed(1);
  const percentB = ((supportB / total) * 100).toFixed(1);

  const getStatus = () => {
    if ("resolved" in bet.status) return "Resolved";
    if ("cancelled" in bet.status) return "Cancelled";

    const now = Date.now() / 1000;
    if (bet?.deadlineDuel && now < safeToNumber(bet.deadlineDuel)) {
      return "Awaiting deposits";
    } else if (bet?.deadlineCrowd && now < safeToNumber(bet.deadlineCrowd)) {
      return "Crowd open";
    } else if (bet?.resolveTs && now < safeToNumber(bet.resolveTs)) {
      return "Awaiting arbiter";
    }
    return "Open";
  };

  return (
    <Link href={`/bet/${betPubkey.toString()}`}>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 cursor-pointer shadow-[0_15px_60px_rgba(0,0,0,0.35)] hover:border-emerald-400/30 transition">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              sol.arena #{betPubkey.toString().slice(0, 8)}
            </h3>
            <p className="text-sm text-white/60">
              {bet?.userA?.toString()?.slice(0, 8) || "Unknown"} vs{" "}
              {bet?.userB?.toString()?.slice(0, 8) || "Unknown"}
            </p>
          </div>
          {(() => {
            const status = getStatus();
            const badge =
              status === "Resolved"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40"
                : status === "Crowd open"
                ? "bg-purple-500/15 text-purple-100 border border-purple-400/40"
                : "bg-amber-400/15 text-amber-100 border border-amber-300/40";
            return (
          <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}
          >
              {status}
          </span>
            );
          })()}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">Stake</span>
              <span className="font-semibold text-white">
                {stakeSOL.toFixed(2)} SOL each
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">Crowd Pool</span>
              <span className="font-semibold text-white">
                {totalCrowdPool.toFixed(2)} SOL
              </span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/10">
              <div className="bg-gradient-to-r from-emerald-400 to-green-500" style={{ width: `${percentA}%` }} />
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${percentB}%` }} />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Side A: {percentA}%</span>
              <span>Side B: {percentB}%</span>
            </div>
          </div>

          {bet?.winnerSide && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-sm font-semibold text-emerald-200">
                Winner: Side {bet.winnerSide.a ? "A" : "B"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
