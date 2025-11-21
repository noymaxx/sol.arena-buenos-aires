#!/bin/bash

# 🎯 Script de Setup Completo - Melhor Solução
# Instala e configura tudo necessário para rodar o projeto

set -e

echo "🚀 DuelBets - Setup Completo"
echo "============================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar Rust
echo "1️⃣  Verificando Rust..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    log_info "Rust instalado: $RUST_VERSION"
else
    log_error "Rust não instalado. Instale com:"
    echo "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# 2. Verificar Node.js
echo ""
echo "2️⃣  Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_info "Node.js instalado: $NODE_VERSION"
else
    log_error "Node.js não instalado"
    exit 1
fi

# 3. Verificar/Instalar Anchor
echo ""
echo "3️⃣  Verificando Anchor..."
if [ -f "$HOME/.cargo/bin/anchor" ]; then
    ANCHOR_VERSION=$($HOME/.cargo/bin/anchor --version 2>&1 || echo "Instalando...")
    log_info "Anchor: $ANCHOR_VERSION"
else
    log_warn "Anchor não encontrado em ~/.cargo/bin/anchor"
    echo "   Verificando instalação em progresso..."

    if ps aux | grep -q "[c]argo install.*anchor"; then
        log_info "Anchor está compilando em background"
        echo "   Aguarde aproximadamente 5-10 minutos..."
    else
        echo "   Iniciando instalação do Anchor 0.30.1..."
        cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli --locked --force &
        log_info "Instalação iniciada em background"
    fi
fi

# 4. Instalar/Verificar Solana
echo ""
echo "4️⃣  Instalando Solana..."

# Criar diretório se não existir
mkdir -p $HOME/.local/share/solana/install

# Download e instalação manual
SOLANA_VERSION="1.18.24"
SOLANA_DIR="$HOME/.local/share/solana"

if [ ! -f "$SOLANA_DIR/install/active_release/bin/solana" ]; then
    echo "   Baixando Solana $SOLANA_VERSION..."

    # Tentar diferentes métodos
    if wget -q https://github.com/solana-labs/solana/releases/download/v${SOLANA_VERSION}/solana-release-x86_64-unknown-linux-gnu.tar.bz2 -O /tmp/solana.tar.bz2 2>/dev/null; then
        log_info "Download via wget concluído"
    elif curl -L https://github.com/solana-labs/solana/releases/download/v${SOLANA_VERSION}/solana-release-x86_64-unknown-linux-gnu.tar.bz2 -o /tmp/solana.tar.bz2 2>/dev/null; then
        log_info "Download via curl concluído"
    else
        log_error "Não foi possível baixar Solana"
        echo "   Tente manualmente:"
        echo "   wget https://github.com/solana-labs/solana/releases/download/v${SOLANA_VERSION}/solana-release-x86_64-unknown-linux-gnu.tar.bz2"
        exit 1
    fi

    # Extrair
    echo "   Extraindo..."
    cd /tmp
    tar jxf solana.tar.bz2

    # Instalar
    echo "   Instalando..."
    ./solana-release/install update $SOLANA_VERSION

    # Limpar
    rm -rf /tmp/solana.tar.bz2 /tmp/solana-release

    log_info "Solana $SOLANA_VERSION instalado"
else
    log_info "Solana já instalado"
fi

# 5. Configurar PATH
echo ""
echo "5️⃣  Configurando PATH..."

# Adicionar ao bashrc se não existir
if ! grep -q ".cargo/bin" ~/.bashrc; then
    echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
    log_info "Cargo bin adicionado ao PATH"
fi

if ! grep -q "solana/install" ~/.bashrc; then
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    log_info "Solana adicionado ao PATH"
fi

# Aplicar PATH na sessão atual
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 6. Configurar Solana
echo ""
echo "6️⃣  Configurando Solana..."

if command -v solana &> /dev/null; then
    solana config set --url devnet
    log_info "Solana configurado para devnet"

    # Verificar carteira
    if solana address &> /dev/null; then
        WALLET=$(solana address)
        log_info "Carteira: $WALLET"

        BALANCE=$(solana balance 2>&1 || echo "0 SOL")
        echo "   Saldo: $BALANCE"
    fi
else
    log_warn "Solana CLI não disponível ainda no PATH"
    echo "   Execute: source ~/.bashrc"
fi

# 7. Resumo
echo ""
echo "📊 RESUMO DO SETUP"
echo "==================="
echo ""

echo "✅ Componentes Instalados:"
rustc --version 2>/dev/null && echo "  - Rust: $(rustc --version)"
node --version 2>/dev/null && echo "  - Node.js: $(node --version)"

if [ -f "$HOME/.cargo/bin/anchor" ]; then
    $HOME/.cargo/bin/anchor --version 2>/dev/null && echo "  - Anchor: $($HOME/.cargo/bin/anchor --version 2>&1 | head -1)"
else
    echo "  - Anchor: Instalando em background..."
fi

if command -v solana &> /dev/null; then
    solana --version 2>/dev/null && echo "  - Solana: $(solana --version | head -1)"
else
    echo "  - Solana: Execute 'source ~/.bashrc' e tente novamente"
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS"
echo "=================="
echo ""
echo "1. Recarregar shell:"
echo "   source ~/.bashrc"
echo ""
echo "2. Verificar instalações:"
echo "   anchor --version"
echo "   solana --version"
echo ""
echo "3. Build do projeto:"
echo "   anchor build"
echo ""
echo "4. Rodar testes:"
echo "   anchor test"
echo ""
echo "5. Deploy:"
echo "   ./scripts/deploy.sh"
echo ""

log_info "Setup concluído!"
echo ""
echo "⏳ Se Anchor ainda estiver compilando, aguarde ~10 minutos e execute:"
echo "   source ~/.bashrc && anchor --version"
