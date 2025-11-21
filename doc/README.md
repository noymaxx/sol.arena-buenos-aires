# DuelBets - Duel Betting Protocol with Crowd Markets

A Solana-based betting protocol where 1v1 duels automatically open prediction markets for the crowd. Built for the **Solana Hacker Hotel - DevCon 2025 Buenos Aires** bounty.

## Overview

DuelBets creates a unique betting experience that combines:
- **1v1 Duels**: Two participants stake equal amounts of SOL
- **Crowd Prediction Markets**: Anyone can bet on who will win
- **Shared Revenue**: Duel participants earn fees from crowd betting activity
- **Transparent Resolution**: Designated arbiter declares the winner

### Key Features

- ✅ Escrow-based duel staking
- ✅ Automatic prediction market creation
- ✅ Fee distribution (creators, arbiter, protocol)
- ✅ Time-locked deposits and resolution
- ✅ Proportional payouts for crowd bettors
- ✅ Full on-chain transparency

## Project Structure

```
.
├── programs/duel_crowd_bets/    # Anchor program (Solana smart contract)
│   ├── src/
│   │   ├── lib.rs               # Program entry point
│   │   ├── state.rs             # Account structures
│   │   ├── errors.rs            # Custom errors
│   │   └── instructions/        # Program instructions
├── tests/                        # Anchor tests
├── app/                          # Next.js frontend
│   ├── src/
│   │   ├── app/                 # Pages
│   │   ├── components/          # React components
│   │   └── lib/                 # Utilities & Anchor client
└── README.md
```

## How It Works

### Economics

#### Duel Stake
- User A and User B each deposit equal stake (e.g., 1 SOL each)
- Winner receives 2x the stake (their stake + opponent's stake)

#### Crowd Betting
- Anyone can bet on Side A or Side B
- Each bet pays a 2% fee, split:
  - 50% to duel creators (A + B)
  - 20% to arbiter
  - 30% to protocol
- Net amounts go into liquidity pools for each side

#### Payouts
- **Duel winner**: Gets 2x their stake
- **Crowd winners**: Proportional share of total crowd pool
  - Formula: `payout = user_bet * total_pool / winning_side_pool`
- **Fee recipients**: Creators, arbiter, and protocol receive their shares

### Timeline

1. **Creation**: Duel is created with participants, arbiter, and deadlines
2. **Deposit Phase**: A and B deposit their stakes
3. **Crowd Betting Phase**: Public can bet on either side
4. **Resolution**: After resolve time, arbiter declares winner
5. **Claim Phase**: Winners withdraw their payouts

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Rust and Solana CLI tools
- Anchor Framework (0.30.1)
- Phantom or Solflare wallet (for frontend testing)

### Install Dependencies

```bash
# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli

# Verify installations
solana --version
anchor --version
```

### Clone and Build

```bash
# Install program dependencies
npm install

# Build the Solana program
anchor build

# Run tests
anchor test
```

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Create a wallet (or use existing)
solana-keygen new

# Get some devnet SOL
solana airdrop 2

# Deploy the program
anchor deploy --provider.cluster devnet

# Note the Program ID from the output and update it in:
# - Anchor.toml
# - app/src/lib/anchorClient.ts
```

### Generate IDL for Frontend

After deployment, copy the IDL:

```bash
cp target/idl/duel_crowd_bets.json app/src/lib/idl/
```

## Frontend Setup

```bash
cd app

# Install dependencies
npm install

# Create .env.local with your configuration
echo "NEXT_PUBLIC_SOLANA_NETWORK=devnet" > .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Usage Guide

### Creating a Duel

1. Navigate to "Create Duel" page
2. Enter opponent's wallet address
3. Set stake amount (SOL)
4. Choose arbiter (yourself or another wallet)
5. Configure timelines:
   - Deposit deadline
   - Crowd betting deadline
   - Resolution time
6. Click "Create Duel"

### Participating as a Duelist

1. Navigate to your duel from "My Bets"
2. Click "Deposit" to stake your SOL
3. Wait for opponent to deposit
4. Once resolved, withdraw your winnings if you won

### Betting as Crowd

1. Browse duels on home page
2. Click on a duel to view details
3. Choose Side A or Side B
4. Enter amount to bet
5. Confirm transaction
6. After resolution, claim your winnings if you bet on the winner

### Resolving as Arbiter

1. After resolve time passes, navigate to the duel
2. Review the outcome of the duel
3. Click "Side A Wins" or "Side B Wins"
4. Claim your arbiter fee

## Program Instructions

### `create_bet`
Creates a new duel with specified parameters.

**Parameters:**
- `user_a`: Participant A's pubkey
- `user_b`: Participant B's pubkey
- `arbiter`: Arbiter's pubkey
- `stake_lamports`: Stake amount
- `deadline_duel`: Deadline for deposits
- `deadline_crowd`: Deadline for crowd bets
- `resolve_ts`: Time when arbiter can resolve
- `spread_bps`: Fee percentage (basis points)
- `creator_share_bps`: Creator fee share
- `arbiter_share_bps`: Arbiter fee share
- `protocol_share_bps`: Protocol fee share

### `deposit_participant`
Allows A or B to deposit their stake.

### `support_bet`
Allows anyone to place a crowd bet.

**Parameters:**
- `side`: Side A or Side B
- `amount`: Amount to bet (lamports)

### `declare_winner`
Arbiter declares the winning side.

**Parameters:**
- `winner_side`: Side A or Side B

### `withdraw_principal`
Winner withdraws their duel winnings (2x stake).

### `claim_support`
Crowd bettor claims their payout.

### `withdraw_spread`
Distributes accumulated fees to creators, arbiter, and protocol.

## Testing

Run the full test suite:

```bash
anchor test
```

The tests cover:
- Bet creation
- Participant deposits
- Crowd betting
- Winner declaration
- Principal withdrawal
- Crowd payout claims
- Fee distribution

## Security Considerations

- ✅ Time-based access controls
- ✅ Participant validation
- ✅ Overflow protection with checked math
- ✅ PDA-based escrow (no custody)
- ✅ Single claim enforcement
- ✅ Signer verification

## Architecture Decisions

### Why PDA Escrow?
Program Derived Addresses (PDAs) eliminate the need for separate escrow accounts and provide deterministic addressing.

### Why Separate SupportPosition Accounts?
Each bettor's position is tracked individually to:
- Prevent double claims
- Allow position tracking
- Enable future features (partial claims, etc.)

### Fee Structure
The 2% fee with split distribution incentivizes:
- Duelists to create interesting matchups
- Arbiters to fairly resolve
- Protocol sustainability

## Future Enhancements

- [ ] Multi-round duels
- [ ] Group duels (N participants)
- [ ] Automated oracle integration
- [ ] Reputation system for arbiters
- [ ] NFT rewards for winners
- [ ] Leaderboards
- [ ] Social features (comments, sharing)
- [ ] Mobile app

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Developer Guide](https://solana.com/developers)

## License

MIT License - See LICENSE file for details

## Bounty Submission

This project is submitted for the **Solana Hacker Hotel - DevCon 2025 Buenos Aires** betting protocol bounty.

### Bounty Requirements Met

✅ Betting between two parties (A and B)
✅ Equal SOL deposits from both parties
✅ Escrow in Solana program
✅ Arbiter decides winner after time period
✅ Secure withdrawal by winner
✅ Client (web interface) to interact with program

### Extra Features

✅ Group betting (crowd prediction markets)
✅ Multiple participants (crowd)
✅ Fee distribution system
✅ Time-locked phases
✅ Event history
✅ Modern UI/UX

## Contact

For questions or issues, please open an issue on the GitHub repository.

---

Built with ❤️ on Solana
