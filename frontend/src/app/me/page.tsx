"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BetCard } from "@/components/BetCard";
import { getProgram, lamportsToSol, safeToNumber, getSupportPositionPDA } from "@/lib/anchorClient";
import { PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";

type CrowdPosition = {
  pubkey: PublicKey;
  side: "A" | "B";
  bet: any;
  betPubkey: PublicKey;
  claimed: boolean;
  claimable: boolean;
  winner?: "A" | "B";
  netAmount: number;
};

export default function MyBets() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [myDuels, setMyDuels] = useState<any[]>([]);
  const [crowdPositions, setCrowdPositions] = useState<CrowdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadMyBets();
    }
  }, [wallet.connected, wallet.publicKey, connection]);

  const loadMyBets = async () => {
    if (!wallet.publicKey) return;

    try {
      setLoading(true);
      const program = await getProgram(connection, wallet as any);

      // Load all bets
      // @ts-ignore
      const allBets = await program.account.bet.all();
      const betsByPk: Record<string, any> = {};
      allBets.forEach((b: any) => (betsByPk[b.publicKey.toBase58()] = b));

      // Filter duels where user is participant or arbiter
      const duels = allBets.filter(
        (bet: any) =>
          bet.account.userA.equals(wallet.publicKey!) ||
          bet.account.userB.equals(wallet.publicKey!) ||
          bet.account.arbiter.equals(wallet.publicKey!)
      );
      setMyDuels(duels);

      // Load support positions
      // @ts-ignore
      const allSupports = await program.account.supportPosition.all();
      const mySupports = allSupports.filter((support: any) =>
        support.account.bettor.equals(wallet.publicKey!)
      );

      const positions: CrowdPosition[] = mySupports.map((support: any) => {
        const bet = betsByPk[support.account.bet.toBase58()];
        const side = support.account.side?.a !== undefined ? "A" : "B";
        const winner = bet?.account?.winnerSide
          ? bet.account.winnerSide.a
            ? "A"
            : bet.account.winnerSide.b
            ? "B"
            : undefined
          : undefined;
        const resolved = bet?.account?.status && "resolved" in bet.account.status;
        const claimable = resolved && !support.account.claimed;
        return {
          pubkey: support.publicKey,
          betPubkey: support.account.bet,
          bet,
          side,
          claimed: support.account.claimed,
          claimable,
          winner,
          netAmount: lamportsToSol(support.account.netAmount || 0),
        };
      });

      setCrowdPositions(positions);
    } catch (error) {
      console.error("Error loading bets:", error);
      toast.error("Failed to load your arena data");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSupport = async (pos: CrowdPosition) => {
    if (!wallet.publicKey) return;
    try {
      setClaiming(pos.pubkey.toBase58());
      const program = await getProgram(connection, wallet as any);
      const [supportPositionPda] = getSupportPositionPDA(
        pos.betPubkey,
        wallet.publicKey,
        pos.side
      );

      const tx = await (program as any).methods
        .claimSupport()
        .accounts({
          bettor: wallet.publicKey,
          bet: pos.betPubkey,
          supportPosition: supportPositionPda,
        })
        .rpc();

      toast.success(
        <span>
          Support claimed.{" "}
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
      await loadMyBets();
    } catch (error: any) {
      console.error("Claim error:", error);
      toast.error(error?.message || "Failed to claim");
    } finally {
      setClaiming(null);
    }
  };

  const renderCrowdCard = (pos: CrowdPosition) => {
    const status = pos.bet?.account?.status;
    const marketClosed = status && ("resolved" in status || "cancelled" in status);
    const deadlineCrowd = safeToNumber(pos.bet?.account?.deadlineCrowd);
    const now = Date.now() / 1000;
    const countdown =
      deadlineCrowd > now
        ? `${Math.max(0, Math.floor((deadlineCrowd - now) / 60))}m left`
        : marketClosed
        ? "Settled"
        : "Awaiting judge";

    return (
      <div
        key={pos.pubkey.toBase58()}
        className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-[0.2em] text-white/60">
            Support · Side {pos.side}
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
            {countdown}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">
              Bet #{pos.betPubkey.toBase58().slice(0, 8)}
            </p>
            <p className="text-lg font-semibold text-white">
              {pos.netAmount.toFixed(2)} ◎ entered
            </p>
          </div>
          <a
            href={`/bet/${pos.betPubkey.toBase58()}`}
            className="text-sm text-emerald-200 underline"
          >
            View bet
          </a>
        </div>
        {pos.winner && (
          <p className="mt-1 text-xs text-white/60">
            Winner: Side {pos.winner}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <button
            onClick={() => handleClaimSupport(pos)}
            disabled={!pos.claimable || claiming === pos.pubkey.toBase58()}
            className={`rounded-xl px-4 py-3 font-semibold transition ${
              pos.claimable
                ? "bg-gradient-to-r from-emerald-400 to-purple-400 text-slate-950 shadow-[0_12px_40px_rgba(124,58,237,0.35)] hover:scale-[1.01]"
                : "bg-white/5 text-white/60 border border-white/10"
            }`}
          >
            {claiming === pos.pubkey.toBase58()
              ? "Claiming..."
              : pos.claimable
              ? "Claim payout"
              : pos.claimed
              ? "Already claimed"
              : "Awaiting resolution"}
          </button>
          <a
            href={`/bet/${pos.betPubkey.toBase58()}?side=${pos.side}#book`}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center font-semibold text-white/80 hover:border-emerald-300/40 hover:text-white transition"
          >
            Add more on side {pos.side}
          </a>
        </div>
      </div>
    );
  };

  if (!wallet.connected) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-arena-gradient" />
          <div className="absolute inset-0 bg-arena-grid bg-grid opacity-25 animate-grid-flow" />
          <div className="absolute inset-0 bg-arena-noise opacity-40" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
          <p className="text-3xl font-display font-bold">Connect to view your arena</p>
          <p className="text-white/70">
            Link your wallet to see duels you play, arbitrate, or back as crowd.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-arena-gradient" />
        <div className="absolute inset-0 bg-arena-grid bg-grid opacity-20 animate-grid-flow" />
        <div className="absolute inset-0 bg-arena-noise opacity-35" />
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-16 bottom-12 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.26em] text-white/60">
              Your arena profile
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold">
              Positions & duels
            </h1>
          </div>
          <a
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-purple-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(124,58,237,0.35)]"
          >
            Host a duel
          </a>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.45)] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                Your duels
              </p>
              <h2 className="text-2xl font-semibold text-white">Players & judges</h2>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              {myDuels.length} active
            </span>
          </div>

          {myDuels.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 text-sm">
              You are not playing or arbitrating any duels yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myDuels.map((bet) => (
                <BetCard
                  key={bet.publicKey.toString()}
                  betPubkey={bet.publicKey}
                  bet={bet.account}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_18px_70px_rgba(0,0,0,0.45)] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                Crowd positions
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Your prediction tickets
              </h2>
            </div>
            <span className="rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-100">
              {crowdPositions.length} positions
            </span>
          </div>

          {crowdPositions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70 text-sm">
              You haven&apos;t backed any duels yet. Jump to the arena feed to enter the book.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {crowdPositions.map(renderCrowdCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
