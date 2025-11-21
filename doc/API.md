# 📡 DuelBets Program API Reference

Complete API documentation for the DuelBets Solana program.

## Program ID

```
Devnet: BetDue1CrowdMarketzZzZzZzZzZzZzZzZzZzZzZzZzZz
Mainnet: (Deploy your own)
```

---

## Table of Contents

1. [Instructions](#instructions)
2. [Accounts](#accounts)
3. [Types](#types)
4. [Errors](#errors)
5. [Events](#events)
6. [Examples](#examples)

---

## Instructions

### 1. create_bet

Creates a new duel between two participants.

**Accounts:**
```rust
pub struct CreateBet {
    #[account(mut)]
    pub payer: Signer,                  // Transaction payer

    #[account(init, payer = payer)]
    pub bet: Account<Bet>,              // Bet PDA

    pub protocol_treasury: UncheckedAccount,
    pub system_program: Program<System>,
}
```

**Arguments:**
```rust
pub fn create_bet(
    ctx: Context<CreateBet>,
    user_a: Pubkey,              // Participant A
    user_b: Pubkey,              // Participant B
    arbiter: Pubkey,             // Arbiter wallet
    stake_lamports: u64,         // Stake per participant
    deadline_duel: i64,          // Deposit deadline (unix timestamp)
    deadline_crowd: i64,         // Crowd betting deadline
    resolve_ts: i64,             // Resolution timestamp
    spread_bps: u16,             // Fee in basis points (200 = 2%)
    creator_share_bps: u16,      // Creator fee share (5000 = 50%)
    arbiter_share_bps: u16,      // Arbiter fee share (2000 = 20%)
    protocol_share_bps: u16,     // Protocol fee share (3000 = 30%)
) -> Result<()>
```

**Validations:**
- `stake_lamports > 0`
- `deadline_duel < deadline_crowd < resolve_ts`
- `spread_bps > 0`
- `creator_share_bps + arbiter_share_bps + protocol_share_bps == 10000`

**Example:**
```typescript
const now = Math.floor(Date.now() / 1000);

await program.methods
  .createBet(
    userA.publicKey,
    userB.publicKey,
    arbiter.publicKey,
    new BN(1_000_000_000), // 1 SOL
    new BN(now + 3600),    // 1 hour
    new BN(now + 7200),    // 2 hours
    new BN(now + 10800),   // 3 hours
    200,   // 2% fee
    5000,  // 50% to creators
    2000,  // 20% to arbiter
    3000   // 30% to protocol
  )
  .accounts({
    payer: wallet.publicKey,
    bet: betPda,
    protocolTreasury: treasuryPubkey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

### 2. deposit_participant

Allows participant A or B to deposit their stake.

**Accounts:**
```rust
pub struct DepositParticipant {
    #[account(mut)]
    pub participant: Signer,      // A or B

    #[account(mut)]
    pub bet: Account<Bet>,        // Bet PDA

    pub system_program: Program<System>,
}
```

**Arguments:**
```rust
pub fn deposit_participant(ctx: Context<DepositParticipant>) -> Result<()>
```

**Validations:**
- Current time < `deadline_duel`
- Participant is `user_a` or `user_b`
- Participant hasn't already deposited
- Bet status is `Open`

**Example:**
```typescript
await program.methods
  .depositParticipant()
  .accounts({
    participant: userA.publicKey,
    bet: betPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([userA])
  .rpc();
```

---

### 3. support_bet

Allows anyone to place a crowd bet on either side.

**Accounts:**
```rust
pub struct SupportBet {
    #[account(mut)]
    pub bettor: Signer,                    // Crowd bettor

    #[account(mut)]
    pub bet: Account<Bet>,                 // Bet PDA

    #[account(init_if_needed, payer = bettor)]
    pub support_position: Account<SupportPosition>,  // Position PDA

    pub system_program: Program<System>,
}
```

**Arguments:**
```rust
pub fn support_bet(
    ctx: Context<SupportBet>,
    side: Side,      // A or B
    amount: u64      // Amount in lamports
) -> Result<()>
```

**Validations:**
- Both participants have deposited
- Current time < `deadline_crowd`
- `amount > 0`
- Bet status is `Open`

**Fee Calculation:**
```rust
fee_total = amount * spread_bps / 10_000
net = amount - fee_total

fee_creators = fee_total * creator_share_bps / 10_000
fee_arbiter = fee_total * arbiter_share_bps / 10_000
fee_protocol = fee_total * protocol_share_bps / 10_000
```

**Example:**
```typescript
const side = { a: {} }; // or { b: {} }
const amount = new BN(500_000_000); // 0.5 SOL

await program.methods
  .supportBet(side, amount)
  .accounts({
    bettor: bettor.publicKey,
    bet: betPda,
    supportPosition: supportPositionPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([bettor])
  .rpc();
```

---

### 4. declare_winner

Arbiter declares the winning side.

**Accounts:**
```rust
pub struct DeclareWinner {
    pub arbiter: Signer,       // Arbiter wallet

    #[account(mut)]
    pub bet: Account<Bet>,     // Bet PDA
}
```

**Arguments:**
```rust
pub fn declare_winner(
    ctx: Context<DeclareWinner>,
    winner_side: Side    // A or B
) -> Result<()>
```

**Validations:**
- Signer is arbiter
- Current time >= `resolve_ts`
- Both participants deposited
- Bet status is `Open`

**Example:**
```typescript
const winnerSide = { a: {} }; // Side A wins

await program.methods
  .declareWinner(winnerSide)
  .accounts({
    arbiter: arbiter.publicKey,
    bet: betPda,
  })
  .signers([arbiter])
  .rpc();
```

---

### 5. withdraw_principal

Winner withdraws their duel winnings (2x stake).

**Accounts:**
```rust
pub struct WithdrawPrincipal {
    #[account(mut)]
    pub winner: Signer,        // Winning participant

    #[account(mut)]
    pub bet: Account<Bet>,     // Bet PDA
}
```

**Arguments:**
```rust
pub fn withdraw_principal(ctx: Context<WithdrawPrincipal>) -> Result<()>
```

**Validations:**
- Bet status is `Resolved`
- Signer is the winner (A or B based on `winner_side`)

**Payout:**
```rust
amount = stake_lamports * 2
```

**Example:**
```typescript
await program.methods
  .withdrawPrincipal()
  .accounts({
    winner: userA.publicKey, // If A won
    bet: betPda,
  })
  .signers([userA])
  .rpc();
```

---

### 6. claim_support

Crowd bettor claims their payout if they bet on the winning side.

**Accounts:**
```rust
pub struct ClaimSupport {
    #[account(mut)]
    pub bettor: Signer,                  // Crowd bettor

    #[account(mut)]
    pub bet: Account<Bet>,               // Bet PDA

    #[account(mut)]
    pub support_position: Account<SupportPosition>,  // Position PDA
}
```

**Arguments:**
```rust
pub fn claim_support(ctx: Context<ClaimSupport>) -> Result<()>
```

**Validations:**
- Bet status is `Resolved`
- Position not already claimed
- Position belongs to signer

**Payout Calculation:**
```rust
// If bet on winning side:
total_pool = net_support_a + net_support_b
winning_pool = winner == A ? net_support_a : net_support_b

payout = user_net_amount * total_pool / winning_pool

// If bet on losing side:
payout = 0
```

**Example:**
```typescript
await program.methods
  .claimSupport()
  .accounts({
    bettor: bettor.publicKey,
    bet: betPda,
    supportPosition: supportPositionPda,
  })
  .signers([bettor])
  .rpc();
```

---

### 7. withdraw_spread

Distributes accumulated fees to creators, arbiter, and protocol.

**Accounts:**
```rust
pub struct WithdrawSpread {
    pub caller: Signer,           // Anyone can call

    #[account(mut)]
    pub bet: Account<Bet>,        // Bet PDA

    #[account(mut)]
    pub user_a: UncheckedAccount, // Creator A

    #[account(mut)]
    pub user_b: UncheckedAccount, // Creator B

    #[account(mut)]
    pub arbiter: UncheckedAccount,  // Arbiter

    #[account(mut)]
    pub protocol_treasury: UncheckedAccount,  // Protocol
}
```

**Arguments:**
```rust
pub fn withdraw_spread(ctx: Context<WithdrawSpread>) -> Result<()>
```

**Validations:**
- Bet status is `Resolved`

**Distribution:**
```rust
fee_a = spread_pool_creators / 2
fee_b = spread_pool_creators - fee_a
fee_arbiter = spread_pool_arbiter
fee_protocol = spread_pool_protocol
```

**Example:**
```typescript
await program.methods
  .withdrawSpread()
  .accounts({
    caller: wallet.publicKey,
    bet: betPda,
    userA: userA.publicKey,
    userB: userB.publicKey,
    arbiter: arbiter.publicKey,
    protocolTreasury: treasury.publicKey,
  })
  .rpc();
```

---

## Accounts

### Bet

Main account for a duel.

**PDA Seeds:** `["bet", arbiter, user_a, user_b]`

**Size:** 231 bytes

**Structure:**
```rust
pub struct Bet {
    pub user_a: Pubkey,              // 32 bytes
    pub user_b: Pubkey,              // 32 bytes
    pub arbiter: Pubkey,             // 32 bytes
    pub stake_lamports: u64,         // 8 bytes
    pub user_a_deposited: bool,      // 1 byte
    pub user_b_deposited: bool,      // 1 byte
    pub deadline_duel: i64,          // 8 bytes
    pub deadline_crowd: i64,         // 8 bytes
    pub resolve_ts: i64,             // 8 bytes
    pub net_support_a: u64,          // 8 bytes
    pub net_support_b: u64,          // 8 bytes
    pub spread_pool_creators: u64,   // 8 bytes
    pub spread_pool_arbiter: u64,    // 8 bytes
    pub spread_pool_protocol: u64,   // 8 bytes
    pub spread_bps: u16,             // 2 bytes
    pub creator_share_bps: u16,      // 2 bytes
    pub arbiter_share_bps: u16,      // 2 bytes
    pub protocol_share_bps: u16,     // 2 bytes
    pub status: BetStatus,           // 1 byte
    pub winner_side: Option<Side>,   // 2 bytes
    pub protocol_treasury: Pubkey,   // 32 bytes
    pub bump: u8,                    // 1 byte
}
```

### SupportPosition

Tracks a crowd bettor's position.

**PDA Seeds:** `["support", bet, bettor, side_byte]`

**Size:** 82 bytes

**Structure:**
```rust
pub struct SupportPosition {
    pub bet: Pubkey,         // 32 bytes
    pub bettor: Pubkey,      // 32 bytes
    pub side: Side,          // 1 byte
    pub net_amount: u64,     // 8 bytes
    pub claimed: bool,       // 1 byte
    pub bump: u8,            // 1 byte
}
```

---

## Types

### BetStatus

```rust
pub enum BetStatus {
    Open,       // Bet is active
    Resolved,   // Winner declared
    Cancelled,  // Bet cancelled (not implemented)
}
```

### Side

```rust
pub enum Side {
    A,  // Side A
    B,  // Side B
}
```

---

## Errors

```rust
pub enum BetError {
    InvalidStakeAmount,         // 6000
    InvalidDeadlines,           // 6001
    InvalidFeeConfig,           // 6002
    DeadlinePassed,             // 6003
    BetNotOpen,                 // 6004
    AlreadyDeposited,           // 6005
    ParticipantsNotDeposited,   // 6006
    InvalidParticipant,         // 6007
    TooEarlyToResolve,          // 6008
    BetNotResolved,             // 6009
    InvalidWinner,              // 6010
    AlreadyClaimed,             // 6011
    WrongSide,                  // 6012
    InvalidArbiter,             // 6013
    AmountTooSmall,             // 6014
    ArithmeticOverflow,         // 6015
    InvalidSupportPosition,     // 6016
}
```

---

## Events

### BetCreated
```rust
pub struct BetCreated {
    pub bet: Pubkey,
    pub user_a: Pubkey,
    pub user_b: Pubkey,
    pub arbiter: Pubkey,
    pub stake_lamports: u64,
}
```

### ParticipantDeposited
```rust
pub struct ParticipantDeposited {
    pub bet: Pubkey,
    pub participant: Pubkey,
    pub amount: u64,
}
```

### BetSupported
```rust
pub struct BetSupported {
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub side: Side,
    pub amount: u64,
    pub net_amount: u64,
}
```

### WinnerDeclared
```rust
pub struct WinnerDeclared {
    pub bet: Pubkey,
    pub winner_side: Side,
}
```

### PrincipalWithdrawn
```rust
pub struct PrincipalWithdrawn {
    pub bet: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
}
```

### SupportClaimed
```rust
pub struct SupportClaimed {
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub payout: u64,
}
```

### SpreadWithdrawn
```rust
pub struct SpreadWithdrawn {
    pub bet: Pubkey,
    pub fee_a: u64,
    pub fee_b: u64,
    pub fee_arbiter: u64,
    pub fee_protocol: u64,
}
```

---

## Complete Flow Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

// 1. Create bet
const [betPda] = getBetPDA(arbiter, userA, userB);
await program.methods.createBet(...).rpc();

// 2. Participants deposit
await program.methods.depositParticipant()
  .accounts({ participant: userA, bet: betPda })
  .signers([userA])
  .rpc();

await program.methods.depositParticipant()
  .accounts({ participant: userB, bet: betPda })
  .signers([userB])
  .rpc();

// 3. Crowd bets
const [supportPda] = getSupportPositionPDA(betPda, bettor, "A");
await program.methods.supportBet({ a: {} }, amount)
  .accounts({ bettor, bet: betPda, supportPosition: supportPda })
  .signers([bettor])
  .rpc();

// 4. Arbiter resolves
await program.methods.declareWinner({ a: {} })
  .accounts({ arbiter, bet: betPda })
  .signers([arbiter])
  .rpc();

// 5. Winner claims
await program.methods.withdrawPrincipal()
  .accounts({ winner: userA, bet: betPda })
  .signers([userA])
  .rpc();

// 6. Crowd claims
await program.methods.claimSupport()
  .accounts({ bettor, bet: betPda, supportPosition: supportPda })
  .signers([bettor])
  .rpc();

// 7. Distribute fees
await program.methods.withdrawSpread()
  .accounts({ /* all recipients */ })
  .rpc();
```

---

For more examples, see the [test suite](../tests/duel_crowd_bets.ts).
