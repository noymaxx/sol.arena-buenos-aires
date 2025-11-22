import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

const ACCOUNT_DISCRIMINATORS: Record<string, number[]> = {
  Bet: [147, 23, 35, 59, 15, 75, 155, 32],
  bet: [147, 23, 35, 59, 15, 75, 155, 32],
  SupportPosition: [202, 124, 14, 86, 154, 235, 215, 186],
  supportPosition: [202, 124, 14, 86, 154, 235, 215, 186],
};

export const PROGRAM_ID = new PublicKey(
  "5iRExHjkQzwidM7EwCu8eVpeBAPnJ8qVuHi3y7gZbaeX"
);

let cachedIdl: any = null;
let cachedProgram: Program | null = null;
let cachedWallet: string | null = null;

function normalizeIdlTypes(value: any): any {
  if (Array.isArray(value)) {
    return value.map(normalizeIdlTypes);
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      const current = (value as any)[key];
      if (current === "publicKey") {
        (value as any)[key] = "pubkey";
      } else {
        (value as any)[key] = normalizeIdlTypes(current);
      }
    }
    return value;
  }
  if (value === "publicKey") return "pubkey";
  return value;
}

async function loadIdl() {
  if (cachedIdl) return cachedIdl;

  const response = await fetch("/idl/duel_crowd_bets.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch IDL: ${response.status}`);
  }

  const rawIdl = await response.json();
  normalizeIdlTypes(rawIdl);

  const toCamel = (str: string) =>
    str ? str.charAt(0).toLowerCase() + str.slice(1) : str;

  const typeNameMap: Record<string, string> = {};

  if (rawIdl.types) {
    for (const t of rawIdl.types) {
      const camel = toCamel(t.name);
      typeNameMap[t.name] = camel;
      t.name = camel;
    }
  }

  if (!rawIdl.types) {
    rawIdl.types = [];
  }

if (rawIdl.accounts) {
  for (const acc of rawIdl.accounts) {
    const camel = toCamel(acc.name);
    typeNameMap[acc.name] = camel;
    acc.name = camel;

      if (!acc.discriminator || !Array.isArray(acc.discriminator)) {
        acc.discriminator =
          ACCOUNT_DISCRIMINATORS[camel] ?? ACCOUNT_DISCRIMINATORS[acc.name] ?? [];
      }

      if (!rawIdl.types.find((t: any) => t.name === camel)) {
        rawIdl.types.push({
          name: camel,
          type: acc.type,
        });
    }
  }
}

if (rawIdl.events) {
  for (const ev of rawIdl.events) {
    const camel = toCamel(ev.name);
    typeNameMap[ev.name] = camel;
    ev.name = camel;

    if (!rawIdl.types.find((t: any) => t.name === camel)) {
      rawIdl.types.push({
        name: camel,
        type: {
          kind: "struct",
          fields: ev.fields || [],
        },
      });
    }
  }
}

  const normalizeDefined = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(normalizeDefined);
    }
    if (value && typeof value === "object") {
      if (typeof (value as any).defined === "string") {
        const mapped =
          typeNameMap[(value as any).defined] ?? toCamel((value as any).defined);
        (value as any).defined = { name: mapped };
      } else if (
        (value as any).defined &&
        typeof (value as any).defined === "object" &&
        typeof (value as any).defined.name === "string"
      ) {
        const mapped =
          typeNameMap[(value as any).defined.name] ??
          toCamel((value as any).defined.name);
        (value as any).defined.name = mapped;
      }

      for (const key of Object.keys(value)) {
        (value as any)[key] = normalizeDefined((value as any)[key]);
      }
      return value;
    }
    return value;
  };

  normalizeDefined(rawIdl);

  const toSnake = (s: string) =>
    s
      ? s
          .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
          .replace(/__/g, "_")
          .toLowerCase()
      : s;

  // Instruções: injeta discriminators se faltarem (sha256("global:<snake_name>")[:8])
  // e normaliza flags (isMut/isSigner -> writable/signer) para compat com anchor >=0.30
  if (rawIdl.instructions) {
    const normalizeAccountFlags = (acc: any) => {
      if (acc && typeof acc === "object") {
        if (acc.writable === undefined && acc.isMut !== undefined) {
          acc.writable = acc.isMut;
        }
        if (acc.signer === undefined && acc.isSigner !== undefined) {
          acc.signer = acc.isSigner;
        }
      }
    };

    for (const ix of rawIdl.instructions) {
      if (Array.isArray(ix.accounts)) {
        for (const acc of ix.accounts) {
          normalizeAccountFlags(acc);
          if (Array.isArray((acc as any).accounts)) {
            for (const nested of (acc as any).accounts) {
              normalizeAccountFlags(nested);
            }
          }
        }
      }

      if (!ix.discriminator || !Array.isArray(ix.discriminator)) {
        const seed = `global:${toSnake(ix.name)}`;
        if (typeof crypto !== "undefined" && (crypto as any).subtle) {
          const hash = await (crypto as any).subtle.digest(
            "SHA-256",
            new TextEncoder().encode(seed)
          );
          ix.discriminator = Array.from(new Uint8Array(hash).slice(0, 8));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const nodeCrypto = require("crypto");
          const hash = nodeCrypto.createHash("sha256").update(seed).digest();
          ix.discriminator = Array.from(hash.slice(0, 8));
        }
      }
    }
  }

  const address =
    rawIdl?.address ?? rawIdl?.metadata?.address ?? PROGRAM_ID.toBase58();
  if (!address) {
    throw new Error("Program address missing from IDL");
  }

  rawIdl.address = address;
  rawIdl.metadata = {
    name: rawIdl?.metadata?.name ?? rawIdl?.name,
    address,
    ...(rawIdl.metadata || {}),
  };

  cachedIdl = rawIdl;
  return cachedIdl;
}

export function clearProgramCache() {
  cachedIdl = null;
  cachedProgram = null;
  cachedWallet = null;
}

export async function getProgram(
  connection: Connection,
  wallet: AnchorWallet | any,
  allowReadonly = false
): Promise<Program> {
  try {
    const idl = await loadIdl();

    console.log("📦 IDL loaded:", {
      name: idl?.metadata?.name ?? idl?.name,
      instructionsCount: idl?.instructions?.length,
      accountsCount: idl?.accounts?.length,
    });

    const readOnlyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async () => {
        throw new Error("Read-only wallet cannot sign transactions");
      },
      signAllTransactions: async () => {
        throw new Error("Read-only wallet cannot sign transactions");
      },
    };

    const isUsableWallet =
      wallet &&
      wallet.publicKey &&
      typeof wallet.signTransaction === "function" &&
      typeof wallet.signAllTransactions === "function";

    if (!isUsableWallet && !allowReadonly) {
      throw new Error("Wallet not connected");
    }

    const walletForProvider: AnchorWallet = isUsableWallet
      ? {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction.bind(wallet),
          signAllTransactions: wallet.signAllTransactions.bind(wallet),
        }
      : (readOnlyWallet as AnchorWallet);

    const walletKey = walletForProvider.publicKey?.toBase58?.() ?? "readonly";

    if (cachedProgram && walletKey === cachedWallet) {
      return cachedProgram;
    }

    const provider = new AnchorProvider(
      connection,
      walletForProvider,
      AnchorProvider.defaultOptions()
    );

    const program = new Program(idl as Idl, provider);

    console.log("✅ Program created:", {
      programId: program.programId.toBase58(),
      hasMethods: !!program.methods,
    });

    cachedProgram = program;
    cachedWallet = walletKey;

    return program;
  } catch (error) {
    console.error("❌ Error loading program:", error);
    throw error;
  }
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
export function lamportsToSol(lamports: number | BN | undefined | null): number {
  if (!lamports) return 0;

  if (typeof lamports === "number") {
    return lamports / 1e9; // LAMPORTS_PER_SOL
  }

  if (lamports instanceof BN) {
    return lamports.toNumber() / 1e9;
  }

  return 0;
}

// Helper: Format SOL to lamports
export function solToLamports(sol: number | string): BN {
  const parsed = typeof sol === "string" ? parseFloat(sol) : sol;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid SOL amount");
  }
  const lamports = Math.round(parsed * 1e9); // LAMPORTS_PER_SOL
  return new BN(lamports);
}

// Helper: Safe BN conversion
export function safeBN(value: any): BN {
  if (!value) return new BN(0);
  if (value instanceof BN) return value;

  try {
    if (typeof value === "number" || typeof value === "string") {
      return new BN(value);
    }
    if (value && typeof value === "object" && "_bn" in value) {
      return new BN(value._bn);
    }
    if (value && typeof value.toNumber === "function") {
      return new BN(value.toNumber());
    }
  } catch (err) {
    console.warn("safeBN conversion failed:", err);
  }

  return new BN(0);
}

// Helper: Convert any value to number safely
export function safeToNumber(value: any): number {
  if (!value) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  try {
    if (value instanceof BN) return value.toNumber();
    if (value && typeof value === "object" && "_bn" in value) {
      return new BN(value._bn).toNumber();
    }
    if (value && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  } catch (err) {
    console.warn("safeToNumber conversion failed:", err);
  }

  return 0;
}
