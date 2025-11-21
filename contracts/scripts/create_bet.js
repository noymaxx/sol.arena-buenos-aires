#!/usr/bin/env node
/**
 * Quick script to exercise createBet without o frontend.
 * Usa a keypair local (default: ~/.config/solana/id.json) e IDL gerado.
 *
 * Variáveis de ambiente úteis:
 * - RPC_URL: endpoint RPC (ex.: http://localhost:8899 ou https://api.devnet.solana.com)
 * - KEYPAIR: caminho para a keypair (padrão: ~/.config/solana/id.json)
 * - OPPONENT: base58 do oponente (obrigatório)
 * - ARBITER: base58 do árbitro (opcional; padrão: própria wallet)
 * - STAKE_SOL: valor em SOL para cada jogador (padrão: 1.0)
 * - DUEL_HOURS / CROWD_HOURS / RESOLVE_HOURS: horas até cada deadline (padrão: 1/2/3)
 */

const fs = require("fs");
const path = require("path");
// Use the same Anchor JS version as the frontend to avoid IDL parsing differences.
const anchor = require("../../frontend/node_modules/@coral-xyz/anchor");
const { Keypair, PublicKey, SystemProgram, Connection } = require("../../frontend/node_modules/@solana/web3.js");
const crypto = require("crypto");

const PROGRAM_ID = new PublicKey("5iRExHjkQzwidM7EwCu8eVpeBAPnJ8qVuHi3y7gZbaeX");
const ROOT = path.join(__dirname, "../..");
const IDL_PATH = path.join(ROOT, "frontend/public/idl/duel_crowd_bets.json");

function loadKeypair(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const kp = Keypair.fromSecretKey(Buffer.from(JSON.parse(raw)));
  return kp;
}

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://localhost:8899";
  const keypairPath =
    process.env.KEYPAIR || path.join(require("os").homedir(), ".config/solana/id.json");

  if (!process.env.OPPONENT) {
    throw new Error("Set OPPONENT env var with the opponent pubkey (base58).");
  }

  const opponent = new PublicKey(process.env.OPPONENT);
  const arbiter = process.env.ARBITER
    ? new PublicKey(process.env.ARBITER)
    : undefined;

  const stakeSol = Number(process.env.STAKE_SOL || "1.0");
  const duelHours = Number(process.env.DUEL_HOURS || "1");
  const crowdHours = Number(process.env.CROWD_HOURS || "2");
  const resolveHours = Number(process.env.RESOLVE_HOURS || "3");

  const payerKp = loadKeypair(keypairPath);
  const wallet = new anchor.Wallet(payerKp);

  const connection = new Connection(rpcUrl, "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );

  let idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));

  // --- Hydrate IDL (replica do anchorClient) ---
  const ACCOUNT_DISCRIMINATORS = {
    Bet: [147, 23, 35, 59, 15, 75, 155, 32],
    bet: [147, 23, 35, 59, 15, 75, 155, 32],
    SupportPosition: [202, 124, 14, 86, 154, 235, 215, 186],
    supportPosition: [202, 124, 14, 86, 154, 235, 215, 186],
  };

  const normalizeIdlTypes = (value) => {
    if (Array.isArray(value)) return value.map(normalizeIdlTypes);
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) {
        const current = value[key];
        if (current === "publicKey") {
          value[key] = "pubkey";
        } else {
          value[key] = normalizeIdlTypes(current);
        }
      }
      return value;
    }
    return value === "publicKey" ? "pubkey" : value;
  };

  const toCamel = (str) => (str ? str.charAt(0).toLowerCase() + str.slice(1) : str);
  const typeNameMap = {};

  normalizeIdlTypes(idl);

  if (!idl.types) {
    idl.types = [];
  } else {
    for (const t of idl.types) {
      const camel = toCamel(t.name);
      typeNameMap[t.name] = camel;
      t.name = camel;
    }
  }

  if (idl.accounts) {
    for (const acc of idl.accounts) {
      const camel = toCamel(acc.name);
      typeNameMap[acc.name] = camel;
      acc.name = camel;

      if (!acc.discriminator || !Array.isArray(acc.discriminator)) {
        acc.discriminator =
          ACCOUNT_DISCRIMINATORS[camel] ?? ACCOUNT_DISCRIMINATORS[acc.name] ?? [];
      }

      if (!idl.types.find((t) => t.name === camel)) {
        idl.types.push({
          name: camel,
          type: acc.type,
        });
      }
    }
  }

  if (idl.events) {
    for (const ev of idl.events) {
      const camel = toCamel(ev.name);
      typeNameMap[ev.name] = camel;
      ev.name = camel;

      if (!idl.types.find((t) => t.name === camel)) {
        idl.types.push({
          name: camel,
          type: {
            kind: "struct",
            fields: ev.fields || [],
          },
        });
      }
    }
  }

  const normalizeDefined = (value) => {
    if (Array.isArray(value)) {
      return value.map(normalizeDefined);
    }
    if (value && typeof value === "object") {
      if (typeof value.defined === "string") {
        const mapped = typeNameMap[value.defined] ?? toCamel(value.defined);
        value.defined = { name: mapped };
      } else if (value.defined && typeof value.defined === "object" && typeof value.defined.name === "string") {
        const mapped = typeNameMap[value.defined.name] ?? toCamel(value.defined.name);
        value.defined.name = mapped;
      }
      for (const key of Object.keys(value)) {
        value[key] = normalizeDefined(value[key]);
      }
      return value;
    }
    return value;
  };

  normalizeDefined(idl);

  const toSnake = (s) =>
    s
      ? s
          .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
          .replace(/__/g, "_")
          .toLowerCase()
      : s;

  // Instruções: garante discriminators (sha256("global:<snake_name>").slice(0,8))
  if (idl.instructions) {
    for (const ix of idl.instructions) {
      if (!ix.discriminator || !Array.isArray(ix.discriminator)) {
        const snake = toSnake(ix.name);
        const hash = crypto.createHash("sha256").update("global:" + snake).digest();
        ix.discriminator = Array.from(hash.slice(0, 8));
      }
    }
  }

  idl.address = idl.address || PROGRAM_ID.toBase58();
  idl.metadata = { name: idl.name, address: idl.address, ...(idl.metadata || {}) };

  const coder = new anchor.BorshCoder(idl);

  const userA = payerKp.publicKey;
  const userB = opponent;
  const arbiterPk = arbiter || userA;

  const stakeLamports = new anchor.BN(Math.round(stakeSol * 1e9));
  const now = Math.floor(Date.now() / 1000);
  const deadlineDuel = new anchor.BN(now + duelHours * 3600);
  const deadlineCrowd = new anchor.BN(now + crowdHours * 3600);
  const resolveTs = new anchor.BN(now + resolveHours * 3600);

  const [betPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), arbiterPk.toBuffer(), userA.toBuffer(), userB.toBuffer()],
    PROGRAM_ID
  );

  console.log("RPC", rpcUrl);
  console.log("Payer", userA.toBase58());
  console.log("Opponent", userB.toBase58());
  console.log("Arbiter", arbiterPk.toBase58());
  console.log("Bet PDA", betPda.toBase58());

  const data = coder.instruction.encode("createBet", {
    userA,
    userB,
    arbiter: arbiterPk,
    stakeLamports,
    deadlineDuel,
    deadlineCrowd,
    resolveTs,
    spreadBps: 200,
    creatorShareBps: 5000,
    arbiterShareBps: 2000,
    protocolShareBps: 3000,
  });

  const ix = new anchor.web3.TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userA, isSigner: true, isWritable: true },
      { pubkey: betPda, isSigner: false, isWritable: true },
      { pubkey: userA, isSigner: false, isWritable: false }, // protocolTreasury placeholder
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const txSig = await provider.sendAndConfirm(new anchor.web3.Transaction().add(ix), []);
  console.log("OK tx", txSig);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
