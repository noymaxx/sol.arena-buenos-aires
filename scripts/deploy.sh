#!/bin/bash

# DuelBets Deployment Script
# This script helps deploy the program and set up the frontend

set -e

echo "🚀 DuelBets Deployment Script"
echo "=============================="
echo ""

# Check if required tools are installed
command -v solana >/dev/null 2>&1 || { echo "❌ Solana CLI not found. Please install it first."; exit 1; }
command -v anchor >/dev/null 2>&1 || { echo "❌ Anchor not found. Please install it first."; exit 1; }

# Get network choice
echo "Select network:"
echo "1) Devnet (recommended for testing)"
echo "2) Mainnet-beta (production)"
read -p "Enter choice (1 or 2): " network_choice

if [ "$network_choice" = "1" ]; then
    NETWORK="devnet"
    RPC_URL="https://api.devnet.solana.com"
elif [ "$network_choice" = "2" ]; then
    NETWORK="mainnet-beta"
    RPC_URL="https://api.mainnet-beta.solana.com"
    echo "⚠️  WARNING: You are deploying to MAINNET. This will use real SOL."
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
else
    echo "Invalid choice. Exiting."
    exit 1
fi

echo "📡 Configuring Solana CLI for $NETWORK..."
solana config set --url $RPC_URL

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: $BALANCE SOL"

if [ "$NETWORK" = "devnet" ]; then
    if (( $(echo "$BALANCE < 2" | bc -l) )); then
        echo "⚠️  Low balance. Requesting airdrop..."
        solana airdrop 2 || echo "Airdrop failed. You may need to request manually."
    fi
fi

# Build program
echo "🔨 Building program..."
anchor build

# Deploy program
echo "🚀 Deploying program to $NETWORK..."
PROGRAM_OUTPUT=$(anchor deploy 2>&1)
echo "$PROGRAM_OUTPUT"

# Extract program ID
PROGRAM_ID=$(echo "$PROGRAM_OUTPUT" | grep -oP 'Program Id: \K[A-Za-z0-9]+' | head -1)

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ Failed to extract Program ID. Please check the output above."
    exit 1
fi

echo ""
echo "✅ Program deployed successfully!"
echo "📝 Program ID: $PROGRAM_ID"
echo ""

# Update files with new Program ID
echo "📝 Updating configuration files..."

# Update lib.rs
sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/duel_crowd_bets/src/lib.rs
echo "✓ Updated programs/duel_crowd_bets/src/lib.rs"

# Update Anchor.toml
sed -i.bak "s/duel_crowd_bets = \".*\"/duel_crowd_bets = \"$PROGRAM_ID\"/" Anchor.toml
echo "✓ Updated Anchor.toml"

# Update frontend
if [ -f "app/src/lib/anchorClient.ts" ]; then
    sed -i.bak "s/new PublicKey(\".*\")/new PublicKey(\"$PROGRAM_ID\")/" app/src/lib/anchorClient.ts
    echo "✓ Updated app/src/lib/anchorClient.ts"
fi

# Copy IDL to frontend
if [ -f "target/idl/duel_crowd_bets.json" ]; then
    cp target/idl/duel_crowd_bets.json app/src/lib/idl/
    echo "✓ Copied IDL to frontend"
fi

# Remove backup files
rm -f programs/duel_crowd_bets/src/lib.rs.bak Anchor.toml.bak app/src/lib/anchorClient.ts.bak

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify the program: solana program show $PROGRAM_ID"
echo "2. Test on devnet before going to mainnet"
echo "3. Update app/.env.local with NEXT_PUBLIC_SOLANA_NETWORK=$NETWORK"
echo ""
echo "🎉 You're all set! Run 'cd app && npm run dev' to start the frontend."
