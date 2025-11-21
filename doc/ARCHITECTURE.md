# DuelBets Architecture

## System Overview

DuelBets is a decentralized betting protocol on Solana that combines 1v1 duels with crowd prediction markets. This document provides a deep dive into the technical architecture.

## Smart Contract Architecture

### Account Structure

#### 1. Bet Account (PDA)

The main account representing a duel and its associated prediction market.

**Seeds:** `["bet", arbiter, user_a, user_b]`

**Size:** 231 bytes

**Fields:**
```rust
pub struct Bet {
    // Identity (96 bytes)
    pub user_a: Pubkey,              // Participant A
    pub user_b: Pubkey,              // Participant B
    pub arbiter: Pubkey,             // Designated arbiter

    // Duel state (18 bytes)
    pub stake_lamports: u64,         // Stake per participant
    pub user_a_deposited: bool,      // A deposit status
    pub user_b_deposited: bool,      // B deposit status

    // Timing (24 bytes)
    pub deadline_duel: i64,          // Deposit deadline
    pub deadline_crowd: i64,         // Crowd betting deadline
    pub resolve_ts: i64,             // Resolution timestamp

    // Crowd pools (40 bytes)
    pub net_support_a: u64,          // Net bets on A
    pub net_support_b: u64,          // Net bets on B
    pub spread_pool_creators: u64,   // Creator fee pool
    pub spread_pool_arbiter: u64,    // Arbiter fee pool
    pub spread_pool_protocol: u64,   // Protocol fee pool

    // Fee config (8 bytes)
    pub spread_bps: u16,             // Total fee (200 = 2%)
    pub creator_share_bps: u16,      // Creator share (5000 = 50%)
    pub arbiter_share_bps: u16,      // Arbiter share (2000 = 20%)
    pub protocol_share_bps: u16,     // Protocol share (3000 = 30%)

    // Status (35 bytes)
    pub status: BetStatus,           // Open | Resolved | Cancelled
    pub winner_side: Option<Side>,   // Some(A) | Some(B) | None
    pub protocol_treasury: Pubkey,   // Protocol wallet
    pub bump: u8,                    // PDA bump
}
```

#### 2. SupportPosition Account (PDA)

Tracks an individual crowd bettor's position on one side.

**Seeds:** `["support", bet, bettor, side]`

**Size:** 82 bytes

**Fields:**
```rust
pub struct SupportPosition {
    pub bet: Pubkey,         // Reference to Bet account
    pub bettor: Pubkey,      // Bettor's wallet
    pub side: Side,          // A or B
    pub net_amount: u64,     // Net staked (after fee)
    pub claimed: bool,       // Claim status
    pub bump: u8,            // PDA bump
}
```

### State Transitions

```
[Created]
    ↓ deposit_participant (A)
    ↓ deposit_participant (B)
[Both Deposited]
    ↓ support_bet (crowd)
    ↓ support_bet (crowd)
    ↓ ... (until deadline_crowd)
[Betting Closed]
    ↓ declare_winner (arbiter, after resolve_ts)
[Resolved]
    ↓ withdraw_principal (winner)
    ↓ claim_support (crowd bettors)
    ↓ withdraw_spread (fee distribution)
[Completed]
```

## Economic Model

### Fee Calculation

For each crowd bet of amount `X`:

```
total_fee = X * spread_bps / 10_000
net = X - total_fee

fee_creators = total_fee * creator_share_bps / 10_000
fee_arbiter = total_fee * arbiter_share_bps / 10_000
fee_protocol = total_fee * protocol_share_bps / 10_000
```

**Example:** 1 SOL bet with 2% fee:
- Total fee: 0.02 SOL
- Creators: 0.01 SOL (50%)
- Arbiter: 0.004 SOL (20%)
- Protocol: 0.006 SOL (30%)
- Net to pool: 0.98 SOL

### Payout Formulas

#### Duel Winner
```
payout = 2 * stake_lamports
```

#### Crowd Winners
```
total_pool = net_support_a + net_support_b
winning_pool = (winner == A) ? net_support_a : net_support_b

payout_per_bettor = bettor_net_amount * total_pool / winning_pool
```

**Example:**
- Side A pool: 10 SOL (net)
- Side B pool: 5 SOL (net)
- Total: 15 SOL
- Side A wins
- Bettor with 2 SOL on A: `2 * 15 / 10 = 3 SOL` (50% profit)

### Why This Works

The winning side receives a proportional share of the *entire* crowd pool:
- Winning pool contributes their original stakes
- Losing pool is redistributed to winners
- Creates profit opportunity based on odds

## Security Model

### Access Control

1. **Participant Deposits**
   - Only user_a or user_b can deposit
   - Must deposit exact stake_lamports
   - Can only deposit once
   - Must be before deadline_duel

2. **Crowd Betting**
   - Anyone can bet
   - Must be after both participants deposited
   - Must be before deadline_crowd
   - No maximum bet size

3. **Winner Declaration**
   - Only arbiter can declare
   - Only after resolve_ts
   - Can only declare once

4. **Withdrawals**
   - Principal: only winner, only once
   - Support: only bet holder, only once
   - Spread: anyone can trigger (sends to designated wallets)

### Arithmetic Safety

All calculations use checked operations:
```rust
let net = amount
    .checked_sub(fee_total)
    .ok_or(BetError::ArithmeticOverflow)?;
```

### PDA Security

PDAs are derived deterministically:
- Prevents address confusion
- Ensures single bet per combination
- Enables permission-less verification

## Frontend Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **Wallet:** Solana Wallet Adapter
- **Blockchain:** @coral-xyz/anchor, @solana/web3.js
- **State:** React hooks + React Query (optional)

### Key Components

```
src/
├── app/
│   ├── page.tsx              # Home (bet feed)
│   ├── bet/[id]/page.tsx     # Bet detail
│   ├── create/page.tsx       # Create bet
│   └── me/page.tsx           # User dashboard
├── components/
│   ├── WalletProvider.tsx    # Wallet adapter setup
│   ├── Navbar.tsx            # Navigation
│   └── BetCard.tsx           # Bet display component
└── lib/
    ├── anchorClient.ts       # Program interface
    ├── types/                # TypeScript types
    └── idl/                  # Program IDL
```

### Data Flow

1. **Wallet connects** → WalletProvider initializes
2. **Page loads** → Fetch accounts from program
3. **User action** → Build transaction with Anchor
4. **Transaction signed** → Send to network
5. **Confirmation** → Refetch accounts & update UI

### Program Interaction

```typescript
// Example: Creating a bet
const program = getProgram(connection, wallet);
const [betPda] = getBetPDA(arbiter, userA, userB);

await program.methods
  .createBet(
    userA,
    userB,
    arbiter,
    stakeLamports,
    // ... more params
  )
  .accounts({
    payer: wallet.publicKey,
    bet: betPda,
    protocolTreasury,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Performance Considerations

### Account Size Optimization

- Bet: 231 bytes (< 10KB limit, efficient)
- SupportPosition: 82 bytes (minimal overhead)

### RPC Efficiency

- Use `getProgramAccounts` with filters
- Cache accounts with React Query
- Batch signature confirmations

### Scalability

Current architecture supports:
- Unlimited concurrent bets
- Unlimited crowd participants per bet
- No global state bottlenecks

Future optimizations:
- Crank-based resolution
- Zero-copy deserialization
- Compressed accounts

## Testing Strategy

### Unit Tests (Anchor)

Located in `tests/duel_crowd_bets.ts`

**Coverage:**
1. Happy path (full lifecycle)
2. Access control (wrong signer)
3. Timing constraints (deadlines)
4. Economic accuracy (payouts)
5. Edge cases (0 bets, ties)

### Integration Testing

**Manual testing checklist:**
- [ ] Create bet on devnet
- [ ] Both participants deposit
- [ ] Multiple crowd bets
- [ ] Declare winner
- [ ] All withdrawals successful
- [ ] Verify balances

### Security Auditing

**Recommended before mainnet:**
- [ ] Professional audit (Sec3, OtterSec, etc.)
- [ ] Fuzzing with Trident
- [ ] Formal verification of math
- [ ] Economic attack analysis

## Deployment Guide

### Pre-deployment Checklist

1. Update program ID in:
   - `lib.rs` (declare_id!)
   - `Anchor.toml`
   - Frontend `anchorClient.ts`

2. Set protocol treasury address

3. Verify fee configuration defaults

4. Run full test suite: `anchor test`

### Devnet Deployment

```bash
solana config set --url devnet
anchor build
anchor deploy
cp target/idl/duel_crowd_bets.json app/src/lib/idl/
```

### Mainnet Deployment

```bash
solana config set --url mainnet-beta

# Use a deployer wallet with enough SOL
anchor deploy --provider.wallet ~/.config/solana/deployer.json

# Verify deployment
solana program show <PROGRAM_ID>
```

## Monitoring & Analytics

### On-Chain Events

The program emits events for:
- `BetCreated`
- `ParticipantDeposited`
- `BetSupported`
- `WinnerDeclared`
- `PrincipalWithdrawn`
- `SupportClaimed`
- `SpreadWithdrawn`

### Metrics to Track

- Total bets created
- Total volume (duel + crowd)
- Average crowd participation
- Resolution time distributions
- Fee revenue

### Recommended Tools

- **Helius/Triton RPC** for reliable data
- **SolanaFM** for transaction exploration
- **Dune Analytics** for dashboards
- **Custom indexer** for real-time analytics

## Future Architecture Improvements

### V2 Considerations

1. **Partial Claims**
   - Allow bettors to claim incrementally
   - Useful for large pools

2. **Automated Resolution**
   - Oracle integration (Pyth, Switchboard)
   - Chainlink VRF for randomness

3. **Batch Operations**
   - Multi-bet creation
   - Batch claims

4. **Cross-Program Composability**
   - Integrate with DeFi protocols
   - Collateralize positions

5. **Advanced Features**
   - Time-weighted betting
   - Dynamic odds
   - Streak bonuses

## Conclusion

DuelBets demonstrates a novel architecture that combines:
- Escrow-based duels
- Permissionless prediction markets
- Shared revenue models
- Time-locked resolution

The design prioritizes security, simplicity, and extensibility for future enhancements.
