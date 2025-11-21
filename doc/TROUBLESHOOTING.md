# 🔧 Troubleshooting Guide

Common issues and solutions for DuelBets.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Build Issues](#build-issues)
3. [Deployment Issues](#deployment-issues)
4. [Frontend Issues](#frontend-issues)
5. [Transaction Issues](#transaction-issues)
6. [Wallet Issues](#wallet-issues)

---

## Installation Issues

### Solana CLI not found

**Problem:**
```bash
solana: command not found
```

**Solution:**
```bash
# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

### Anchor not found

**Problem:**
```bash
anchor: command not found
```

**Solution:**
```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli

# Verify
anchor --version
```

### Wrong Anchor version

**Problem:**
```
Error: Anchor version mismatch
```

**Solution:**
```bash
# Uninstall old version
cargo uninstall anchor-cli

# Install correct version
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli
```

---

## Build Issues

### Build fails with "error: linker `cc` not found"

**Problem:**
Rust linker not found.

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install

# Verify
gcc --version
```

### "program too large" error

**Problem:**
```
Error: Program binary too large
```

**Solution:**
```bash
# Enable optimization in Cargo.toml
[profile.release]
lto = "fat"
codegen-units = 1

# Rebuild
anchor build --release
```

### Cargo.lock conflicts

**Problem:**
```
error: package version conflicts
```

**Solution:**
```bash
# Update dependencies
cargo update

# Or clean and rebuild
anchor clean
anchor build
```

---

## Deployment Issues

### Insufficient funds for deployment

**Problem:**
```
Error: Insufficient funds
```

**Solution:**
```bash
# Check balance
solana balance

# For devnet, request airdrop
solana airdrop 2

# For mainnet, transfer SOL to your wallet
```

### Transaction simulation failed

**Problem:**
```
Error: Transaction simulation failed
```

**Solutions:**

1. **Check RPC endpoint:**
```bash
# Try different RPC
solana config set --url https://api.devnet.solana.com
```

2. **Increase compute units:**
```rust
// In instruction
.compute_units(400_000)
```

3. **Check account sizes:**
Make sure PDA accounts have enough space.

### Program already exists

**Problem:**
```
Error: Program already deployed
```

**Solution:**
```bash
# Use upgrade instead
anchor upgrade target/deploy/duel_crowd_bets.so

# Or deploy with new keypair
solana-keygen new -o new-program-keypair.json
anchor deploy --program-keypair new-program-keypair.json
```

### Program ID mismatch

**Problem:**
```
Error: Program ID mismatch
```

**Solution:**
1. Get deployed program ID:
```bash
solana address -k target/deploy/duel_crowd_bets-keypair.json
```

2. Update in `lib.rs`:
```rust
declare_id!("YOUR_PROGRAM_ID");
```

3. Update `Anchor.toml`:
```toml
[programs.devnet]
duel_crowd_bets = "YOUR_PROGRAM_ID"
```

4. Rebuild and redeploy.

---

## Frontend Issues

### Cannot connect wallet

**Problem:**
Wallet button doesn't work.

**Solutions:**

1. **Check browser extension:**
- Install Phantom or Solflare
- Refresh page after installation

2. **Check network:**
- Wallet should be on same network (devnet/mainnet)
- Switch network in wallet settings

3. **Clear cache:**
```bash
# Clear browser cache
# Or use incognito mode
```

### "Program not found" error

**Problem:**
```
Error: Program account not found
```

**Solutions:**

1. **Verify Program ID in frontend:**
```typescript
// app/src/lib/anchorClient.ts
export const PROGRAM_ID = new PublicKey("YOUR_ACTUAL_PROGRAM_ID");
```

2. **Check network:**
```typescript
// Should match where program is deployed
const endpoint = "https://api.devnet.solana.com";
```

3. **Verify deployment:**
```bash
solana program show YOUR_PROGRAM_ID
```

### IDL not found or invalid

**Problem:**
```
Error: IDL not found
```

**Solution:**
```bash
# Copy fresh IDL
cp target/idl/duel_crowd_bets.json app/src/lib/idl/

# Verify it's valid JSON
cat app/src/lib/idl/duel_crowd_bets.json | jq
```

### Module not found errors

**Problem:**
```
Module not found: '@solana/wallet-adapter-react'
```

**Solution:**
```bash
cd app
rm -rf node_modules package-lock.json
npm install
```

### Build fails with webpack errors

**Problem:**
Webpack polyfill errors.

**Solution:**
Add to `next.config.js`:
```javascript
webpack: (config) => {
  config.resolve.fallback = {
    fs: false,
    os: false,
    path: false,
    crypto: false,
  };
  return config;
}
```

---

## Transaction Issues

### Transaction timeout

**Problem:**
```
Error: Transaction was not confirmed in 60 seconds
```

**Solutions:**

1. **Increase timeout:**
```typescript
const signature = await program.methods
  .createBet(...)
  .rpc({
    skipPreflight: false,
    commitment: 'confirmed',
  });

// Wait longer
await connection.confirmTransaction(signature, 'confirmed');
```

2. **Check RPC health:**
```bash
# Try different RPC
# Use premium RPC (Helius, Triton) for production
```

### Custom program error

**Problem:**
```
Error: Custom program error: 0x1770
```

**Solution:**
Decode error code:
- 0x1770 = 6000 (first custom error)
- Check `errors.rs` for error at index 6000

Example:
```rust
#[error_code]
pub enum BetError {
    #[msg("Invalid stake amount")]  // 6000
    InvalidStakeAmount,
    // ...
}
```

### "AlreadyInUse" error

**Problem:**
```
Error: Account already in use
```

**Solution:**
Account already exists. Either:
1. Use a different account
2. Close existing account first
3. Use `init_if_needed` instead of `init`

---

## Wallet Issues

### Insufficient SOL for transaction

**Problem:**
```
Error: Insufficient funds
```

**Solution:**
```bash
# For devnet
solana airdrop 2

# Or use faucet
https://faucet.solana.com/

# For mainnet, transfer SOL
```

### Wrong network

**Problem:**
Transactions failing silently.

**Solution:**
1. Check wallet network (devnet/mainnet)
2. Match with program deployment
3. Update frontend RPC endpoint

### Signature verification failed

**Problem:**
```
Error: Signature verification failed
```

**Solutions:**

1. **Wallet locked:**
- Unlock wallet
- Refresh page

2. **Wrong wallet:**
- Connect correct wallet
- Check wallet address

3. **Transaction rejected:**
- User rejected in wallet
- Try again

---

## Test Issues

### Tests fail with "validator not found"

**Problem:**
```
Error: Failed to start validator
```

**Solution:**
```bash
# Start validator manually
solana-test-validator

# In another terminal
anchor test --skip-local-validator
```

### Tests timeout

**Problem:**
Tests hang or timeout.

**Solution:**
```bash
# Increase timeout in test file
it("should work", async () => {
  // ...
}).timeout(60000); // 60 seconds

# Or in mocha config
```

### Airdrop fails in tests

**Problem:**
```
Error: airdrop request failed
```

**Solution:**
```typescript
// Retry airdrop
async function airdropWithRetry(connection, pubkey, amount, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const sig = await connection.requestAirdrop(pubkey, amount);
      await connection.confirmTransaction(sig);
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000);
    }
  }
}
```

---

## Performance Issues

### Slow transaction confirmation

**Solutions:**

1. **Use premium RPC:**
```typescript
// Use Helius, Triton, or other premium RPC
const endpoint = "https://your-premium-rpc-url.com";
```

2. **Optimize compute units:**
```rust
// Request appropriate compute units
#[instruction(amount: u64)]
.compute_units(200_000)
```

3. **Use appropriate commitment:**
```typescript
// 'confirmed' is faster than 'finalized'
await connection.confirmTransaction(sig, 'confirmed');
```

### High RPC costs

**Solutions:**

1. **Cache account data:**
```typescript
// Use React Query or similar
const { data } = useQuery(['bet', betId], () => fetchBet(betId));
```

2. **Batch requests:**
```typescript
// Use getMultipleAccounts instead of multiple getAccount calls
const accounts = await connection.getMultipleAccountsInfo([pubkey1, pubkey2]);
```

3. **Use websockets for updates:**
```typescript
connection.onAccountChange(pubkey, callback);
```

---

## Getting More Help

If your issue isn't listed here:

1. **Check logs:**
   - Browser console (F12)
   - Terminal output
   - Anchor logs

2. **Search existing issues:**
   - GitHub issues
   - Anchor Discord
   - Solana Stack Exchange

3. **Ask for help:**
   - Open GitHub issue with:
     - Error message
     - Steps to reproduce
     - Environment (OS, versions)
     - Relevant logs

4. **Debug mode:**
```bash
# Enable debug logging
RUST_LOG=debug anchor test
RUST_BACKTRACE=1 anchor build
```

---

## Useful Commands

```bash
# Check versions
solana --version
anchor --version
node --version

# Check config
solana config get
anchor --version

# Check balance
solana balance

# Check program
solana program show PROGRAM_ID

# View logs
solana logs PROGRAM_ID

# Clean build
anchor clean && anchor build
```

---

**Still stuck?** Open an issue with full error details!
