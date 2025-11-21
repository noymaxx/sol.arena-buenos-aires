"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getBetPDA, solToLamports } from "@/lib/anchorClient";
import * as anchor from "@coral-xyz/anchor";
import toast from "react-hot-toast";
import { useWalletConnection } from "@/lib/useWalletConnection";
import { debugPage } from "@/lib/debug";

export default function CreateBet() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { statusLabel, status, ensureConnected } = useWalletConnection();

  const [formData, setFormData] = useState({
    opponentAddress: "",
    arbiterAddress: "",
    useOwnWalletAsArbiter: true,
    stakeSOL: "1.0",
    hoursUntilDuelDeadline: "24",
    hoursUntilCrowdDeadline: "48",
    hoursUntilResolve: "72",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugPage.group('CreateBet handleSubmit');

    const ready = await ensureConnected();
    const fullyReady =
      ready &&
      wallet.publicKey &&
      wallet.signTransaction &&
      wallet.signAllTransactions;
    if (!fullyReady) {
      toast.error("Wallet not ready. Please reconnect.");
      return;
    }

    try {
      setLoading(true);

      // Validate inputs
      let opponentPubkey: PublicKey;
      let arbiterPubkey: PublicKey;
      try {
        opponentPubkey = new PublicKey(formData.opponentAddress.trim());
        arbiterPubkey = formData.useOwnWalletAsArbiter
          ? wallet.publicKey
          : new PublicKey(formData.arbiterAddress.trim());
      } catch (err) {
        toast.error("Invalid address provided");
        return;
      }

      const userA = wallet.publicKey;
      const userB = opponentPubkey;

      // Calculate timestamps
      const now = Math.floor(Date.now() / 1000);
      const hoursDuel = Number(formData.hoursUntilDuelDeadline);
      const hoursCrowd = Number(formData.hoursUntilCrowdDeadline);
      const hoursResolve = Number(formData.hoursUntilResolve);

      if (
        !Number.isFinite(hoursDuel) ||
        !Number.isFinite(hoursCrowd) ||
        !Number.isFinite(hoursResolve) ||
        hoursDuel <= 0 ||
        hoursCrowd <= 0 ||
        hoursResolve <= 0
      ) {
        toast.error("Deadlines must be positive numbers");
        return;
      }

      const deadlineDuel = new anchor.BN(now + Math.round(hoursDuel * 3600));
      const deadlineCrowd = new anchor.BN(
        now + Math.round(hoursCrowd * 3600)
      );
      const resolveTs = new anchor.BN(now + Math.round(hoursResolve * 3600));

      let stakeLamports: anchor.BN;
      try {
        debugPage.log('Converting SOL to lamports:', formData.stakeSOL);
        stakeLamports = solToLamports(formData.stakeSOL);
        debugPage.debugBN('stakeLamports', stakeLamports);
      } catch (err: any) {
        debugPage.error('Error converting SOL to lamports:', err);
        toast.error(err.message || "Invalid stake amount");
        debugPage.groupEnd();
        return;
      }

      debugPage.log('Checking if stakeLamports is valid...');
      if (!stakeLamports) {
        debugPage.error('stakeLamports is null/undefined');
        toast.error("Stake must be greater than zero");
        debugPage.groupEnd();
        return;
      }

      try {
        if (stakeLamports.isZero() || stakeLamports.isNeg()) {
          debugPage.error('stakeLamports is zero or negative');
          toast.error("Stake must be greater than zero");
          debugPage.groupEnd();
          return;
        }
      } catch (err) {
        debugPage.error('Error checking stakeLamports validity:', err);
        toast.error("Invalid stake amount");
        debugPage.groupEnd();
        return;
      }

      // Fee configuration (default values)
      const spreadBps = 200; // 2%
      const creatorShareBps = 5000; // 50%
      const arbiterShareBps = 2000; // 20%
      const protocolShareBps = 3000; // 30%

      // Get PDAs
      const [betPda] = getBetPDA(arbiterPubkey, userA, userB);

      // Protocol treasury: use env if provided, otherwise creator wallet as fallback
      let protocolTreasury: PublicKey;
      try {
        const protocolTreasuryStr =
          process.env.NEXT_PUBLIC_PROTOCOL_TREASURY ||
          wallet.publicKey.toBase58();
        protocolTreasury = new PublicKey(protocolTreasuryStr.trim());
      } catch (err) {
        toast.error("Invalid protocol treasury address");
        return;
      }

      const anchorWallet = wallet as unknown as anchor.Wallet;

      let program;
      try {
        program = await getProgram(connection, anchorWallet);
      } catch (err: any) {
        toast.error(err.message || "Wallet not ready");
        return;
      }

      const tx = await (program as any).methods
        .createBet(
          userA,
          userB,
          arbiterPubkey,
          stakeLamports,
          deadlineDuel,
          deadlineCrowd,
          resolveTs,
          spreadBps,
          creatorShareBps,
          arbiterShareBps,
          protocolShareBps
        )
        .accounts({
          payer: wallet.publicKey,
          bet: betPda,
          protocolTreasury,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Duel created successfully!");
      console.log("Transaction:", tx);

      // Redirect to bet page
      setTimeout(() => {
        router.push(`/bet/${betPda.toString()}`);
      }, 1000);
    } catch (error: any) {
      debugPage.error("Error creating bet:", error);
      toast.error(error.message || "Failed to create bet");
    } finally {
      setLoading(false);
      debugPage.groupEnd();
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60 transition-all outline-none";
  const labelClasses =
    "text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60";

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-20 animate-grid-flow" />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-12 bottom-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/90" />
      </div>

      <div className="relative min-h-screen max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-12 lg:py-16 flex items-center">
        <div className="w-full grid lg:grid-cols-[1.05fr_0.95fr] items-stretch gap-5 sm:gap-8">
          <section className="hidden lg:flex rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] flex-col gap-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-emerald-300/80 tracking-wide">
                Zero-scroll flow
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-[1.05]">
                Build your duel with clarity.
              </h1>
              <p className="text-base sm:text-lg text-white/70 max-w-2xl">
                Blocks are compact and zoomed, aligned for any screen with no
                scrolling needed.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                <p className={labelClasses}>Step 01</p>
                <p className="text-lg font-semibold text-white mt-1">
                  Set rival
                </p>
                <p className="text-sm text-white/60">
                  Opponent wallet and stake up front.
                </p>
              </div>
              <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
                <p className={labelClasses}>Step 02</p>
                <p className="text-lg font-semibold text-white mt-1">
                  Pick arbiter
                </p>
                <p className="text-sm text-white/60">
                  Use your wallet or choose another.
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className={labelClasses}>Step 03</p>
                <p className="text-lg font-semibold text-white mt-1">
                  Lock timelines
                </p>
                <p className="text-sm text-white/60">
                  Deposit, crowd, resolve side by side.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Wallet status</p>
                  <p className="text-lg font-semibold">
                    {statusLabel}
                  </p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    status === "connected"
                      ? "bg-emerald-400"
                      : status === "connecting"
                      ? "bg-amber-400"
                      : status === "error"
                      ? "bg-red-400"
                      : "bg-white/40"
                  } animate-pulse`}
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Zoom & responsive</p>
                  <p className="text-lg font-semibold">100% visible layout</p>
                </div>
                <div className="text-sm text-white/60">0 scroll</div>
              </div>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl shadow-[0_15px_60px_rgba(0,0,0,0.45)] p-5 sm:p-6 lg:p-7 grid gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={labelClasses}>Create duel</p>
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Fill in and fire the transaction.
                </h2>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold">
                Zoomed UX
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClasses}>Opponent wallet</label>
                <input
                  type="text"
                  required
                  value={formData.opponentAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, opponentAddress: e.target.value })
                  }
                  placeholder="e.g. 8hD...k9A"
                  className={inputClasses}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClasses}>Stake (SOL)</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={formData.stakeSOL}
                  onChange={(e) =>
                    setFormData({ ...formData, stakeSOL: e.target.value })
                  }
                  className={inputClasses}
                />
                <p className="text-xs text-white/60">
                  You and your opponent deposit the same amount.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className={labelClasses}>Arbiter</p>
                    <p className="text-sm text-white/70">
                      Control who can declare the winner.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.useOwnWalletAsArbiter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          useOwnWalletAsArbiter: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-white/30 bg-white/10 accent-emerald-500"
                    />
                    <span>Use my wallet</span>
                  </label>
                </div>
                {!formData.useOwnWalletAsArbiter && (
                  <input
                    type="text"
                    required
                    value={formData.arbiterAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, arbiterAddress: e.target.value })
                    }
                    placeholder="Arbiter wallet"
                    className={inputClasses}
                  />
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className={labelClasses}>Quick breakdown</p>
                <div className="mt-2 space-y-2 text-sm text-white/70">
                  <div className="flex items-center justify-between">
                    <span>Crowd spread</span>
                    <span className="font-semibold text-white">2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Creators</span>
                    <span className="font-semibold text-white">50%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Arbiter</span>
                    <span className="font-semibold text-white">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Protocol</span>
                    <span className="font-semibold text-white">30%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className={labelClasses}>Side-by-side timelines</p>
                <span className="text-xs text-white/60">hours</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80">
                    Deposit
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.hoursUntilDuelDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hoursUntilDuelDeadline: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className="text-xs text-white/60">
                    Time for both players to deposit.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80">
                    Crowd betting
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.hoursUntilCrowdDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hoursUntilCrowdDeadline: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className="text-xs text-white/60">
                    Window for the crowd to bet.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/80">
                    Resolve
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.hoursUntilResolve}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hoursUntilResolve: e.target.value,
                      })
                    }
                    className={inputClasses}
                  />
                  <p className="text-xs text-white/60">
                    When the arbiter can declare.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <p className={labelClasses}>Fee structure</p>
              <p className="text-sm text-white/70 mt-2">
                Crowd pays 2%. 50% to creators, 20% to the arbiter, 30% to the
                protocol.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !wallet.connected}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-3 text-lg font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-green-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : !wallet.connected
                ? "Connect your wallet"
                : "Create duel now"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
