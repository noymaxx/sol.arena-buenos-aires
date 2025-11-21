# 📂 DuelBets - Estrutura de Diretórios

## 🏗️ Arquitetura de Alto Nível

```
solana/                                 # Raiz do projeto
│
├── 📋 README.md                        # Documentação principal
├── 📄 LICENSE                          # Licença MIT
├── ⚙️  Anchor.toml                     # Configuração do Anchor
├── ⚙️  Cargo.toml                      # Workspace Rust
├── 📦 package.json                     # Dependências raiz (testes)
├── 🔧 tsconfig.json                    # TypeScript config (testes)
├── 🚫 .gitignore                       # Git exclusões
│
├── 📁 programs/                        # PROGRAMAS SOLANA
│   └── duel-crowd-bets/
│       ├── Cargo.toml                  # Dependências do programa
│       ├── Xargo.toml                  # Build config
│       └── src/
│           ├── lib.rs                  # Entry point + routing
│           ├── state.rs                # Bet & SupportPosition
│           ├── errors.rs               # Erros customizados
│           └── instructions/           # Handlers
│               ├── mod.rs
│               ├── create_bet.rs
│               ├── deposit_participant.rs
│               ├── support_bet.rs
│               ├── declare_winner.rs
│               ├── withdraw_principal.rs
│               ├── claim_support.rs
│               └── withdraw_spread.rs
│
├── 📁 tests/                           # TESTES
│   └── duel_crowd_bets.ts              # Suite completa de testes
│
├── 📁 app/                             # FRONTEND (Next.js)
│   ├── package.json                    # Dependências frontend
│   ├── tsconfig.json                   # TS config
│   ├── next.config.js                  # Next.js config
│   ├── tailwind.config.ts              # Tailwind config
│   ├── postcss.config.js               # PostCSS config
│   ├── .env.example                    # Template de env vars
│   │
│   ├── public/                         # Assets estáticos
│   │
│   └── src/
│       ├── app/                        # Pages (App Router)
│       │   ├── layout.tsx              # Layout principal
│       │   ├── page.tsx                # Home (feed)
│       │   ├── globals.css             # Estilos globais
│       │   │
│       │   ├── bet/[id]/
│       │   │   └── page.tsx            # Detalhe da bet
│       │   │
│       │   ├── create/
│       │   │   └── page.tsx            # Criar bet
│       │   │
│       │   └── me/
│       │       └── page.tsx            # Dashboard usuário
│       │
│       ├── components/                 # Componentes React
│       │   ├── WalletProvider.tsx      # Setup de wallet
│       │   ├── Navbar.tsx              # Navegação
│       │   └── BetCard.tsx             # Card de bet
│       │
│       └── lib/                        # Utilities
│           ├── anchorClient.ts         # Cliente Anchor
│           ├── types/
│           │   └── duel_crowd_bets.ts  # TypeScript types
│           └── idl/
│               └── duel_crowd_bets.json # IDL (gerado)
│
├── 📁 scripts/                         # SCRIPTS
│   ├── deploy.sh                       # Deploy automático
│   └── helpers/                        # Scripts auxiliares
│
├── 📁 docs/                            # DOCUMENTAÇÃO
│   ├── README.md                       # Índice da documentação
│   ├── QUICKSTART.md                   # Setup rápido
│   ├── ARCHITECTURE.md                 # Arquitetura técnica
│   ├── PROJECT_STRUCTURE.md            # Estrutura de arquivos
│   ├── PROJECT_SUMMARY.md              # Resumo executivo
│   ├── CONTRIBUTING.md                 # Guia de contribuição
│   ├── DEPLOYMENT_CHECKLIST.md         # Checklist de deploy
│   ├── TROUBLESHOOTING.md              # Solução de problemas
│   └── API.md                          # Referência da API
│
└── 📁 target/                          # BUILD ARTIFACTS (gerado)
    ├── deploy/
    │   ├── duel_crowd_bets.so          # Programa compilado
    │   └── duel_crowd_bets-keypair.json
    ├── idl/
    │   └── duel_crowd_bets.json        # IDL gerado
    └── types/                          # TypeScript types gerados
```

---

## 📊 Organização por Função

### 🔐 Smart Contract (Solana Program)

**Localização:** `programs/duel-crowd-bets/`

**Responsabilidade:**
- Lógica on-chain
- Escrow de SOL
- Validações
- Cálculos de fee
- Distribuição de payouts

**Arquivos principais:**
- `lib.rs` - 70 linhas - Entry point
- `state.rs` - 100 linhas - Estruturas de dados
- `errors.rs` - 50 linhas - Erros
- `instructions/*.rs` - 700 linhas total - Lógica de negócio

### 🧪 Testes

**Localização:** `tests/`

**Responsabilidade:**
- Testes de integração
- Validação de fluxos completos
- Verificação de cálculos

**Arquivos:**
- `duel_crowd_bets.ts` - 300 linhas - Suite completa

### 🎨 Frontend

**Localização:** `app/`

**Responsabilidade:**
- Interface do usuário
- Integração com carteiras
- Chamadas ao programa
- Exibição de dados

**Estrutura:**
- **Pages:** 4 páginas principais
- **Components:** 3 componentes reutilizáveis
- **Lib:** Cliente Anchor + utilities

### 📚 Documentação

**Localização:** `docs/`

**Responsabilidade:**
- Guias de uso
- Referência técnica
- Tutoriais
- Troubleshooting

**Arquivos:** 9 documentos completos

### 🛠️ Scripts

**Localização:** `scripts/`

**Responsabilidade:**
- Automação de deploy
- Helpers de desenvolvimento

---

## 🎯 Pontos de Entrada

### Para Desenvolvedores

1. **Começar:** [`README.md`](../README.md)
2. **Setup rápido:** [`docs/QUICKSTART.md`](docs/QUICKSTART.md)
3. **Código:**
   - Programa: [`programs/duel-crowd-bets/src/lib.rs`](programs/duel-crowd-bets/src/lib.rs)
   - Frontend: [`app/src/app/page.tsx`](app/src/app/page.tsx)

### Para Usuários

1. **O que é:** [`README.md`](../README.md)
2. **Como usar:** [`docs/QUICKSTART.md`](docs/QUICKSTART.md)
3. **Acessar:** [Frontend local](http://localhost:3000) após `npm run dev`

### Para Auditores

1. **Arquitetura:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
2. **API:** [`docs/API.md`](docs/API.md)
3. **Código:** [`programs/duel-crowd-bets/src/`](programs/duel-crowd-bets/src/)
4. **Testes:** [`tests/duel_crowd_bets.ts`](tests/duel_crowd_bets.ts)

---

## 📦 Arquivos Gerados (não versionados)

```
target/                     # Anchor build output
├── deploy/                 # Binários compilados
├── idl/                    # IDL gerado
└── types/                  # Types gerados

app/node_modules/           # Dependências frontend
app/.next/                  # Next.js build
node_modules/               # Dependências raiz
.anchor/                    # Cache do Anchor
```

---

## 🔑 Arquivos de Configuração

| Arquivo | Propósito |
|---------|-----------|
| `Anchor.toml` | Config do Anchor (networks, paths) |
| `Cargo.toml` | Workspace Rust |
| `package.json` | Deps raiz (testes) |
| `tsconfig.json` | TypeScript (testes) |
| `app/package.json` | Deps frontend |
| `app/tsconfig.json` | TypeScript frontend |
| `app/next.config.js` | Next.js config |
| `app/tailwind.config.ts` | Tailwind CSS |
| `.gitignore` | Git exclusões |

---

## 📈 Estatísticas

### Tamanhos

| Componente | Arquivos | Linhas de Código |
|------------|----------|------------------|
| Programa Solana | 10 | ~1,200 |
| Frontend | 12 | ~1,800 |
| Testes | 1 | ~300 |
| Documentação | 9 | ~4,000 |
| **Total** | **32** | **~7,300** |

### Accounts

| Account | Size | Purpose |
|---------|------|---------|
| Bet | 231 bytes | Duel principal + crowd pools |
| SupportPosition | 82 bytes | Posição de torcedor |

### Instruções

7 instruções públicas:
1. `create_bet` - Criar duelo
2. `deposit_participant` - Depositar stake
3. `support_bet` - Apostar (torcida)
4. `declare_winner` - Resolver
5. `withdraw_principal` - Sacar duelo
6. `claim_support` - Sacar torcida
7. `withdraw_spread` - Distribuir fees

---

## 🚀 Comandos por Diretório

### Raiz (`/`)
```bash
anchor build        # Build programa
anchor test         # Rodar testes
anchor deploy       # Deploy
./scripts/deploy.sh # Deploy automatizado
```

### Frontend (`app/`)
```bash
npm install         # Instalar deps
npm run dev         # Dev server
npm run build       # Build produção
npm run start       # Prod server
```

### Programa (`programs/duel-crowd-bets/`)
```bash
cargo build-bpf     # Build manual
cargo test          # Unit tests (se houver)
```

---

## 🎨 Convenções de Nomenclatura

### Rust (Programa)
- **Arquivos:** `snake_case.rs`
- **Structs:** `PascalCase`
- **Functions:** `snake_case`
- **Constants:** `SCREAMING_SNAKE_CASE`

### TypeScript (Frontend)
- **Arquivos:** `camelCase.ts` ou `PascalCase.tsx`
- **Components:** `PascalCase`
- **Functions:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE`

### Documentação
- **Arquivos:** `SCREAMING_SNAKE_CASE.md`
- **Seções:** Title Case

---

## 🔄 Fluxo de Desenvolvimento

1. **Modificar programa:**
   ```bash
   # Editar em programs/duel-crowd-bets/src/
   anchor build
   anchor test
   ```

2. **Atualizar frontend:**
   ```bash
   # Copiar IDL atualizado
   cp target/idl/duel_crowd_bets.json app/src/lib/idl/

   # Editar em app/src/
   cd app && npm run dev
   ```

3. **Deploy:**
   ```bash
   ./scripts/deploy.sh
   # Seguir instruções
   ```

---

## 📞 Navegação Rápida

### Editar Código
- **Programa:** [`programs/duel-crowd-bets/src/`](programs/duel-crowd-bets/src/)
- **Frontend Pages:** [`app/src/app/`](app/src/app/)
- **Components:** [`app/src/components/`](app/src/components/)
- **Testes:** [`tests/duel_crowd_bets.ts`](tests/duel_crowd_bets.ts)

### Ler Docs
- **Início:** [`README.md`](../README.md)
- **Técnico:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **API:** [`docs/API.md`](docs/API.md)
- **Troubleshoot:** [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

### Configurar
- **Programa:** [`Anchor.toml`](../Anchor.toml)
- **Frontend:** [`app/next.config.js`](app/next.config.js)
- **Env:** [`app/.env.example`](app/.env.example)

---

**Estrutura limpa, organizada e pronta para desenvolvimento! 🚀**
