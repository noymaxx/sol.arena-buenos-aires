# 🏟️ Sol.Arena - Duel Betting Protocol with Crowd Markets

**A Solana-based betting protocol where 1v1 duels automatically create prediction markets for spectators**

> *Two wallets. One duel. A crowd behind it.*

---

## 🎯 Project Overview

Sol.Arena revolutionizes betting by combining traditional 1v1 duels with crowd prediction markets. When two players stake SOL against each other, it automatically opens a betting market where anyone can predict and profit from the outcome.

### Core Innovation
- **Dual Markets**: Every duel creates both a participant market (winner-takes-all) and a crowd market (proportional payouts)
- **Shared Revenue**: Duelists earn fees from crowd betting activity, incentivizing engaging matchups
- **Economic Alignment**: More spectator interest = more revenue for participants

## 🚀 Key Features

- ✅ **1v1 Duels**: Escrow-based staking with equal deposits
- ✅ **Crowd Prediction Markets**: Public betting on duel outcomes
- ✅ **Automated Fee Distribution**: Revenue sharing among creators, arbiters, and protocol
- ✅ **Time-Locked Phases**: Structured deposit, betting, and resolution windows
- ✅ **Transparent Resolution**: Designated arbiter declares winners
- ✅ **Proportional Payouts**: Winners share pools based on contribution
- ✅ **Full On-Chain**: Complete transparency and security

## 🏗️ Architecture

### Smart Contract (Anchor Program)
**Program ID**: `5iRExHjkQzwidM7EwCu8eVpeBAPnJ8qVuHi3y7gZbaeX` (Devnet)

#### Core Instructions
```rust
pub fn create_bet()           // Initialize a new duel
pub fn deposit_participant()  // A/B deposit their stakes
pub fn support_bet()         // Crowd bets on a side
pub fn declare_winner()      // Arbiter resolves outcome
pub fn withdraw_principal()  // Winner claims duel winnings
pub fn claim_support()       // Crowd winners claim payouts
pub fn withdraw_spread()     // Distribute accumulated fees
```

#### Account Structure
- **Bet**: Main duel state (stakes, pools, timing, fees)
- **SupportPosition**: Individual crowd betting positions

### Frontend (Next.js 14)
```
frontend/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── page.tsx         # Landing page
│   │   ├── app/page.tsx     # Duel browser
│   │   ├── create/page.tsx  # Create duel
│   │   ├── bet/[id]/page.tsx # Duel details
│   │   └── me/page.tsx      # User dashboard
│   ├── components/          # React components
│   │   ├── LogoBar.tsx      # Navigation header
│   │   ├── WalletCorner.tsx # Wallet connection
│   │   └── BetCard.tsx      # Duel display card
│   └── lib/                 # Utilities
└── package.json
```

## 💰 Economic Model

### Duel Economics
- **Stake**: Each participant deposits equal SOL (e.g., 1 SOL each)
- **Winner**: Receives 2x stake (their deposit + opponent's deposit)
- **Revenue**: Earns share of crowd betting fees

### Crowd Economics
- **Entry Fee**: 2% of bet amount
- **Pool**: Net amounts compete for total crowd pool
- **Payout Formula**: `user_bet * total_pool / winning_side_pool`

### Fee Distribution (2% of crowd bets)
- **50%**: Split between duel participants (A + B)
- **20%**: Arbiter compensation
- **30%**: Protocol treasury

## 🛠️ Technology Stack

### Blockchain Layer
- **Solana**: High-performance L1 blockchain
- **Anchor**: Rust framework for smart contracts
- **PDA Escrow**: Program Derived Addresses for secure custody

### Frontend Layer
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Smooth animations

### Solana Integration
- **Anchor Client**: TypeScript program interface
- **Wallet Adapter**: Multi-wallet support (Phantom, Solflare, etc.)
- **Web3.js**: Solana blockchain interaction

### Development Tools
- **Devnet**: Safe testing environment
- **Anchor Test Suite**: Comprehensive contract testing
- **ESLint/Prettier**: Code quality and formatting

## ⚡ Quick Setup

### Prerequisites
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli

# Verify installations
solana --version && anchor --version
```

### Build & Deploy
```bash
# 1. Clone and setup
git clone <repository>
cd solana

# 2. Install dependencies
cd contracts && npm install
cd ../frontend && npm install

# 3. Build program
cd ../contracts && anchor build

# 4. Configure Solana for devnet
solana config set --url devnet
solana-keygen new  # or use existing wallet
solana airdrop 2

# 5. Deploy to devnet
anchor deploy --provider.cluster devnet

# 6. Start frontend
cd ../frontend
echo "NEXT_PUBLIC_SOLANA_NETWORK=devnet" > .env.local
echo "NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com" >> .env.local
npm run dev
```

### Access Application
- **Frontend**: http://localhost:3000
- **Network**: Solana Devnet
- **Wallet**: Connect Phantom or Solflare

## 📖 User Guide

### Creating a Duel
1. Navigate to "Create Duel" or click "Launch Sol Arena"
2. Enter opponent wallet address
3. Set stake amount (SOL)
4. Choose arbiter (can be yourself or third party)
5. Configure timeline:
   - **Deposit Deadline**: When A & B must deposit
   - **Crowd Deadline**: When spectators can bet
   - **Resolution Time**: When arbiter can declare winner

### Participating in Duels
- **As Duelist**: Deposit your stake, wait for resolution, withdraw winnings + fees
- **As Spectator**: Browse live duels, bet on either side, claim winnings if correct
- **As Arbiter**: Resolve duel after event, declare winner, claim arbiter fee

### Timeline Example
1. **T0**: Duel created (A vs B, 1 SOL each, Arbiter C)
2. **T0-T1**: A and B deposit stakes (2 SOL total in escrow)
3. **T1-T2**: Crowd bets on sides (e.g., 10 SOL on A, 5 SOL on B)
4. **T2+**: Arbiter can declare winner
5. **Post-resolution**: Winners claim payouts, fees distributed

## 🧪 Testing

### Run Contract Tests
```bash
cd contracts
anchor test
```

### Test Coverage
- ✅ Complete duel lifecycle
- ✅ Multiple crowd participants
- ✅ Fee calculations and distribution
- ✅ Edge cases and error conditions
- ✅ Time-lock enforcement
- ✅ Security validations

## 🔐 Security

### Smart Contract Security
- **Time-locked Operations**: Enforced deadlines prevent early resolution
- **Signer Validation**: All operations verify proper authorization
- **Overflow Protection**: Checked arithmetic prevents exploits
- **PDA Custody**: No private key custody, program-controlled escrow
- **Single Claims**: Prevents double-spending attacks

### Frontend Security
- **Wallet Integration**: Secure transaction signing
- **RPC Configuration**: Configurable endpoints for reliability
- **Error Handling**: Graceful failure modes and user feedback

## 📊 Contract Interface

### Key Data Structures
```rust
pub struct Bet {
    pub user_a: Pubkey,              // Participant A
    pub user_b: Pubkey,              // Participant B
    pub arbiter: Pubkey,             // Resolution authority
    pub stake_lamports: u64,         // Stake amount per participant
    pub deadline_duel: i64,          // Deposit deadline
    pub deadline_crowd: i64,         // Crowd betting deadline
    pub resolve_ts: i64,             // Resolution timestamp
    pub net_support_a: u64,          // Crowd pool for A
    pub net_support_b: u64,          // Crowd pool for B
    pub spread_pool_creators: u64,    // Fee for A+B
    pub spread_pool_arbiter: u64,     // Fee for arbiter
    pub spread_pool_protocol: u64,    // Fee for protocol
    pub status: BetStatus,           // Open/Resolved/Cancelled
    pub winner_side: Option<Side>,   // A or B
    // ... configuration fields
}

pub struct SupportPosition {
    pub bet: Pubkey,        // Reference to bet
    pub bettor: Pubkey,     // Crowd participant
    pub side: Side,         // A or B
    pub net_amount: u64,    // Amount after fees
    pub claimed: bool,      // Withdrawal status
}
```

## 🌐 Deployment

### Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# For mainnet
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://your-rpc-provider.com
```

### Production Deployment
1. **Program**: Deploy to mainnet with `anchor deploy --provider.cluster mainnet`
2. **Frontend**: Deploy to Vercel/Netlify with environment variables
3. **RPC**: Use dedicated RPC provider (Helius, QuickNode, etc.)

## 🚀 Business Model & Use Cases

### Target Markets
- **Gaming Competitions**: Esports tournaments, speedruns, challenges
- **Creator Economy**: YouTuber vs YouTuber, Twitch streamer duels
- **Sports Betting**: Prediction markets for athletic competitions
- **Community Events**: Local competitions, hackathon outcomes
- **Investment Challenges**: Trading competitions, portfolio battles

### Revenue Streams
- **Protocol Fees**: 30% of all crowd betting fees
- **Premium Features**: Advanced analytics, custom arbiters
- **Partnership Revenue**: Integration with platforms and events

### Competitive Advantages
- **First Mover**: Novel dual-market approach
- **Economic Alignment**: Participants profit from engagement
- **Solana Performance**: Fast, cheap transactions
- **Extensible Platform**: Easy to add new duel types

## 🔮 Roadmap

### Phase 1: Foundation ✅
- [x] Core smart contract
- [x] Basic frontend
- [x] Devnet deployment
- [x] Documentation

### Phase 2: Enhancement 🚧
- [ ] Oracle integration for automated resolution
- [ ] Multi-round duels (best of 3, tournaments)
- [ ] Group duels (team vs team)
- [ ] Mobile-responsive design improvements

### Phase 3: Expansion 🔮
- [ ] NFT rewards for winners
- [ ] Reputation system for arbiters
- [ ] Social features (comments, sharing, follows)
- [ ] Analytics dashboard
- [ ] Mobile app

### Phase 4: Ecosystem 🌟
- [ ] DAO governance
- [ ] Platform partnerships
- [ ] Cross-chain expansion
- [ ] Enterprise integrations

## 🤝 Contributing

### Development Setup
```bash
# Fork repository
git clone <your-fork>
cd solana

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
anchor test
cd frontend && npm run lint

# Submit pull request
```

### Contribution Guidelines
- **Code Quality**: Follow Rust and TypeScript best practices
- **Testing**: Add tests for new features
- **Documentation**: Update docs for user-facing changes
- **Security**: No private key handling, validate all inputs

## 📞 Links & Contact

### Project Links
- **Repository**: [GitHub](https://github.com/your-username/sol-arena)
- **Live Demo**: [sol-arena-demo.vercel.app](https://sol-arena-demo.vercel.app)
- **Documentation**: [docs.sol-arena.com](https://docs.sol-arena.com)

### Team & Community
- **Twitter**: [@SolArena](https://twitter.com/solarena)
- **Discord**: [Sol Arena Community](https://discord.gg/solarena)
- **Email**: hello@sol-arena.com

### Developer Resources
- **Anchor Docs**: [anchor-lang.com](https://www.anchor-lang.com/)
- **Solana Cookbook**: [solanacookbook.com](https://solanacookbook.com/)
- **Solana Developers**: [solana.com/developers](https://solana.com/developers)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Built for **Solana Hacker Hotel - DevCon 2025 Buenos Aires**
- Powered by Solana's high-performance blockchain
- Inspired by prediction markets and competitive gaming communities

---

<div align="center">

**Built with ❤️ on Solana**

*Ready to duel? Connect your wallet and enter the arena!*

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sol-arena)

</div>