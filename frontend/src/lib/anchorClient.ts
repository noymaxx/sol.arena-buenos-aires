import { Program, AnchorProvider, BN, Idl } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

const ACCOUNT_DISCRIMINATORS: Record<string, number[]> = {
  Bet: [147, 23, 35, 59, 15, 75, 155, 32],
  SupportPosition: [202, 124, 14, 86, 154, 235, 215, 186],
};

export const PROGRAM_ID = new PublicKey("5iRExHjkQzwidM7EwCu8eVpeBAPnJ8qVuHi3y7gZbaeX");

let cachedIdl: any = null;
let cachedProgram: Program | null = null;
let cachedWallet: string | null = null;

function ensureProgramId(idl: any): string {
  const programId =
    idl?.address ||
    idl?.metadata?.address ||
    PROGRAM_ID?.toBase58?.();

  if (!programId) {
    throw new Error("Program address missing from IDL");
  }

  if (idl.address !== programId) {
    idl.address = programId;
  }

  if (idl.metadata?.address !== programId) {
    idl.metadata = { ...(idl.metadata || {}), address: programId };
  }

  return programId;
}

function hydrateIdl(idl: any) {
  if (!idl) return idl;

  if (idl.accounts) {
    for (const acc of idl.accounts) {
      if (!acc.discriminator || !Array.isArray(acc.discriminator)) {
        acc.discriminator =
          ACCOUNT_DISCRIMINATORS[acc.name] ??
          ACCOUNT_DISCRIMINATORS[
            acc.name?.charAt(0)?.toUpperCase() + acc.name?.slice(1)
          ] ??
          [];
      }
    }
  }

  if (idl.metadata) {
    idl.metadata = {
      name: idl.metadata.name ?? idl.name,
      ...idl.metadata,
    };
  } else {
    idl.metadata = { name: idl.name, address: idl.address };
  }

  ensureProgramId(idl);
  return idl;
}

export function clearProgramCache() {
  cachedIdl = null;
  cachedProgram = null;
  cachedWallet = null;
}

async function loadIdl() {
  if (cachedIdl) return hydrateIdl(cachedIdl);

  const response = await fetch('/idl/duel_crowd_bets.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch IDL: ${response.status}`);
  }

  const idlJson = await response.json();

  // Ensure account discriminators and metadata are present before transformation.
  hydrateIdl(idlJson);

  // Normalize IDL so Anchor can parse it correctly
  const normalizeTypes = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(normalizeTypes);
    }
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) {
        value[key] = normalizeTypes(value[key]);
      }
      return value;
    }
    if (value === "publicKey") {
      return "pubkey";
    }
    return value;
  };

  normalizeTypes(idlJson);

  // Align type names and references with Anchor's camelCase conversion
  const toCamel = (str: string) =>
    str ? str.charAt(0).toLowerCase() + str.slice(1) : str;

  const typeNameMap: Record<string, string> = {};
  if (idlJson.types) {
    for (const t of idlJson.types) {
      const camel = toCamel(t.name);
      typeNameMap[t.name] = camel;
      t.name = camel;
    }
  }

  // Ensure account layouts are available in `types`
  if (!idlJson.types) {
    idlJson.types = [];
  }
  if (idlJson.accounts) {
    for (const acc of idlJson.accounts) {
      const camel = toCamel(acc.name);
      typeNameMap[acc.name] = camel;
      acc.name = camel;

      // Avoid duplicate type entries
      if (!idlJson.types.find((t: any) => t.name === camel)) {
        idlJson.types.push({
          name: camel,
          type: acc.type,
        });
      }
    }
  }

  if (idlJson.events) {
    for (const ev of idlJson.events) {
      const camel = toCamel(ev.name);
      typeNameMap[ev.name] = camel;
      ev.name = camel;

      if (!idlJson.types.find((t: any) => t.name === camel)) {
        idlJson.types.push({
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
      if (typeof value.defined === "string") {
        const mapped = typeNameMap[value.defined] ?? value.defined;
        value.defined = { name: mapped };
      } else if (
        value.defined &&
        typeof value.defined === "object" &&
        typeof value.defined.name === "string" &&
        typeNameMap[value.defined.name]
      ) {
        value.defined.name = typeNameMap[value.defined.name];
      }
      for (const key of Object.keys(value)) {
        value[key] = normalizeDefined(value[key]);
      }
      return value;
    }
    return value;
  };

  normalizeDefined(idlJson);

  // Anchor Program ctor expects `address` and discriminators in the IDL.
  // Force the canonical values to avoid ambiguity.
  hydrateIdl(idlJson);

  cachedIdl = idlJson;
  return cachedIdl;
}

export async function getProgram(
  connection: Connection,
  wallet: AnchorWallet | any,
  allowReadonly = false
): Promise<Program> {
  try {
    const idl = await loadIdl();

    console.log("📦 IDL loaded:", {
      name: idl?.metadata?.name,
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

    const walletForProvider: AnchorWallet =
      isUsableWallet || !allowReadonly
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

    const hydratedIdl = hydrateIdl(idl);
    const programId = ensureProgramId(hydratedIdl);
    cachedIdl = hydratedIdl;

    const program = new Program(hydratedIdl as Idl, provider);

    console.log("✅ Program created:", {
      programId,
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
