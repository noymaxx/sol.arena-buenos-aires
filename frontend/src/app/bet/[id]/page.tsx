"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function BetDetail() {
  const params = useParams();
  const router = useRouter();
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

  const loadBet = async () => {
    try {
      setLoading(true);
      const program = await getProgram(connection, wallet as any, true);
      // @ts-ignore
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

      // @ts-ignore - Anchor types issue
      const tx = await (program as any).methods
        .depositParticipant()
        .accounts({
          participant: wallet.publicKey,
          bet: betPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Deposit successful!");
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

      toast.success(`Bet on Side ${side} successful!`);
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

      toast.success(`Winner declared: Side ${side}!`);
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

      toast.success("Principal withdrawn!");
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

      toast.success("Reward claimed!");
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Bet not found</p>
      </div>
    );
  }

  const isResolved = "resolved" in bet.status;
  const isUserA = wallet.publicKey?.equals(bet.userA);
  const isUserB = wallet.publicKey?.equals(bet.userB);
  const isArbiter = wallet.publicKey?.equals(bet.arbiter);
  const now = Date.now() / 1000;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Duel #{betPubkey.toString().slice(0, 8)}
          </h1>
          <p className="text-gray-600">
            {bet.userA.toString().slice(0, 12)}... vs{" "}
            {bet.userB.toString().slice(0, 12)}...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Side A</h3>
            <p className="text-sm text-gray-600 mb-1">
              {bet.userA.toString().slice(0, 20)}...
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {lamportsToSol(bet.netSupportA).toFixed(2)} SOL
            </p>
            <p className="text-sm text-gray-500">Crowd support</p>
            {bet.userADeposited && (
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Deposited
              </span>
            )}
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Side B</h3>
            <p className="text-sm text-gray-600 mb-1">
              {bet.userB.toString().slice(0, 20)}...
            </p>
            <p className="text-2xl font-bold text-red-600">
              {lamportsToSol(bet.netSupportB).toFixed(2)} SOL
            </p>
            <p className="text-sm text-gray-500">Crowd support</p>
            {bet.userBDeposited && (
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Deposited
              </span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-4">Bet Details</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-600">Stake per side</dt>
              <dd className="font-semibold">{lamportsToSol(bet.stakeLamports).toFixed(2)} SOL</dd>
            </div>
            <div>
              <dt className="text-gray-600">Crowd fee</dt>
              <dd className="font-semibold">{(bet.spreadBps / 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-gray-600">Crowd deadline</dt>
              <dd className="font-semibold">
                {new Date(safeToNumber(bet.deadlineCrowd) * 1000).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Resolve time</dt>
              <dd className="font-semibold">
                {new Date(safeToNumber(bet.resolveTs) * 1000).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Deposit */}
          {(isUserA || isUserB) && !isResolved && (
            <div>
              {((isUserA && !bet.userADeposited) || (isUserB && !bet.userBDeposited)) && (
                <button
                  onClick={handleDeposit}
                  disabled={actionLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : `Deposit ${lamportsToSol(bet.stakeLamports).toFixed(2)} SOL`}
                </button>
              )}
            </div>
          )}

          {/* Support bet */}
          {!isResolved && bet.userADeposited && bet.userBDeposited && now < safeToNumber(bet.deadlineCrowd) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Place a bet</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSelectedSide("A")}
                  className={`flex-1 py-2 rounded ${
                    selectedSide === "A"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Side A
                </button>
                <button
                  onClick={() => setSelectedSide("B")}
                  className={`flex-1 py-2 rounded ${
                    selectedSide === "B"
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Side B
                </button>
              </div>
              <input
                type="number"
                value={supportAmount}
                onChange={(e) => setSupportAmount(e.target.value)}
                placeholder="Amount (SOL)"
                className="w-full px-4 py-2 border rounded mb-3"
                step="0.1"
                min="0.1"
              />
              <button
                onClick={() => handleSupport(selectedSide)}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : `Bet ${supportAmount} SOL on Side ${selectedSide}`}
              </button>
            </div>
          )}

          {/* Arbiter declare winner */}
          {isArbiter && !isResolved && now >= safeToNumber(bet.resolveTs) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Declare Winner</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeclareWinner("A")}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Side A Wins
                </button>
                <button
                  onClick={() => handleDeclareWinner("B")}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Side B Wins
                </button>
              </div>
            </div>
          )}

          {/* Winner status */}
          {isResolved && bet.winnerSide && (
            <div className="border-t pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold text-center">
                  Winner: Side {bet.winnerSide.a ? "A" : "B"}
                </p>
              </div>

              {/* Withdraw principal */}
              {((isUserA && bet.winnerSide.a) || (isUserB && bet.winnerSide.b)) && (
                <button
                  onClick={handleWithdrawPrincipal}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-2"
                >
                  {actionLoading ? "Processing..." : "Withdraw Principal (2x stake)"}
                </button>
              )}

              {/* Claim support */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleClaimSupport("A")}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Claim Side A
                </button>
                <button
                  onClick={() => handleClaimSupport("B")}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Claim Side B
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
