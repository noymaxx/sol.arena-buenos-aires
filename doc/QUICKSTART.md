# Quick Start Guide

Get DuelBets running in 5 minutes!

## Prerequisites Check

```bash
# Check if you have required tools
node --version    # Should be 18+
solana --version  # Should be installed
anchor --version  # Should be 0.30.1
```

If any are missing, see [Installation Guide](README.md#installation--setup)

## 1. Setup Solana

```bash
# Configure for devnet
solana config set --url devnet

# Check your wallet
solana address

# Get devnet SOL (if needed)
solana airdrop 2
```

## 2. Build & Test Program

```bash
# Install dependencies
npm install

# Build program
anchor build

# Run tests (this will take a minute)
anchor test
```

Expected output: All tests passing ✅

## 3. Deploy to Devnet

```bash
# Deploy
anchor deploy

# Copy the Program ID from output, it looks like:
# Program Id: AbCdEf123456789...
```

## 4. Update Config

Edit these files with your Program ID:

**programs/duel_crowd_bets/src/lib.rs:**
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**Anchor.toml:**
```toml
[programs.devnet]
duel_crowd_bets = "YOUR_PROGRAM_ID_HERE"
```

**app/src/lib/anchorClient.ts:**
```typescript
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```

## 5. Generate IDL for Frontend

```bash
# Copy IDL to frontend
cp target/idl/duel_crowd_bets.json app/src/lib/idl/
```

## 6. Run Frontend

```bash
cd app

# Install frontend dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Connect Wallet

1. Install [Phantom Wallet](https://phantom.app/) browser extension
2. Create or import a wallet
3. Switch to Devnet in Phantom settings
4. Get devnet SOL: https://faucet.solana.com/
5. Click "Connect Wallet" in the app

## 8. Create Your First Duel

1. Click "Create Duel"
2. Enter opponent's address (or use another wallet you control)
3. Set stake amount (start with 0.1 SOL)
4. Set yourself as arbiter for testing
5. Use default timelines
6. Click "Create Duel"

## 9. Test Full Flow

### As Participant A (your wallet):
1. Go to "My Bets"
2. Click on your duel
3. Click "Deposit" to stake your SOL

### As Participant B (opponent wallet):
Switch to opponent wallet in Phantom, then:
1. Navigate to the bet URL
2. Click "Deposit"

### As Crowd Bettor (any wallet):
1. Browse duels on home page
2. Click a duel with "Crowd open" status
3. Choose a side
4. Enter amount and bet

### As Arbiter (your wallet):
After resolve time passes:
1. Open the duel
2. Click "Side A Wins" or "Side B Wins"

### Claim Winnings:
1. Winner clicks "Withdraw Principal"
2. Crowd winners click "Claim Side X"

## Troubleshooting

### "Transaction simulation failed"
- Check you have enough SOL
- Verify deadlines haven't passed
- Make sure you're on devnet

### "Program not found"
- Redeploy: `anchor deploy`
- Update Program ID in all files
- Copy fresh IDL to frontend

### Frontend won't connect
- Check Phantom is on Devnet
- Verify Program ID matches
- Check browser console for errors

### Tests failing
- Run `solana-test-validator` in another terminal
- Clean: `anchor clean && anchor build`
- Try `anchor test --skip-local-validator`

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Explore the code in `programs/duel_crowd_bets/src/`
- Customize the frontend in `app/src/`

## Common Commands

```bash
# Program
anchor build              # Build program
anchor test               # Run tests
anchor deploy             # Deploy to configured cluster
anchor clean              # Clean build artifacts

# Frontend
cd app && npm run dev     # Start dev server
cd app && npm run build   # Build for production
cd app && npm run start   # Start production server

# Solana
solana config get         # View current config
solana balance            # Check wallet balance
solana airdrop 1          # Get 1 SOL (devnet)
```

## Need Help?

- Check the [README](README.md)
- Open an issue on GitHub
- Review Anchor documentation: https://www.anchor-lang.com/

Happy building! 🚀
