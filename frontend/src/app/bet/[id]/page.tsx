"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getProgram,
  lamportsToSol,
  solToLamports,
  getSupportPositionPDA,
  safeToNumber,
} from "@/lib/anchorClient";
import toast from "react-hot-toast";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function BetDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [bet, setBet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [supportAmount, setSupportAmount] = useState("0.5");
  const [selectedSide, setSelectedSide] = useState<"A" | "B">("A");

  const betPubkey = new PublicKey(params?.id as string);

  useEffect(() => {
    loadBet();
  }, [params?.id, connection]);

  useEffect(() => {
    const sideParam = searchParams?.get("side");
    if (sideParam === "A" || sideParam === "B") {
      setSelectedSide(sideParam);
    }
  }, [searchParams]);

  const loadBet = async () => {
    try {
      setLoading(true);
      const program = await getProgram(connection, wallet as any, true);
      // @ts-ignore - anchor type inference
      const betAccount = await program.account.bet.fetch(betPubkey);
      setBet(betAccount);
    } catch (error) {
      console.error("Error loading bet:", error);
      toast.error("Failed to load bet");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setActionLoading(true);
      const program = await getProgram(connection, wallet as any);

      const tx = await (program as any).methods
        .depositParticipant()
        .accounts({
          participant: wallet.publicKey,
          bet: betPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(
        <span>
          Deposit successful.{" "}
          <a
            href={`https://solscan.io/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            View tx
          </a>
        </span>
      );
      await loadBet();
    } catch (error: any) {
      console.error("Error depositing:", error);
      toast.error(error.message || "Failed to deposit");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSupport = async (side: "A" | "B") => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setActionLoading(true);
      const program = await getProgram(connection, wallet as any);
      let amount: any;
      try {
        amount = solToLamports(supportAmount);
      } catch (err: any) {
        toast.error(err?.message || "Invalid amount");
        setActionLoading(false);
        return;
      }

      const [supportPositionPda] = getSupportPositionPDA(
        betPubkey,
        wallet.publicKey,
        side
      );

      const sideEnum = side === "A" ? { a: {} } : { b: {} };

      const tx = await (program as any).methods
        .supportBet(sideEnum, amount)
        .accounts({
          bettor: wallet.publicKey,
          bet: betPubkey,
          supportPosition: supportPositionPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(
        <span>
          Entered Side {side}.{" "}
          <a
            href={`https://solscan.io/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            View tx
          </a>
        </span>
      );
      await loadBet();
    } catch (error: any) {
      console.error("Error supporting:", error);
      toast.error(error.message || "Failed to place bet");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclareWinner = async (side: "A" | "B") => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!bet?.userADeposited || !bet?.userBDeposited) {
      toast.error("Both players must deposit before declaring a winner.");
      return;
    }

    try {
      setActionLoading(true);
      const program = await getProgram(connection, wallet as any);
      const sideEnum = side === "A" ? { a: {} } : { b: {} };

      const tx = await (program as any).methods
        .declareWinner(sideEnum)
        .accounts({
          arbiter: wallet.publicKey,
          bet: betPubkey,
        })
        .rpc();

      toast.success(
        <span>
          Winner: Side {side}.{" "}
          <a
            href={`https://solscan.io/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            View tx
          </a>
        </span>
      );
      await loadBet();
    } catch (error: any) {
      console.error("Error declaring winner:", error);
      toast.error(error.message || "Failed to declare winner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawPrincipal = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setActionLoading(true);
      const program = await getProgram(connection, wallet as any);

      const tx = await (program as any).methods
        .withdrawPrincipal()
        .accounts({
          winner: wallet.publicKey,
          bet: betPubkey,
        })
        .rpc();

      toast.success(
        <span>
          Principal withdrawn.{" "}
          <a
            href={`https://solscan.io/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            View tx
          </a>
        </span>
      );
      await loadBet();
    } catch (error: any) {
      console.error("Error withdrawing:", error);
      toast.error(error.message || "Failed to withdraw");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimSupport = async (side: "A" | "B") => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setActionLoading(true);
      const program = await getProgram(connection, wallet as any);

      const [supportPositionPda] = getSupportPositionPDA(
        betPubkey,
        wallet.publicKey,
        side
      );

      const tx = await (program as any).methods
        .claimSupport()
        .accounts({
          bettor: wallet.publicKey,
          bet: betPubkey,
          supportPosition: supportPositionPda,
        })
        .rpc();

      toast.success(
        <span>
          Reward claimed.{" "}
          <a
            href={`https://solscan.io/tx/${tx}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            View tx
          </a>
        </span>
      );
      await loadBet();
    } catch (error: any) {
      console.error("Error claiming:", error);
      toast.error(error.message || "Failed to claim");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-white/70">
        <p>Bet not found</p>
      </div>
    );
  }

  const isResolved = "resolved" in bet.status;
  const isCancelled = "cancelled" in bet.status;
  const isUserA = wallet.publicKey?.equals(bet.userA);
  const isUserB = wallet.publicKey?.equals(bet.userB);
  const isArbiter = wallet.publicKey?.equals(bet.arbiter);
  const now = Date.now() / 1000;

  const supportA = lamportsToSol(bet.netSupportA || 0);
  const supportB = lamportsToSol(bet.netSupportB || 0);
  const totalSupport = supportA + supportB;
  const oddA = supportA > 0 ? (totalSupport / supportA).toFixed(2) : "—";
  const oddB = supportB > 0 ? (totalSupport / supportB).toFixed(2) : "—";
  const stakeSOL = lamportsToSol(bet.stakeLamports || 0);
  const percentA = totalSupport
    ? Math.round((supportA / totalSupport) * 100)
    : 50;
  const percentB = 100 - percentA;

  const duelDepositOpen =
    !isResolved &&
    !isCancelled &&
    now < safeToNumber(bet.deadlineDuel);
  const depositClosed =
    (!bet.userADeposited || !bet.userBDeposited) &&
    now >= safeToNumber(bet.deadlineDuel);
  const marketOpen =
    bet.userADeposited &&
    bet.userBDeposited &&
    !isResolved &&
    !isCancelled &&
    now < safeToNumber(bet.deadlineCrowd);
  const awaitingArbiter =
    !isResolved &&
    !isCancelled &&
    bet.userADeposited &&
    bet.userBDeposited &&
    now >= safeToNumber(bet.deadlineCrowd) &&
    now < safeToNumber(bet.resolveTs);
  const resolveReady =
    isArbiter &&
    !isResolved &&
    !isCancelled &&
    bet.userADeposited &&
    bet.userBDeposited &&
    now >= safeToNumber(bet.resolveTs);

  const formatDate = (ts?: any) =>
    ts ? new Date(safeToNumber(ts) * 1000).toLocaleString() : "—";

  const formatCountdown = (target?: any) => {
    if (!target) return "—";
    const diff = safeToNumber(target) - now;
    if (diff <= 0) return "Closed";
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
      2,
      "0"
    )}m`;
  };

  const statusMeta = () => {
    if (isCancelled)
      return {
        label: "Cancelled",
        badge: "border-red-400/40 bg-red-500/10 text-red-100",
        dot: "bg-red-400",
        desc: "This duel was cancelled",
      };
    if (isResolved)
      return {
        label: "Settled",
        badge: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
        dot: "bg-emerald-400",
        desc: "Crowd market closed",
      };
    if (!bet.userADeposited || !bet.userBDeposited)
      return {
        label: depositClosed ? "Deposits closed" : "Awaiting deposits",
        badge: depositClosed
          ? "border-red-400/40 bg-red-500/10 text-red-100"
          : "border-amber-300/40 bg-amber-500/10 text-amber-100",
        dot: depositClosed ? "bg-red-400" : "bg-amber-300",
        desc: depositClosed
          ? "Deposit window ended before both players posted stake"
          : "Players need to post stakes",
      };
    if (marketOpen)
      return {
        label: "Crowd open",
        badge: "border-purple-400/40 bg-purple-500/10 text-purple-100",
        dot: "bg-purple-300",
        desc: "Prediction market live",
      };
    if (awaitingArbiter)
      return {
        label: "Awaiting judge",
        badge: "border-sky-300/40 bg-sky-500/10 text-sky-100",
        dot: "bg-sky-300",
        desc: "Crowd closed, waiting resolution",
      };
    return {
      label: "Open",
      badge: "border-white/20 bg-white/5 text-white/80",
      dot: "bg-white/60",
      desc: "On-chain duel live",
    };
  };

  const meta = statusMeta();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-gradient" />
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-25 animate-grid-flow" />
        <div className="absolute inset-0 bg-arena-noise opacity-50" />
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-10 bottom-24 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <Breadcrumbs />

        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/80 transition hover:border-emerald-400/40 hover:text-white"
          >
            ← Back to arena
          </button>
          <span className="text-white/40">•</span>
          <span className="font-mono text-white/80">
            #{betPubkey.toString().slice(0, 8)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.5)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,242,170,0.08),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,0.12),transparent_30%)] opacity-80" />

            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
                    Duel overview
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                    Duel #{betPubkey.toString().slice(0, 8)}
                  </h1>
                  <p className="text-white/70">
                    {bet.userA.toString().slice(0, 12)}... vs{" "}
                    {bet.userB.toString().slice(0, 12)}...
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${meta.dot}`}
                    />
                    {meta.label}
                  </span>
                  <p className="text-xs text-white/60">{meta.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-[0_10px_40px_rgba(34,242,170,0.18)]">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-white/5" />
                  <div className="relative space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                      Side A
                      {bet.userADeposited && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-100 border border-emerald-400/40">
                          Deposited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-50">
                      {bet.userA.toString().slice(0, 20)}...
                    </p>
                    <p className="text-2xl font-semibold text-emerald-100">
                      {oddA}x
                    </p>
                    <p className="text-xs text-emerald-100/80">
                      Crowd backing · {percentA}% share · pool {supportA.toFixed(2)} ◎
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-purple-400/35 bg-purple-500/10 p-4 shadow-[0_10px_40px_rgba(124,58,237,0.22)]">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-white/5" />
                  <div className="relative space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-purple-100">
                      Side B
                      {bet.userBDeposited && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-100 border border-purple-300/40">
                          Deposited
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-purple-100">
                      {bet.userB.toString().slice(0, 20)}...
                    </p>
                    <p className="text-2xl font-semibold text-purple-100">
                      {oddB}x
                    </p>
                    <p className="text-xs text-purple-100/80">
                      Crowd backing · {percentB}% share · pool {supportB.toFixed(2)} ◎
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Prediction market pool</span>
                  <span className="font-semibold text-white">
                    {totalSupport.toFixed(2)} ◎ total
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-200"
                    style={{ width: `${percentA}%` }}
                  />
                  <div
                    className="absolute right-0 top-0 h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    style={{ width: `${percentB}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Side A crowd · {supportA.toFixed(2)} ◎</span>
                  <span>Side B crowd · {supportB.toFixed(2)} ◎</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                    Stake per side
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {stakeSOL.toFixed(2)} ◎
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                    Crowd fee
                  </p>
                  <p className="text-lg font-semibold text-emerald-200">
                    {(bet.spreadBps / 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                    Crowd closes
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {formatCountdown(bet.deadlineCrowd)}
                  </p>
                  <p className="text-xs text-white/50">
                    {formatDate(bet.deadlineCrowd)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                    Resolve by
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {formatCountdown(bet.resolveTs)}
                  </p>
                  <p className="text-xs text-white/50">
                    {formatDate(bet.resolveTs)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div
              id="book"
              className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-slate-950/80 p-6 shadow-[0_15px_60px_rgba(0,0,0,0.45)] scroll-mt-24"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,242,170,0.12),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(124,58,237,0.12),transparent_30%)] opacity-70" />
              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                      Prediction market
                    </p>
                    <h3 className="text-2xl font-semibold text-white">
                      Enter the book
                    </h3>
                    <p className="text-sm text-white/60">
                      Pick your side and back it with SOL while the crowd
                      window is open.
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                </div>

                {isCancelled ? (
                  <div className="rounded-2xl border border-red-400/40 bg-red-500/15 p-4 text-red-100">
                    <p className="text-sm font-semibold">
                      Duel cancelled
                    </p>
                    <p className="text-xs text-red-100/80">
                      Prediction market and payouts are disabled for cancelled
                      duels.
                    </p>
                  </div>
                ) : !bet.userADeposited || !bet.userBDeposited ? (
                  <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-50">
                    <p className="text-sm font-semibold">
                      Awaiting player stakes
                    </p>
                    <p className="text-sm text-amber-100/80">
                      Both challengers must deposit {stakeSOL.toFixed(2)} ◎
                      each before the crowd market opens.
                    </p>
                    {!duelDepositOpen && (
                      <p className="mt-2 text-xs text-red-100/80">
                        Deposit window closed.
                      </p>
                    )}
                    {(isUserA && !bet.userADeposited) ||
                    (isUserB && !bet.userBDeposited) ? (
                      <button
                        onClick={handleDeposit}
                        disabled={actionLoading || !duelDepositOpen}
                        className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-purple-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(124,58,237,0.35)] transition hover:scale-[1.01] disabled:opacity-60"
                      >
                        {actionLoading
                          ? "Processing..."
                          : `Deposit ${stakeSOL.toFixed(2)} ◎ now`}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-amber-100/70">
                        Connect as a player wallet to post your stake.
                      </p>
                    )}
                  </div>
                ) : marketOpen ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
                      <button
                        onClick={() => setSelectedSide("A")}
                        className={`rounded-xl border px-4 py-3 transition ${
                          selectedSide === "A"
                            ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100 shadow-[0_10px_30px_rgba(34,242,170,0.18)]"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-emerald-300/40 hover:text-white"
                        }`}
                      >
                        Back Side A
                      </button>
                      <button
                        onClick={() => setSelectedSide("B")}
                        className={`rounded-xl border px-4 py-3 transition ${
                          selectedSide === "B"
                            ? "border-purple-400/60 bg-purple-500/20 text-purple-100 shadow-[0_10px_30px_rgba(124,58,237,0.18)]"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-purple-300/40 hover:text-white"
                        }`}
                      >
                        Back Side B
                      </button>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <label className="text-xs uppercase tracking-[0.16em] text-white/50">
                        Amount (SOL)
                      </label>
                      <input
                        type="number"
                        value={supportAmount}
                        onChange={(e) => setSupportAmount(e.target.value)}
                        min="0.1"
                        step="0.1"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white shadow-inner focus:border-emerald-400 focus:outline-none"
                        placeholder="0.50"
                      />
                      <p className="mt-2 text-xs text-white/60">
                        Market closes in {formatCountdown(bet.deadlineCrowd)}.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSupport(selectedSide)}
                      disabled={actionLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-white to-purple-500 px-5 py-3 text-slate-950 font-semibold shadow-[0_15px_50px_rgba(124,58,237,0.35)] transition hover:scale-[1.01] disabled:opacity-60"
                    >
                      {actionLoading
                        ? "Processing..."
                        : `Enter ${supportAmount} ◎ on Side ${selectedSide}`}
                    </button>
                  </div>
                ) : isResolved ? (
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-emerald-50">
                    <p className="text-sm font-semibold">
                      Market settled · winner declared
                    </p>
                    <p className="text-xs text-emerald-100/70">
                      Use the payout section below to withdraw principal or
                      claim crowd rewards.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">
                      Crowd window closed
                    </p>
                    <p className="text-xs text-white/60">
                      Awaiting resolution by arbiter at {formatDate(bet.resolveTs)}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {isArbiter &&
              !isResolved &&
              !isCancelled &&
              now >= safeToNumber(bet.resolveTs) && (
              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6 shadow-[0_12px_45px_rgba(124,58,237,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Judge desk
                    </p>
                    <h4 className="text-xl font-semibold text-white">
                      Declare winner
                    </h4>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {resolveReady ? "Resolve window open" : "Awaiting deposits"}
                  </span>
                </div>
                {!bet.userADeposited || !bet.userBDeposited ? (
                  <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-500/15 px-4 py-3 text-xs text-amber-100">
                    Both players must deposit before you can declare a winner.
                  </div>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDeclareWinner("A")}
                    disabled={actionLoading || !resolveReady}
                    className="rounded-xl border border-emerald-300/50 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-[0_10px_30px_rgba(34,242,170,0.18)] transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {actionLoading ? "Processing..." : "Side A wins"}
                  </button>
                  <button
                    onClick={() => handleDeclareWinner("B")}
                    disabled={actionLoading || !resolveReady}
                    className="rounded-xl border border-purple-300/50 bg-purple-500/25 px-4 py-3 text-sm font-semibold text-purple-50 shadow-[0_10px_30px_rgba(124,58,237,0.2)] transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {actionLoading ? "Processing..." : "Side B wins"}
                  </button>
                </div>
              </div>
            )}

            {isResolved && bet.winnerSide && (
              <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_12px_45px_rgba(34,242,170,0.25)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/80">
                      Payouts live
                    </p>
                    <h4 className="text-xl font-semibold text-emerald-50">
                      Winner: Side {bet.winnerSide.a ? "A" : "B"}
                    </h4>
                  </div>
                  <div className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-50">
                    Claim rewards
                  </div>
                </div>

                {((isUserA && bet.winnerSide.a) ||
                  (isUserB && bet.winnerSide.b)) && (
                  <button
                    onClick={handleWithdrawPrincipal}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 px-4 py-3 text-slate-950 font-semibold shadow-[0_12px_40px_rgba(34,242,170,0.25)] transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {actionLoading
                      ? "Processing..."
                      : "Withdraw principal (2x stake)"}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleClaimSupport("A")}
                    disabled={actionLoading}
                    className="rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {actionLoading ? "Processing..." : "Claim Side A"}
                  </button>
                  <button
                    onClick={() => handleClaimSupport("B")}
                    disabled={actionLoading}
                    className="rounded-xl border border-purple-300/40 bg-purple-500/20 px-4 py-3 text-sm font-semibold text-purple-50 transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {actionLoading ? "Processing..." : "Claim Side B"}
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">Explore more markets</p>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(34,242,170,0.8)]" />
              </div>
              <p className="mt-1 text-white/60">
                Jump back to the arena feed to enter other prediction markets.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:scale-[1.01] transition"
                >
                  Browse live bets
                </a>
                <a
                  href="/create"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:scale-[1.01] transition"
                >
                  Host a duel
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
