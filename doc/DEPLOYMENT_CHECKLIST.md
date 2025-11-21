# 🚀 DuelBets Deployment Checklist

Use this checklist to ensure everything is ready before deployment.

## Pre-Deployment

### Environment Setup
- [ ] Solana CLI installed and version verified (`solana --version`)
- [ ] Anchor CLI installed (`anchor --version` = 0.30.1)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Wallet configured (`solana address` shows your wallet)
- [ ] Sufficient SOL balance for deployment

### Code Review
- [ ] All tests passing (`anchor test`)
- [ ] No compiler warnings (`anchor build`)
- [ ] Code reviewed for security issues
- [ ] Error handling comprehensive
- [ ] All TODOs resolved

### Configuration
- [ ] Network selected (devnet/mainnet)
- [ ] Protocol treasury address decided
- [ ] Fee percentages finalized
- [ ] Program ID placeholder ready to update

## Deployment Steps

### 1. Build Program
```bash
anchor build
```
- [ ] Build successful
- [ ] No warnings or errors
- [ ] Binary size reasonable (<1MB)

### 2. Run Tests
```bash
anchor test
```
- [ ] All tests pass
- [ ] No flaky tests
- [ ] Coverage adequate

### 3. Configure Network
```bash
# For devnet
solana config set --url devnet

# For mainnet (CAREFUL!)
solana config set --url mainnet-beta
```
- [ ] Network set correctly
- [ ] RPC endpoint responding
- [ ] Wallet balance sufficient

### 4. Deploy Program
```bash
# Option 1: Use script (recommended)
./scripts/deploy.sh

# Option 2: Manual
anchor deploy
```
- [ ] Deployment successful
- [ ] Program ID recorded
- [ ] Transaction confirmed

### 5. Update Configuration

Update Program ID in these files:

**programs/duel_crowd_bets/src/lib.rs**
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```
- [ ] Updated

**Anchor.toml**
```toml
[programs.devnet]
duel_crowd_bets = "YOUR_PROGRAM_ID_HERE"
```
- [ ] Updated

**app/src/lib/anchorClient.ts**
```typescript
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");
```
- [ ] Updated

### 6. Copy IDL to Frontend
```bash
cp target/idl/duel_crowd_bets.json app/src/lib/idl/
```
- [ ] IDL copied
- [ ] File valid JSON
- [ ] Frontend can import it

### 7. Verify Deployment
```bash
solana program show YOUR_PROGRAM_ID
```
- [ ] Program exists on-chain
- [ ] Authority is correct
- [ ] Upgrade authority set appropriately

## Frontend Deployment

### 1. Update Environment
```bash
cd app
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```
- [ ] Network matches program deployment
- [ ] RPC endpoint configured (if custom)

### 2. Install Dependencies
```bash
npm install
```
- [ ] No errors
- [ ] All packages installed

### 3. Build Frontend
```bash
npm run build
```
- [ ] Build successful
- [ ] No TypeScript errors
- [ ] No broken imports

### 4. Test Locally
```bash
npm run dev
```
Open http://localhost:3000
- [ ] App loads
- [ ] Wallet connects
- [ ] Can fetch bets (even if empty)
- [ ] No console errors

### 5. Deploy Frontend (Optional)

**Vercel:**
```bash
vercel deploy
```
- [ ] Deployment successful
- [ ] Environment variables set
- [ ] Site accessible

**Other hosting:**
- [ ] Static files generated (`npm run build`)
- [ ] Files uploaded to host
- [ ] Site accessible

## Post-Deployment Verification

### Program Tests
- [ ] Create a test bet on devnet
- [ ] Both participants can deposit
- [ ] Crowd can place bets
- [ ] Arbiter can declare winner
- [ ] Winners can claim
- [ ] All balances correct

### Frontend Tests
- [ ] Wallet connection works
- [ ] Can view all bets
- [ ] Can create new bet
- [ ] Can view bet details
- [ ] All actions work
- [ ] Error handling works
- [ ] Mobile responsive

### Integration Tests
- [ ] Full user flow works end-to-end
- [ ] Multiple users can interact
- [ ] Concurrent bets work
- [ ] Edge cases handled

## Security Checks

### Code Security
- [ ] No private keys in code
- [ ] No hardcoded secrets
- [ ] All arithmetic checked
- [ ] Access controls verified
- [ ] Time locks enforced

### Deployment Security
- [ ] Upgrade authority controlled
- [ ] Protocol treasury secure
- [ ] Admin keys stored safely
- [ ] Backup keys created

### Operational Security
- [ ] Monitoring set up (if mainnet)
- [ ] Alert system configured
- [ ] Incident response plan ready
- [ ] Support channels established

## Documentation

- [ ] README updated with correct Program ID
- [ ] QUICKSTART tested with new deployment
- [ ] ARCHITECTURE reflects actual deployment
- [ ] API documentation complete (if public)
- [ ] User guide available

## Launch Preparation

### Community
- [ ] Announcement prepared
- [ ] Demo video recorded (optional)
- [ ] Social media posts ready
- [ ] Community channels set up

### Support
- [ ] FAQ prepared
- [ ] Known issues documented
- [ ] Support email/Discord ready
- [ ] Bug reporting process defined

### Analytics
- [ ] Analytics tracking set up
- [ ] Success metrics defined
- [ ] Monitoring dashboard created

## Mainnet-Specific (Extra Caution!)

### Pre-Mainnet
- [ ] Full security audit completed
- [ ] Economic model validated
- [ ] Legal review if needed
- [ ] Insurance considered
- [ ] Bug bounty program ready

### Mainnet Launch
- [ ] Start with small limits (if possible)
- [ ] Monitor closely for 24-48 hours
- [ ] Have rollback plan ready
- [ ] Team on standby
- [ ] Clear communication plan

### Post-Launch
- [ ] Monitor transactions
- [ ] Track metrics
- [ ] Respond to issues quickly
- [ ] Gather user feedback
- [ ] Plan improvements

## Emergency Contacts

Record these for quick reference:

- **Program ID:** ____________________
- **Protocol Treasury:** ____________________
- **Upgrade Authority:** ____________________
- **Admin Wallet:** ____________________
- **Frontend URL:** ____________________
- **RPC Provider:** ____________________

## Rollback Plan

If issues arise:
1. Pause new bet creation (if upgrade authority allows)
2. Let existing bets resolve naturally
3. Fix issues in new version
4. Re-deploy with fixes
5. Communicate clearly with users

## Success Criteria

- [ ] Program deployed without errors
- [ ] At least one successful test bet
- [ ] Frontend accessible and functional
- [ ] No critical bugs found
- [ ] Users can complete full flow
- [ ] Documentation accurate and helpful

---

## Final Sign-Off

Date: _______________
Network: _______________
Program ID: _______________
Deployed by: _______________

Notes:
_________________________________
_________________________________
_________________________________

🎉 Ready to launch!
