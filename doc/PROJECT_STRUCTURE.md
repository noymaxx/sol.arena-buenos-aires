# DuelBets Project Structure

Complete overview of all files and their purposes.

## Root Directory

```
solana/
├── README.md                    # Main documentation
├── QUICKSTART.md                # 5-minute getting started guide
├── ARCHITECTURE.md              # Technical deep dive
├── CONTRIBUTING.md              # Contribution guidelines
├── PROJECT_STRUCTURE.md         # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore rules
├── Anchor.toml                  # Anchor configuration
├── Cargo.toml                   # Workspace Cargo config
├── package.json                 # Root npm dependencies
├── tsconfig.json                # TypeScript config for tests
└── scripts/
    └── deploy.sh                # Automated deployment script
```

## Solana Program (`programs/duel_crowd_bets/`)

### Core Program Files

```
programs/duel_crowd_bets/
├── Cargo.toml                   # Program dependencies
├── Xargo.toml                   # Build configuration
└── src/
    ├── lib.rs                   # Program entry point & instruction routing
    ├── state.rs                 # Account structures (Bet, SupportPosition, enums)
    ├── errors.rs                # Custom error definitions
    └── instructions/            # Instruction handlers
        ├── mod.rs               # Module exports
        ├── create_bet.rs        # Create new duel
        ├── deposit_participant.rs   # Participant stake deposit
        ├── support_bet.rs       # Crowd betting
        ├── declare_winner.rs    # Arbiter resolution
        ├── withdraw_principal.rs    # Winner withdrawal
        ├── claim_support.rs     # Crowd payout claim
        └── withdraw_spread.rs   # Fee distribution
```

### Key Components

**lib.rs**
- Program ID declaration
- Instruction definitions
- Routes to handlers

**state.rs**
- `Bet` account structure (231 bytes)
- `SupportPosition` account structure (82 bytes)
- `BetStatus` enum (Open/Resolved/Cancelled)
- `Side` enum (A/B)

**errors.rs**
- 15+ custom error types
- Clear error messages

**instructions/**
- 7 instruction handlers
- All with proper validation
- Event emissions
- Checked arithmetic

## Tests (`tests/`)

```
tests/
└── duel_crowd_bets.ts           # Full integration test suite
```

Tests cover:
- Bet creation
- Participant deposits
- Crowd betting (both sides)
- Winner declaration
- Principal withdrawal
- Support claim
- Spread distribution

## Frontend (`app/`)

### Configuration

```
app/
├── package.json                 # Frontend dependencies
├── tsconfig.json                # TypeScript configuration
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
├── .env.example                 # Environment variables template
└── public/                      # Static assets
```

### Source Code (`app/src/`)

```
src/
├── app/                         # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page (bet feed)
│   ├── globals.css              # Global styles
│   ├── bet/
│   │   └── [id]/
│   │       └── page.tsx         # Bet detail page
│   ├── create/
│   │   └── page.tsx             # Create bet page
│   └── me/
│       └── page.tsx             # User dashboard
├── components/                  # React components
│   ├── WalletProvider.tsx       # Solana wallet setup
│   ├── Navbar.tsx               # Navigation component
│   └── BetCard.tsx              # Bet display card
└── lib/                         # Utilities & types
    ├── anchorClient.ts          # Program interaction layer
    ├── types/
    │   └── duel_crowd_bets.ts   # TypeScript types for program
    └── idl/
        └── duel_crowd_bets.json # Program IDL (generated)
```

### Pages Breakdown

**app/page.tsx** - Home
- Lists all bets
- Filter by status
- Navigate to details

**app/bet/[id]/page.tsx** - Bet Detail
- Full bet information
- Interactive actions:
  - Deposit stake
  - Place crowd bet
  - Declare winner
  - Withdraw/claim
- Real-time status updates

**app/create/page.tsx** - Create Bet
- Form for bet creation
- Opponent selection
- Stake configuration
- Timeline settings
- Arbiter selection

**app/me/page.tsx** - Dashboard
- "My Duels" section
- "My Crowd Bets" section
- Quick access to actions

### Components

**WalletProvider.tsx**
- Wraps app with wallet adapter
- Provides connection & wallet context
- Configures supported wallets

**Navbar.tsx**
- Site navigation
- Wallet connect button
- Responsive design

**BetCard.tsx**
- Displays bet summary
- Shows pool distribution
- Status badge
- Links to detail page

### Library

**anchorClient.ts**
- `getProgram()`: Initialize Anchor program
- `getBetPDA()`: Derive bet account address
- `getSupportPositionPDA()`: Derive support position address
- `lamportsToSol()`: Format helper
- `solToLamports()`: Convert helper

**types/duel_crowd_bets.ts**
- TypeScript types matching Rust structs
- Ensures type safety

**idl/duel_crowd_bets.json**
- Generated by Anchor
- Required for frontend interaction
- Copy after each deployment

## Build Artifacts

```
target/                          # Anchor build output
├── deploy/
│   └── duel_crowd_bets.so      # Compiled program binary
├── idl/
│   └── duel_crowd_bets.json    # Generated IDL
└── types/                       # Generated TypeScript types
```

## Documentation Files

### README.md
- Project overview
- Installation guide
- Usage instructions
- Testing guide
- Deployment guide

### QUICKSTART.md
- 5-minute setup guide
- Step-by-step commands
- Troubleshooting tips

### ARCHITECTURE.md
- System design
- Account structures
- Economic model
- Security considerations
- Future improvements

### CONTRIBUTING.md
- How to contribute
- Code style guidelines
- PR process
- Areas needing help

### PROJECT_STRUCTURE.md
- This file
- Complete file listing
- Purpose of each file

## Development Files

### scripts/deploy.sh
- Automated deployment
- Network selection
- Config file updates
- IDL copying

### .gitignore
- Excludes build artifacts
- Excludes node_modules
- Excludes sensitive keys
- Includes essential configs

## Key Statistics

- **Program Size**: 7 instructions, ~50KB compiled
- **Account Sizes**: Bet (231 bytes), SupportPosition (82 bytes)
- **Frontend Pages**: 4 main pages
- **Components**: 3 reusable components
- **Test Coverage**: 7 integration tests
- **Lines of Code**: ~3,500 (program + frontend)

## File Count by Type

- Rust files: 10
- TypeScript files: 12
- Configuration files: 8
- Documentation files: 5
- Total: 35+ files

## Dependencies

### Program
- `anchor-lang` 0.30.1
- `anchor-spl` 0.30.1

### Tests
- `@coral-xyz/anchor` 0.30.1
- `chai` for assertions
- `mocha` test framework

### Frontend
- `next` 14.0.4
- `react` 18.2.0
- `@solana/web3.js` 1.95.2
- `@solana/wallet-adapter-react` 0.15.35
- `tailwindcss` 3.3.0

## Next Steps After Setup

1. Deploy program: `./scripts/deploy.sh`
2. Copy IDL: `cp target/idl/duel_crowd_bets.json app/src/lib/idl/`
3. Install frontend: `cd app && npm install`
4. Start dev: `npm run dev`
5. Connect wallet and test!

---

This structure is designed for:
- Easy navigation
- Clear separation of concerns
- Scalability
- Maintainability
- Professional development workflow
