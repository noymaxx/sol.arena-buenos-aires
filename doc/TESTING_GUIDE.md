# 🧪 Guia Completo de Testes - DuelBets

## 📋 Status Atual

✅ Node.js instalado (v22.13.0)
✅ Solana CLI instalado (v3.0.10)
✅ Rust instalado (v1.91.1)
✅ Carteira Solana criada
✅ 1 SOL de teste recebido
✅ Dependências do projeto instaladas
⏳ Anchor v0.30.1 instalando...

---

## 🚀 Como Testar o Projeto

### Opção 1: Testes Completos (Recomendado)

```bash
# 1. Build do programa
anchor build

# 2. Rodar todos os testes
anchor test

# Isso vai:
# - Compilar o programa
# - Iniciar um validador local
# - Fazer deploy do programa
# - Executar todos os testes
# - Limpar o ambiente
```

### Opção 2: Testes Manuais (Passo a Passo)

#### Passo 1: Build
```bash
anchor build
```

**O que acontece:**
- Compila o programa Rust para BPF
- Gera o binário em `target/deploy/duel_crowd_bets.so`
- Gera o IDL em `target/idl/duel_crowd_bets.json`

**Verificar sucesso:**
```bash
ls -lh target/deploy/*.so
ls -lh target/idl/*.json
```

#### Passo 2: Iniciar Validador Local
```bash
# Em um terminal separado
solana-test-validator
```

**O que acontece:**
- Inicia um validador Solana local
- Roda na porta 8899
- Limpa ao reiniciar (--reset)

**Deixe rodando!** Abra outro terminal para os próximos comandos.

#### Passo 3: Deploy Local
```bash
# Em outro terminal
anchor deploy --provider.cluster localnet
```

**O que acontece:**
- Faz deploy do programa no validador local
- Retorna o Program ID

**Anote o Program ID!**

#### Passo 4: Rodar Testes
```bash
anchor test --skip-local-validator
```

**O que acontece:**
- Executa `tests/duel_crowd_bets.ts`
- Cria bets de teste
- Simula todo o fluxo
- Verifica payouts

---

## 🧪 Testes Incluídos

Nossa suite de testes cobre:

### 1. Criação de Bet ✅
```typescript
it("Creates a bet", async () => {
  // Testa criação com parâmetros válidos
  // Verifica campos inicializados corretamente
});
```

### 2. Depósito dos Participantes ✅
```typescript
it("User A deposits stake", async () => {
  // A deposita 1 SOL
});

it("User B deposits stake", async () => {
  // B deposita 1 SOL
});
```

### 3. Apostas da Torcida ✅
```typescript
it("Bettor1 supports side A", async () => {
  // Torcedor aposta 0.5 SOL em A
  // Verifica fee calculado
  // Verifica pools atualizados
});

it("Bettor2 supports side B", async () => {
  // Torcedor aposta 0.5 SOL em B
});
```

### 4. Declaração de Vencedor ✅
```typescript
it("Arbiter declares winner (Side A)", async () => {
  // Árbitro declara A como vencedor
  // Verifica status mudou para Resolved
});
```

### 5. Saque do Vencedor ✅
```typescript
it("Winner (User A) withdraws principal", async () => {
  // A saca 2 SOL (2x stake)
  // Verifica saldo aumentou
});
```

### 6. Reivindicação da Torcida ✅
```typescript
it("Winning bettor (Bettor1) claims support reward", async () => {
  // Bettor1 que apostou em A reclama recompensa
  // Verifica payout proporcional
  // Verifica flag claimed = true
});
```

### 7. Distribuição de Fees ✅
```typescript
it("Withdraws spread fees", async () => {
  // Distribui fees para:
  // - User A (criador)
  // - User B (criador)
  // - Arbiter
  // - Protocol treasury
});
```

---

## 📊 Output Esperado

Quando os testes rodarem com sucesso, você verá:

```
  duel_crowd_bets
    ✔ Creates a bet (234ms)
    ✔ User A deposits stake (567ms)
    ✔ User B deposits stake (432ms)
    ✔ Bettor1 supports side A (678ms)
    ✔ Bettor2 supports side B (543ms)
    ✔ Arbiter declares winner (Side A) (456ms)
    ✔ Winner (User A) withdraws principal (789ms)
    ✔ Winning bettor (Bettor1) claims support reward (654ms)
    ✔ Withdraws spread fees (432ms)

  8 passing (4s)
```

---

## 🐛 Troubleshooting

### Erro: "Transaction simulation failed"

**Possíveis causas:**
1. Validador não está rodando
2. Saldo insuficiente
3. Deadlines já passaram

**Solução:**
```bash
# Reiniciar validador
pkill solana-test-validator
solana-test-validator --reset

# Verificar saldo
solana balance

# Rodar testes novamente
anchor test
```

### Erro: "Account does not exist"

**Causa:** Program não foi deployed.

**Solução:**
```bash
anchor deploy
```

### Erro: "Anchor version mismatch"

**Solução:**
Aguardar instalação do Anchor v0.30.1 ou atualizar Anchor.toml:

```toml
[toolchain]
anchor_version = "0.30.1"
```

### Testes lentos

**Solução:**
```bash
# Usar validador local ao invés de devnet
anchor test
# Já usa local por padrão!
```

---

## 🎯 Teste Rápido (30 segundos)

```bash
# Tudo de uma vez
anchor test

# Apenas build
anchor build

# Apenas deploy (validador deve estar rodando)
anchor deploy
```

---

## 🔍 Verificar Resultado dos Testes

### Ver logs detalhados
```bash
RUST_LOG=debug anchor test
```

### Ver apenas sumário
```bash
anchor test 2>&1 | grep "passing\|failing"
```

### Salvar logs
```bash
anchor test > test-results.log 2>&1
```

---

## 📦 Testar Apenas o Build

Se quiser apenas verificar se compila:

```bash
# Build do programa
anchor build

# Verificar arquivos gerados
ls -lh target/deploy/
ls -lh target/idl/

# Ver tamanho do programa
du -h target/deploy/duel_crowd_bets.so
```

**Tamanho esperado:** ~50-100KB

---

## 🚀 Próximos Passos Após Testes Passarem

1. **Deploy no Devnet:**
   ```bash
   ./scripts/deploy.sh
   # Escolha opção 1 (Devnet)
   ```

2. **Rodar Frontend:**
   ```bash
   cd app
   npm install
   npm run dev
   # Abra http://localhost:3000
   ```

3. **Testar com UI:**
   - Conectar wallet (Phantom)
   - Criar uma bet de teste
   - Depositar stakes
   - Apostar como torcida
   - Resolver e sacar

---

## ✅ Checklist de Testes

- [ ] `anchor build` completa sem erros
- [ ] `anchor test` todos os 8 testes passam
- [ ] Programa < 200KB
- [ ] IDL gerado corretamente
- [ ] Todos os eventos emitidos
- [ ] Cálculos de fee corretos
- [ ] Payouts proporcionais corretos

---

## 🆘 Precisa de Ajuda?

1. **Ver este guia:** `cat TESTING_GUIDE.md`
2. **Ver troubleshooting completo:** `cat docs/TROUBLESHOOTING.md`
3. **Ver logs:** `anchor test --verbose`
4. **Verificar configuração:** `anchor --version && solana config get`

---

**Testes garantem que tudo está funcionando antes do deploy! 🧪**
