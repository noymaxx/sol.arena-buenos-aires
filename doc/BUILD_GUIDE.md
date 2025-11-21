# 🔨 Guia Definitivo de Build - DuelBets

## 📊 Situação Atual

### ✅ O que Temos
- ✅ Código do programa completo
- ✅ Testes escritos
- ✅ Frontend implementado
- ✅ Rust instalado (1.91.1)
- ✅ Node.js instalado (22.13.0)
- ✅ Carteira Solana criada
- ✅ 1 SOL de teste

### ⏳ Em Progresso
- Anchor CLI 0.30.1 compilando via cargo (iniciado há ~20 min)
- Estimativa para conclusão: 5-10 minutos

### ❌ Removido na Limpeza
- Solana CLI e platform tools (será reinstalado)

---

## 🎯 Melhor Solução: Aguardar e Instalar Corretamente

### Etapa 1: Aguardar Anchor Terminar ⏳

O Anchor está compilando. Quando terminar:

```bash
# Verificar instalação
~/.cargo/bin/anchor --version

# Adicionar ao PATH permanentemente
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Confirmar
anchor --version  # Deve mostrar: anchor-cli 0.30.1
```

### Etapa 2: Reinstalar Solana CLI + Platform Tools

**Método 1: Script oficial (quando conexão melhorar)**
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.24/install)"
```

**Método 2: Download manual (se curl falhar)**
```bash
# Download direto
wget https://github.com/solana-labs/solana/releases/download/v1.18.24/solana-release-x86_64-unknown-linux-gnu.tar.bz2

# Extrair
tar jxf solana-release-x86_64-unknown-linux-gnu.tar.bz2

# Instalar
cd solana-release
./install

# PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

**Método 3: Via Package Manager**
```bash
# Se no Ubuntu/Debian
sudo apt update
sudo apt install -y pkg-config build-essential libudev-dev

# Compilar do source
git clone https://github.com/solana-labs/solana.git --branch v1.18.24
cd solana
cargo build --release
```

### Etapa 3: Verificar Todas as Ferramentas

```bash
# Anchor
anchor --version
# Esperado: anchor-cli 0.30.1

# Solana
solana --version
# Esperado: solana-cli 1.18.x

# Cargo Build SBF
cargo build-sbf --version
# Esperado: solana-cargo-build-sbf 1.18.x

# Rust
rustc --version
# Esperado: rustc 1.70+
```

---

## 🚀 Processo de Build Completo

### Build Passo a Passo

```bash
# 1. Limpar builds anteriores
anchor clean

# 2. Build do programa
anchor build

# Isso vai:
# - Compilar o Rust para BPF
# - Gerar target/deploy/duel_crowd_bets.so (~50KB)
# - Gerar target/idl/duel_crowd_bets.json
# - Gerar types TypeScript

# 3. Verificar arquivos gerados
ls -lh target/deploy/
ls -lh target/idl/

# 4. Verificar tamanho do programa
du -h target/deploy/duel_crowd_bets.so
# Esperado: 40-80KB
```

### Rodar Testes

```bash
# Testes completos (com validador local)
anchor test

# Ou passo a passo:

# Terminal 1: Iniciar validador
solana-test-validator --reset

# Terminal 2: Deploy local
anchor deploy --provider.cluster localnet

# Terminal 3: Rodar testes
anchor test --skip-local-validator
```

---

## 🐛 Troubleshooting Específico

### Se Anchor Build Falhar

**Erro: "anchor: command not found"**
```bash
# Verificar instalação
ls -la ~/.cargo/bin/anchor

# Se existir, adicionar ao PATH
export PATH="$HOME/.cargo/bin:$PATH"
```

**Erro: "cargo build-sbf not found"**
```bash
# Verificar Solana platform tools
which cargo-build-sbf

# Se não existir, reinstalar Solana
```

**Erro: "failed to run custom build command"**
```bash
# Limpar e rebuildar
cargo clean
anchor build
```

### Se Testes Falharem

**Erro: "connection refused"**
```bash
# Validador não está rodando
solana-test-validator --reset
```

**Erro: "transaction simulation failed"**
```bash
# Verificar saldo
solana balance

# Pedir airdrop se necessário
solana airdrop 2
```

**Erro: "account does not exist"**
```bash
# Program não foi deployed
anchor deploy
```

---

## 📦 Build Alternativo: Sem Anchor CLI

Se por algum motivo o Anchor CLI não funcionar:

### Build Manual com Cargo

```bash
# Navegar para o programa
cd programs/duel_crowd_bets

# Build
cargo build-sbf

# Deploy
solana program deploy target/deploy/duel_crowd_bets.so

# Gerar IDL manualmente
anchor idl init --filepath target/idl/duel_crowd_bets.json <PROGRAM_ID>
```

### Testes Manuais com TypeScript

```bash
# Usar ts-node diretamente
npx ts-node tests/duel_crowd_bets.ts
```

---

## ⏱️ Estimativas de Tempo

| Tarefa | Tempo |
|--------|-------|
| Anchor compilar (restante) | 5-10 min |
| Instalar Solana | 3-5 min |
| Primeiro build | 3-5 min |
| Testes | 2 min |
| **Total** | **15-25 min** |

---

## ✅ Checklist de Pronto para Build

Antes de fazer `anchor build`, verificar:

- [ ] `anchor --version` funciona
- [ ] `solana --version` funciona
- [ ] `cargo build-sbf --version` funciona
- [ ] `rustc --version` funciona
- [ ] Carteira configurada (`solana address`)
- [ ] Saldo > 0 (`solana balance`)
- [ ] Conectado ao cluster correto (`solana config get`)

---

## 🎓 Entendendo o Build

### O que `anchor build` faz?

1. **Compila Rust → BPF**
   - Usa `cargo build-sbf`
   - Otimiza para tamanho
   - Gera `.so` file

2. **Gera IDL**
   - Extrai interface do programa
   - Cria JSON com types
   - Para uso no frontend

3. **Gera Types**
   - TypeScript types
   - Para type-safety no cliente

### Estrutura do Output

```
target/
├── deploy/
│   ├── duel_crowd_bets.so          # Programa compilado
│   └── duel_crowd_bets-keypair.json # Keypair do programa
├── idl/
│   └── duel_crowd_bets.json        # Interface Definition Language
└── types/
    └── duel_crowd_bets.ts          # TypeScript types
```

---

## 🔄 Workflow Completo

### Desenvolvimento Normal

```bash
# 1. Fazer mudanças no código
vim programs/duel_crowd_bets/src/lib.rs

# 2. Build
anchor build

# 3. Testar
anchor test

# 4. Se OK, commit
git add .
git commit -m "Add feature"

# 5. Deploy (opcional)
anchor deploy
```

### Ciclo de Debug

```bash
# Build com logs
RUST_LOG=debug anchor build

# Test com logs
RUST_LOG=debug anchor test

# Ver logs do programa
solana logs
```

---

## 📞 Status Check Commands

```bash
# Ver progresso do Anchor compilando
ps aux | grep "cargo install" | grep anchor

# Ver uso de CPU
top | grep cargo

# Ver espaço em disco
df -h ~/.cargo

# Memória disponível
free -h
```

---

## 🎯 Próximo Passo

**Quando Anchor terminar (~10 min):**

1. ✅ Verificar: `~/.cargo/bin/anchor --version`
2. ✅ Instalar Solana: Método 2 (download manual)
3. ✅ Build: `anchor build`
4. ✅ Test: `anchor test`
5. ✅ Deploy: `./scripts/deploy.sh`

**Vou monitorar o progresso e avisar quando estiver pronto! ⏳**
