"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BetCard } from "@/components/BetCard";
import { getProgram } from "@/lib/anchorClient";
import * as anchor from "@coral-xyz/anchor";

export default function MyBets() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [myDuels, setMyDuels] = useState<any[]>([]);
  const [myCrowdBets, setMyCrowdBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Get bets for my support positions
      const supportBetPubkeys = mySupports.map((s: any) => s.account.bet);
      const supportBets = allBets.filter((bet: any) =>
        supportBetPubkeys.some((pubkey: any) => pubkey.equals(bet.publicKey))
      );

      setMyCrowdBets(supportBets);
    } catch (error) {
      console.error("Error loading bets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">
          Please connect your wallet to view your bets
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">My Bets</h1>

      {/* My Duels */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          My Duels
        </h2>
        <p className="text-gray-600 mb-6">
          Duels where you're a participant or arbiter
        </p>

        {myDuels.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created or participated in any duels yet</p>
            <a
              href="/create"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Create Your First Duel
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* My Crowd Bets */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          My Crowd Bets
        </h2>
        <p className="text-gray-600 mb-6">
          Duels where you've placed crowd bets
        </p>

        {myCrowdBets.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't placed any crowd bets yet</p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Explore Duels
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCrowdBets.map((bet) => (
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
  );
}
