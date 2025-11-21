  import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { DuelCrowdBets } from "./types/duel_crowd_bets";
import idl from "./idl/duel_crowd_bets.json";

// Program ID - Update this after deployment
export const PROGRAM_ID = new PublicKey(
  "5iRExHjkQzwidM7EwCu8eVpeBAPnJ8qVuHi3y7gZbaeX"
);

export const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

type WalletLike = anchor.Wallet | null | undefined;

function buildProvider(
  connection: Connection,
  wallet: WalletLike,
  allowReadonly = false
): anchor.AnchorProvider {
  const isWalletReady =
    !!wallet &&
    !!wallet.publicKey &&
    !!wallet.signTransaction &&
    !!wallet.signAllTransactions;

  if (!isWalletReady && !allowReadonly) {
    throw new Error("Wallet not ready for transactions");
  }

  const resolvedWallet =
    isWalletReady || !allowReadonly
      ? (wallet as anchor.Wallet)
      : ({
          publicKey: Keypair.generate().publicKey,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        } as anchor.Wallet);

  const provider = new anchor.AnchorProvider(
    connection,
    resolvedWallet,
    anchor.AnchorProvider.defaultOptions()
  );

  return provider;
}

export function getProgram(
  connection: Connection,
  wallet: WalletLike,
  allowReadonly = false
): Program<any> {
  const provider = buildProvider(connection, wallet, allowReadonly);
  const programIdFromIdl = (idl as any)?.metadata?.address;
  const resolvedProgramId = programIdFromIdl
    ? new PublicKey(programIdFromIdl)
    : PROGRAM_ID;

  if (programIdFromIdl && resolvedProgramId.toBase58() !== PROGRAM_ID.toBase58()) {
    console.warn(
      "[anchorClient] Program ID mismatch between code and IDL.",
      "Using IDL address:",
      resolvedProgramId.toBase58()
    );
  }

  return new Program(idl as any, resolvedProgramId, provider);
}

// Helper: Derive Bet PDA
export function getBetPDA(
  arbiter: PublicKey,
  userA: PublicKey,
  userB: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("bet"),
      arbiter.toBuffer(),
      userA.toBuffer(),
      userB.toBuffer(),
    ],
    PROGRAM_ID
  );
}

// Helper: Derive SupportPosition PDA
export function getSupportPositionPDA(
  bet: PublicKey,
  bettor: PublicKey,
  side: "A" | "B"
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("support"),
      bet.toBuffer(),
      bettor.toBuffer(),
      Buffer.from([side === "A" ? 0 : 1]),
    ],
    PROGRAM_ID
  );
}

// Helper: Format lamports to SOL
export function lamportsToSol(lamports: number | anchor.BN | undefined | null): number {
  const lamportsNumber = safeToNumber(lamports);
  return lamportsNumber / anchor.web3.LAMPORTS_PER_SOL;
}

// Helper: Format SOL to lamports with validation
export function solToLamports(sol: number | string): anchor.BN {
  const parsed = typeof sol === "string" ? parseFloat(sol) : sol;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid SOL amount");
  }
  const lamports = Math.round(parsed * anchor.web3.LAMPORTS_PER_SOL);
  return new anchor.BN(lamports);
}

// Helper: Safe BN conversion
export function safeBN(value: any): anchor.BN {
  if (!value) return new anchor.BN(0);

  // If it's already a BN, return it
  if (value instanceof anchor.BN) return value;

  // If it has _bn property, use it
  if (value && typeof value === "object" && "_bn" in value && value._bn !== undefined && value._bn !== null) {
    try {
      return new anchor.BN(value._bn);
    } catch {
      return new anchor.BN(0);
    }
  }

  // If it's a number or string
  if (typeof value === "number" || typeof value === "string") {
    try {
      return new anchor.BN(value);
    } catch {
      return new anchor.BN(0);
    }
  }

  // Default to zero
  return new anchor.BN(0);
}

// Helper: Convert any value to number safely
export function safeToNumber(value: any): number {
  try {
    if (!value) return 0;

    if (typeof value === "number" && Number.isFinite(value)) return value;

    // Handle BN objects with try-catch
    if (value instanceof anchor.BN) {
      try {
        return value.toNumber();
      } catch (err) {
        console.warn("[safeToNumber] BN.toNumber() failed:", err);
        return 0;
      }
    }

    // Handle objects with _bn property
    if (value && typeof value === "object" && "_bn" in value && value._bn !== undefined && value._bn !== null) {
      try {
        return new anchor.BN(value._bn).toNumber();
      } catch (err) {
        console.warn("[safeToNumber] Creating BN from _bn failed:", err, value);
        return 0;
      }
    }

    // Handle toNumber method
    if (value && typeof value === "object" && typeof value.toNumber === "function") {
      try {
        return value.toNumber();
      } catch (err) {
        console.warn("[safeToNumber] toNumber() method failed:", err, value);
        return 0;
      }
    }

    // Try to parse as number
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    console.warn("[safeToNumber] Unhandled value type:", typeof value, value);
    return 0;
  } catch (err) {
    console.error("[safeToNumber] Unexpected error:", err, value);
    return 0;
  }
}
