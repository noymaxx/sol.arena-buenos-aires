# Contributing to DuelBets

Thank you for your interest in contributing to DuelBets! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Solana version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:
- Clear use case
- Detailed explanation
- Mockups or examples if applicable
- Why this benefits the project

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/duel-crowd-bets.git
   cd duel-crowd-bets
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test thoroughly**
   ```bash
   anchor test
   cd app && npm run build
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.30.1

### Initial Setup

```bash
# Install dependencies
npm install

# Build program
anchor build

# Run tests
anchor test

# Setup frontend
cd app && npm install
```

### Development Workflow

1. Start local validator:
   ```bash
   solana-test-validator
   ```

2. Deploy to local:
   ```bash
   anchor deploy
   ```

3. Run frontend:
   ```bash
   cd app && npm run dev
   ```

## Code Style

### Rust (Program)

- Follow Rust standard style (`cargo fmt`)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small
- Handle errors explicitly

```rust
// Good
pub fn calculate_payout(bet: &Bet, amount: u64) -> Result<u64> {
    let total = bet.net_support_a
        .checked_add(bet.net_support_b)
        .ok_or(BetError::ArithmeticOverflow)?;

    // Calculate proportional payout
    Ok(amount * total / bet.net_support_a)
}

// Bad
pub fn calc(b: &Bet, a: u64) -> u64 {
    a * (b.net_support_a + b.net_support_b) / b.net_support_a
}
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Follow ESLint configuration
- Prefer functional components
- Use meaningful component names
- Add JSDoc comments for complex functions

```typescript
// Good
interface BetCardProps {
  betPubkey: PublicKey;
  bet: BetAccount;
}

/**
 * Displays a bet card with key information
 */
export function BetCard({ betPubkey, bet }: BetCardProps) {
  // ...
}

// Bad
export function Card({ data }: any) {
  // ...
}
```

## Testing Guidelines

### Program Tests

- Test happy paths
- Test error conditions
- Test edge cases
- Use descriptive test names

```typescript
it("allows winner to withdraw principal after resolution", async () => {
  // Setup
  // Action
  // Assert
});
```

### Frontend Testing

- Test user interactions
- Test error handling
- Test loading states
- Use React Testing Library

## Documentation

When adding features:
- Update README.md if needed
- Update ARCHITECTURE.md for architectural changes
- Add inline comments for complex logic
- Update JSDoc/Rustdoc comments

## Commit Messages

Follow conventional commits:

```
feat: add oracle integration
fix: resolve overflow in payout calculation
docs: update deployment guide
test: add tests for support_bet instruction
refactor: simplify fee calculation logic
```

## Areas for Contribution

### High Priority

- [ ] Add comprehensive error handling
- [ ] Improve test coverage
- [ ] Add e2e tests
- [ ] Performance optimizations
- [ ] Security audit

### Features

- [ ] Oracle integration for automated resolution
- [ ] Multi-round duels
- [ ] Reputation system for arbiters
- [ ] NFT rewards
- [ ] Leaderboard system
- [ ] Social features (comments, sharing)

### Frontend

- [ ] Mobile responsiveness improvements
- [ ] Dark mode
- [ ] Better loading states
- [ ] Notification system
- [ ] Analytics dashboard
- [ ] Wallet connection improvements

### Documentation

- [ ] Video tutorials
- [ ] API documentation
- [ ] More examples
- [ ] Translation to other languages

## Security

- Report security issues privately to the maintainers
- Do not open public issues for vulnerabilities
- Allow time for fixes before disclosure

## Questions?

- Open a discussion issue
- Join our community chat (if available)
- Review existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DuelBets! 🎉
