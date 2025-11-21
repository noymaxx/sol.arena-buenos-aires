# 🗺️ DuelBets - Mapa de Navegação

## 🚀 Começar Agora

**Novo no projeto?**
1. Leia: [README.md](README.md)
2. Setup: [docs/QUICKSTART.md](docs/QUICKSTART.md)
3. Rode: `anchor test`

---

## 📂 Navegação por Pasta

### [`programs/duel-crowd-bets/`](programs/duel-crowd-bets/)
**O que é:** Smart contract Solana

**Arquivos importantes:**
- [`src/lib.rs`](programs/duel-crowd-bets/src/lib.rs) - Entry point
- [`src/state.rs`](programs/duel-crowd-bets/src/state.rs) - Bet & SupportPosition
- [`src/errors.rs`](programs/duel-crowd-bets/src/errors.rs) - Erros
- [`src/instructions/`](programs/duel-crowd-bets/src/instructions/) - 7 handlers

**Comandos:**
```bash
anchor build        # Compilar
anchor test         # Testar
anchor deploy       # Deploy
```

---

### [`app/`](app/)
**O que é:** Frontend Next.js

**Estrutura:**
- [`src/app/`](app/src/app/) - Páginas
  - [`page.tsx`](app/src/app/page.tsx) - Home
  - [`bet/[id]/page.tsx`](app/src/app/bet/[id]/page.tsx) - Detalhe
  - [`create/page.tsx`](app/src/app/create/page.tsx) - Criar
  - [`me/page.tsx`](app/src/app/me/page.tsx) - Dashboard
- [`src/components/`](app/src/components/) - Componentes React
- [`src/lib/`](app/src/lib/) - Cliente Anchor

**Comandos:**
```bash
cd app
npm install
npm run dev         # http://localhost:3000
```

---

### [`tests/`](tests/)
**O que é:** Testes de integração

**Arquivo:**
- [`duel_crowd_bets.ts`](tests/duel_crowd_bets.ts) - Suite completa

**Rodar:**
```bash
anchor test
```

---

### [`scripts/`](scripts/)
**O que é:** Automação

**Scripts:**
- [`deploy.sh`](scripts/deploy.sh) - Deploy automatizado

**Usar:**
```bash
./scripts/deploy.sh
```

---

### [`docs/`](docs/)
**O que é:** Documentação

**Arquivos:**
- [`QUICKSTART.md`](docs/QUICKSTART.md) - Setup em 5 min
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Arquitetura
- [`API.md`](docs/API.md) - Referência API
- [`TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) - Problemas
- [`CONTRIBUTING.md`](docs/CONTRIBUTING.md) - Como contribuir
- [`DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) - Checklist
- [`PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) - Estrutura
- [`PROJECT_SUMMARY.md`](docs/PROJECT_SUMMARY.md) - Resumo

---

## 🎯 Guias por Objetivo

### Quero entender o projeto
1. [README.md](README.md) - Visão geral
2. [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) - Resumo
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Técnico

### Quero rodar localmente
1. [docs/QUICKSTART.md](docs/QUICKSTART.md) - Setup
2. [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Se der erro

### Quero modificar o código
1. [STRUCTURE.md](STRUCTURE.md) - Organização
2. [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - Guia
3. [docs/API.md](docs/API.md) - Referência

### Quero fazer deploy
1. [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) - Checklist
2. [`scripts/deploy.sh`](scripts/deploy.sh) - Script

### Quero auditar segurança
1. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Design
2. [`programs/duel-crowd-bets/src/`](programs/duel-crowd-bets/src/) - Código
3. [`tests/duel_crowd_bets.ts`](tests/duel_crowd_bets.ts) - Testes

---

## 🔧 Arquivos de Configuração

| Arquivo | Função |
|---------|--------|
| [Anchor.toml](Anchor.toml) | Config Anchor |
| [Cargo.toml](Cargo.toml) | Workspace Rust |
| [package.json](package.json) | Deps raiz |
| [app/package.json](app/package.json) | Deps frontend |
| [app/next.config.js](app/next.config.js) | Next.js |
| [.gitignore](.gitignore) | Git |

---

## 📊 Visão Geral do Código

### Smart Contract (Rust)

**7 Instruções:**
1. `create_bet` - [código](programs/duel-crowd-bets/src/instructions/create_bet.rs)
2. `deposit_participant` - [código](programs/duel-crowd-bets/src/instructions/deposit_participant.rs)
3. `support_bet` - [código](programs/duel-crowd-bets/src/instructions/support_bet.rs)
4. `declare_winner` - [código](programs/duel-crowd-bets/src/instructions/declare_winner.rs)
5. `withdraw_principal` - [código](programs/duel-crowd-bets/src/instructions/withdraw_principal.rs)
6. `claim_support` - [código](programs/duel-crowd-bets/src/instructions/claim_support.rs)
7. `withdraw_spread` - [código](programs/duel-crowd-bets/src/instructions/withdraw_spread.rs)

**2 Accounts:**
- `Bet` - [definição](programs/duel-crowd-bets/src/state.rs#L10)
- `SupportPosition` - [definição](programs/duel-crowd-bets/src/state.rs#L60)

### Frontend (TypeScript)

**4 Páginas:**
1. Home - [código](app/src/app/page.tsx)
2. Bet Detail - [código](app/src/app/bet/[id]/page.tsx)
3. Create - [código](app/src/app/create/page.tsx)
4. Dashboard - [código](app/src/app/me/page.tsx)

**3 Componentes:**
1. BetCard - [código](app/src/components/BetCard.tsx)
2. Navbar - [código](app/src/components/Navbar.tsx)
3. WalletProvider - [código](app/src/components/WalletProvider.tsx)

---

## 🏃 Quick Commands

```bash
# Build tudo
anchor build

# Testar
anchor test

# Deploy (automático)
./scripts/deploy.sh

# Frontend dev
cd app && npm run dev

# Ver estrutura
cat STRUCTURE.md
```

---

## 📞 Perguntas Frequentes

**Q: Onde está o código do programa?**
A: [`programs/duel-crowd-bets/src/`](programs/duel-crowd-bets/src/)

**Q: Como rodar o frontend?**
A: `cd app && npm install && npm run dev`

**Q: Como fazer deploy?**
A: `./scripts/deploy.sh` ou veja [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

**Q: Onde está a documentação da API?**
A: [docs/API.md](docs/API.md)

**Q: Como contribuir?**
A: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

**Q: Algo deu errado, e agora?**
A: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🎯 Próximos Passos

- [ ] Ler [README.md](README.md)
- [ ] Seguir [docs/QUICKSTART.md](docs/QUICKSTART.md)
- [ ] Rodar `anchor test`
- [ ] Explorar código em [`programs/`](programs/)
- [ ] Rodar frontend em [`app/`](app/)
- [ ] Fazer deploy com [`scripts/deploy.sh`](scripts/deploy.sh)

---

**Navegação organizada para máxima produtividade! 🚀**
