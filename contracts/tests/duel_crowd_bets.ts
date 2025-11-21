import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DuelCrowdBets } from "../target/types/duel_crowd_bets";
import { expect } from "chai";

describe("duel_crowd_bets", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DuelCrowdBets as Program<DuelCrowdBets>;

  // Test wallets
  let userA: anchor.web3.Keypair;
  let userB: anchor.web3.Keypair;
  let arbiter: anchor.web3.Keypair;
  let bettor1: anchor.web3.Keypair;
  let bettor2: anchor.web3.Keypair;
  let protocolTreasury: anchor.web3.Keypair;

  let betPda: anchor.web3.PublicKey;
  let betBump: number;

  const stakeAmount = new anchor.BN(1_000_000_000); // 1 SOL
  const supportAmount = new anchor.BN(500_000_000); // 0.5 SOL

  before(async () => {
    // Airdrop SOL to test wallets
    userA = anchor.web3.Keypair.generate();
    userB = anchor.web3.Keypair.generate();
    arbiter = anchor.web3.Keypair.generate();
    bettor1 = anchor.web3.Keypair.generate();
    bettor2 = anchor.web3.Keypair.generate();
    protocolTreasury = anchor.web3.Keypair.generate();

    const wallets = [userA, userB, arbiter, bettor1, bettor2, protocolTreasury];

    for (const wallet of wallets) {
      const signature = await provider.connection.requestAirdrop(
        wallet.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    }

    // Derive bet PDA
    [betPda, betBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        arbiter.publicKey.toBuffer(),
        userA.publicKey.toBuffer(),
        userB.publicKey.toBuffer(),
      ],
      program.programId
    );
  });

  it("Creates a bet", async () => {
    const now = Math.floor(Date.now() / 1000);
    const deadlineDuel = new anchor.BN(now + 3600); // 1 hour
    const deadlineCrowd = new anchor.BN(now + 7200); // 2 hours
    const resolveTs = new anchor.BN(now + 10800); // 3 hours

    const spreadBps = 200; // 2%
    const creatorShareBps = 5000; // 50%
    const arbiterShareBps = 2000; // 20%
    const protocolShareBps = 3000; // 30%

    const tx = await program.methods
      .createBet(
        userA.publicKey,
        userB.publicKey,
        arbiter.publicKey,
        stakeAmount,
        deadlineDuel,
        deadlineCrowd,
        resolveTs,
        spreadBps,
        creatorShareBps,
        arbiterShareBps,
        protocolShareBps
      )
      .accounts({
        payer: provider.wallet.publicKey,
        bet: betPda,
        protocolTreasury: protocolTreasury.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create bet transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.userA.toString()).to.equal(userA.publicKey.toString());
    expect(betAccount.userB.toString()).to.equal(userB.publicKey.toString());
    expect(betAccount.arbiter.toString()).to.equal(arbiter.publicKey.toString());
    expect(betAccount.stakeLamports.toString()).to.equal(stakeAmount.toString());
    expect(betAccount.userADeposited).to.be.false;
    expect(betAccount.userBDeposited).to.be.false;
  });

  it("User A deposits stake", async () => {
    const tx = await program.methods
      .depositParticipant()
      .accounts({
        participant: userA.publicKey,
        bet: betPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([userA])
      .rpc();

    console.log("User A deposit transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.userADeposited).to.be.true;
  });

  it("User B deposits stake", async () => {
    const tx = await program.methods
      .depositParticipant()
      .accounts({
        participant: userB.publicKey,
        bet: betPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([userB])
      .rpc();

    console.log("User B deposit transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.userBDeposited).to.be.true;
  });

  it("Bettor1 supports side A", async () => {
    const [supportPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("support"),
        betPda.toBuffer(),
        bettor1.publicKey.toBuffer(),
        Buffer.from([0]), // Side A
      ],
      program.programId
    );

    const tx = await program.methods
      .supportBet({ a: {} }, supportAmount)
      .accounts({
        bettor: bettor1.publicKey,
        bet: betPda,
        supportPosition: supportPositionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettor1])
      .rpc();

    console.log("Bettor1 support transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.netSupportA.toNumber()).to.be.greaterThan(0);

    const supportPosition = await program.account.supportPosition.fetch(supportPositionPda);
    expect(supportPosition.bettor.toString()).to.equal(bettor1.publicKey.toString());
  });

  it("Bettor2 supports side B", async () => {
    const [supportPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("support"),
        betPda.toBuffer(),
        bettor2.publicKey.toBuffer(),
        Buffer.from([1]), // Side B
      ],
      program.programId
    );

    const tx = await program.methods
      .supportBet({ b: {} }, supportAmount)
      .accounts({
        bettor: bettor2.publicKey,
        bet: betPda,
        supportPosition: supportPositionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([bettor2])
      .rpc();

    console.log("Bettor2 support transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.netSupportB.toNumber()).to.be.greaterThan(0);
  });

  it("Arbiter declares winner (Side A)", async () => {
    // Wait for resolve time (in real scenario)
    // For testing, we'll assume enough time has passed

    const tx = await program.methods
      .declareWinner({ a: {} })
      .accounts({
        arbiter: arbiter.publicKey,
        bet: betPda,
      })
      .signers([arbiter])
      .rpc();

    console.log("Declare winner transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.status).to.deep.equal({ resolved: {} });
    expect(betAccount.winnerSide).to.deep.equal({ a: {} });
  });

  it("Winner (User A) withdraws principal", async () => {
    const userABalanceBefore = await provider.connection.getBalance(userA.publicKey);

    const tx = await program.methods
      .withdrawPrincipal()
      .accounts({
        winner: userA.publicKey,
        bet: betPda,
      })
      .signers([userA])
      .rpc();

    console.log("Withdraw principal transaction:", tx);

    const userABalanceAfter = await provider.connection.getBalance(userA.publicKey);
    const expectedGain = stakeAmount.toNumber() * 2;

    // Account for transaction fees
    expect(userABalanceAfter).to.be.greaterThan(userABalanceBefore);
  });

  it("Winning bettor (Bettor1) claims support reward", async () => {
    const [supportPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("support"),
        betPda.toBuffer(),
        bettor1.publicKey.toBuffer(),
        Buffer.from([0]), // Side A
      ],
      program.programId
    );

    const bettor1BalanceBefore = await provider.connection.getBalance(bettor1.publicKey);

    const tx = await program.methods
      .claimSupport()
      .accounts({
        bettor: bettor1.publicKey,
        bet: betPda,
        supportPosition: supportPositionPda,
      })
      .signers([bettor1])
      .rpc();

    console.log("Claim support transaction:", tx);

    const bettor1BalanceAfter = await provider.connection.getBalance(bettor1.publicKey);
    expect(bettor1BalanceAfter).to.be.greaterThan(bettor1BalanceBefore);

    const supportPosition = await program.account.supportPosition.fetch(supportPositionPda);
    expect(supportPosition.claimed).to.be.true;
  });

  it("Withdraws spread fees", async () => {
    const tx = await program.methods
      .withdrawSpread()
      .accounts({
        caller: provider.wallet.publicKey,
        bet: betPda,
        userA: userA.publicKey,
        userB: userB.publicKey,
        arbiter: arbiter.publicKey,
        protocolTreasury: protocolTreasury.publicKey,
      })
      .rpc();

    console.log("Withdraw spread transaction:", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.spreadPoolCreators.toNumber()).to.equal(0);
    expect(betAccount.spreadPoolArbiter.toNumber()).to.equal(0);
    expect(betAccount.spreadPoolProtocol.toNumber()).to.equal(0);
  });
});
