"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getBetPDA, solToLamports } from "@/lib/anchorClient";
import * as anchor from "@coral-xyz/anchor";
import toast from "react-hot-toast";
import { useWalletConnection } from "@/lib/useWalletConnection";
import { debugPage } from "@/lib/debug";
import { motion } from "framer-motion";
import { saveBetMetadata } from "@/lib/betLocalMeta";

export default function CreateBet() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { statusLabel, status, ensureConnected } = useWalletConnection();

  const [formData, setFormData] = useState({
    headline: "",
    sideAName: "",
    sideBName: "",
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
      const userWalletPubkey = wallet.publicKey;

      if (!userWalletPubkey) {
        toast.error("Wallet not connected");
        return;
      }

      try {
        opponentPubkey = new PublicKey(formData.opponentAddress.trim());
        arbiterPubkey = formData.useOwnWalletAsArbiter
          ? userWalletPubkey
          : new PublicKey(formData.arbiterAddress.trim());
      } catch (err) {
        toast.error("Invalid address provided");
        return;
      }

      const userA = userWalletPubkey;
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

      // Optional video/demo metadata (local only)
      const subject =
        formData.headline.trim() ||
        `${formData.sideAName.trim() || "Side A"} x ${
          formData.sideBName.trim() || "Side B"
        }`;
      const sideAName = formData.sideAName.trim() || "Side A";
      const sideBName = formData.sideBName.trim() || "Side B";

      // Get PDAs
      const [betPda] = getBetPDA(arbiterPubkey, userA, userB);

      // Protocol treasury: use env if provided, otherwise creator wallet as fallback
      let protocolTreasury: PublicKey;
      try {
        const protocolTreasuryStr = (
          process.env.NEXT_PUBLIC_PROTOCOL_TREASURY || userWalletPubkey.toBase58()
        ).trim();
        protocolTreasury = new PublicKey(protocolTreasuryStr);
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

      debugPage.log("createBet args", {
        userA: userA?.toBase58?.(),
        userB: userB?.toBase58?.(),
        arbiter: arbiterPubkey?.toBase58?.(),
        stakeLamports: stakeLamports?.toString?.(),
        deadlineDuel: deadlineDuel?.toString?.(),
        deadlineCrowd: deadlineCrowd?.toString?.(),
        resolveTs: resolveTs?.toString?.(),
        spreadBps,
        creatorShareBps,
        arbiterShareBps,
        protocolShareBps,
        accounts: {
          payer: wallet.publicKey?.toBase58?.(),
          bet: betPda?.toBase58?.(),
          protocolTreasury: protocolTreasury?.toBase58?.(),
          systemProgram: SystemProgram.programId.toBase58(),
        },
      });

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

      toast.success(
        <span>
          Duel created.{" "}
          <a
            href={`https://solscan.io/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            View on Solscan
          </a>
        </span>
      );
      console.log("Transaction:", tx, "https://solscan.io/tx/" + tx + "?cluster=devnet");

      // Save local-only metadata for UI (not on-chain)
      try {
        saveBetMetadata(betPda.toBase58(), {
          subject,
          sideAName,
          sideBName,
        });
      } catch (metaErr) {
        console.warn("Could not persist local metadata", metaErr);
      }

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
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 shadow-[0_10px_30px_rgba(0,0,0,0.35)] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/60 transition-all outline-none";
  const labelClasses =
    "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 flex items-center gap-2";
  const battleWidths = ["44%", "52%", "47%"];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-25 animate-grid-flow" />
        <div className="absolute inset-0 bg-arena-noise opacity-45" />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -right-12 bottom-10 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/90" />
      </div>

      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 lg:pt-12 lg:pb-10 space-y-6">
        <section className="rounded-3xl border border-emerald-500/25 bg-slate-950/80 backdrop-blur-xl shadow-[0_16px_60px_rgba(0,0,0,0.5)] p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className={labelClasses}>Live preview</p>
              <h1 className="text-[28px] sm:text-[30px] font-display font-bold leading-tight">
                Two sides. One duel. Crowd pushing.
              </h1>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status === "connected"
                    ? "bg-emerald-400"
                    : status === "connecting"
                    ? "bg-amber-400"
                    : status === "error"
                    ? "bg-red-400"
                    : "bg-white/40"
                }`}
              />
              <span className="text-white/80">{statusLabel}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            <motion.div
              className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-slate-900/60 p-3.5 shadow-[0_12px_34px_rgba(18,247,196,0.22)]"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={labelClasses}>Challenger A</p>
                  <h3 className="text-xl font-semibold text-white">
                    Team Aurora
                  </h3>
                  <p className="text-sm text-white/70">46% · 2.4 SOL</p>
                </div>
                <div className="relative h-12 w-12">
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-60 blur-lg" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-slate-950/70 border border-emerald-300/50 text-lg font-semibold">
                    A
                  </div>
                  <motion.span
                    className="absolute inset-0 rounded-full border border-emerald-300/50"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                  animate={{ width: battleWidths }}
                  transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                />
              </div>
            </motion.div>

            <motion.div
              className="relative overflow-hidden rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-500/20 via-purple-500/8 to-slate-900/60 p-3.5 shadow-[0_12px_34px_rgba(116,91,230,0.28)]"
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 5.6, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-right">
                  <p className={labelClasses}>Challenger B</p>
                  <h3 className="text-xl font-semibold text-white">
                    Team Nebula
                  </h3>
                  <p className="text-sm text-white/70">54% · 2.9 SOL</p>
                </div>
                <div className="relative h-12 w-12">
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 to-fuchsia-400 opacity-60 blur-lg" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-slate-950/70 border border-purple-200/50 text-lg font-semibold">
                    B
                  </div>
                  <motion.span
                    className="absolute inset-0 rounded-full border border-purple-200/50"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.1, 0.35] }}
                    transition={{ repeat: Infinity, duration: 2.6, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-300 via-fuchsia-400 to-amber-300"
                  animate={{ width: battleWidths.map((w) => `${100 - parseFloat(w)}%`) }}
                  transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mt-1 relative h-3 rounded-full bg-slate-900/70 overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-purple-500"
                animate={{ width: battleWidths }}
                transition={{ repeat: Infinity, duration: 6.5, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tracking-[0.2em] text-white/80">
                VS
              </div>
            </div>
          </div>
        </section>

        <div className="w-full grid lg:grid-cols-[1.05fr_0.95fr] items-start gap-4 sm:gap-5">
          <section className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-4 shadow-[0_16px_60px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div className="space-y-1">
              <p className={labelClasses}>Arena setup</p>
              <h2 className="text-2xl sm:text-[26px] font-display font-bold leading-tight">
                Three steps, one duel.
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-2">
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-3 space-y-1">
                <p className={labelClasses}>Step 01</p>
                <p className="text-sm font-semibold text-white">
                  Set rival and stake.
                </p>
              </div>
              <div className="rounded-2xl border border-purple-400/25 bg-purple-500/5 p-3 space-y-1">
                <p className={labelClasses}>Step 02</p>
                <p className="text-sm font-semibold text-white">
                  Choose the arbiter.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3 space-y-1">
                <p className={labelClasses}>Step 03</p>
                <p className="text-sm font-semibold text-white">
                  Lock the clocks.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Wallet status</p>
                <p className="text-lg font-semibold">{statusLabel}</p>
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

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="text-sm text-white/70">
                Fixed spread: 2% from the crowd. Split: 50% creators · 20% arbiter · 30% protocol.
              </p>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-emerald-500/25 bg-slate-950/85 backdrop-blur-xl shadow-[0_16px_60px_rgba(0,0,0,0.45)] p-4 sm:p-5 grid gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className={labelClasses}>Duel ticket</p>
                <h3 className="text-xl sm:text-[24px] font-display font-bold leading-tight">
                  Fill it out and open the arena.
                </h3>
              </div>
              <div className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold">
                Live preview
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2 sm:col-span-2">
                <label className={labelClasses}>Subject / headline</label>
                <input
                  type="text"
                  maxLength={64}
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  placeholder="Optional: e.g. Aurora vs Nebula – best of three"
                  className={inputClasses}
                />
                <p className="text-[11px] text-white/50">
                  Frontend-only. Saved locally for the video; not stored on-chain.
                </p>
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Side labels</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={formData.sideAName}
                    onChange={(e) =>
                      setFormData({ ...formData, sideAName: e.target.value })
                    }
                    placeholder="Side A"
                    className={inputClasses}
                  />
                  <input
                    type="text"
                    maxLength={24}
                    value={formData.sideBName}
                    onChange={(e) =>
                      setFormData({ ...formData, sideBName: e.target.value })
                    }
                    placeholder="Side B"
                    className={inputClasses}
                  />
                </div>
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
              </div>
            </div>

            <div className="grid sm:grid-cols-[1.05fr_0.95fr] gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className={labelClasses}>Arbiter</p>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        useOwnWalletAsArbiter: !formData.useOwnWalletAsArbiter,
                      })
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                      formData.useOwnWalletAsArbiter
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                        : "border-white/20 bg-white/10 text-white/80 hover:border-emerald-300/40"
                    }`}
                  >
                    {formData.useOwnWalletAsArbiter
                      ? "Use my wallet"
                      : "Set arbiter"}
                  </button>
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

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <p className={labelClasses}>Crowd spread</p>
                  <div className="group relative">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white/80">
                      i
                    </span>
                    <div className="pointer-events-none absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 rounded-xl border border-white/15 bg-slate-950/95 px-3 py-2 text-xs text-white/80 shadow-lg backdrop-blur-sm group-hover:flex">
                      <div className="space-y-1">
                        <p>2% from crowd</p>
                        <p>50% to creators</p>
                        <p>20% to arbiter</p>
                        <p>30% to protocol</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <p className={labelClasses}>Duel timers</p>
                <span className="text-xs text-white/60">Hours</span>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
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
                  placeholder="Deposit"
                />
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
                  placeholder="Crowd open"
                />
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
                  placeholder="Resolve after"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !wallet.connected}
              className="w-full rounded-2xl border border-emerald-400/50 bg-[linear-gradient(120deg,#22f2aa,#7c3aed,#22f2aa)] bg-[length:220%_220%] px-4 py-3 text-lg font-semibold text-slate-950 shadow-[0_20px_60px_rgba(34,242,170,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ animation: "shine 9s linear infinite" }}
            >
              {loading
                ? "Launching duel..."
                : !wallet.connected
                ? "Connect to create"
                : "Open arena"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
