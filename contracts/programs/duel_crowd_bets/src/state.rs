use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetStatus {
    Open,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    A,
    B,
}

#[account]
pub struct Bet {
    // Identidades principais
    pub user_a: Pubkey,
    pub user_b: Pubkey,
    pub arbiter: Pubkey,

    // Stake do duelo principal
    pub stake_lamports: u64,
    pub user_a_deposited: bool,
    pub user_b_deposited: bool,

    // Tempo
    pub deadline_duel: i64,     // até quando A e B podem depositar
    pub deadline_crowd: i64,    // até quando torcida pode entrar
    pub resolve_ts: i64,        // a partir de quando o árbitro pode resolver

    // Pools da torcida (valores líquidos, após fee)
    pub net_support_a: u64,     // soma de net apostado no lado A
    pub net_support_b: u64,     // soma de net apostado no lado B

    // Pools de fee (spread) acumulado
    pub spread_pool_creators: u64,   // fee destinado a A+B
    pub spread_pool_arbiter: u64,    // fee destinado ao árbitro
    pub spread_pool_protocol: u64,   // fee destinado ao protocolo

    // Configuração de fee (basis points, 10000 = 100%)
    pub spread_bps: u16,             // ex: 200 = 2%
    pub creator_share_bps: u16,      // ex: 5000 = 50% do fee
    pub arbiter_share_bps: u16,      // ex: 2000 = 20%
    pub protocol_share_bps: u16,     // ex: 3000 = 30%

    // Status
    pub status: BetStatus,
    pub winner_side: Option<Side>,

    // Metadados
    pub protocol_treasury: Pubkey,

    pub bump: u8,
}

impl Bet {
    pub const LEN: usize = 8 + // discriminator
        32 + // user_a
        32 + // user_b
        32 + // arbiter
        8 +  // stake_lamports
        1 +  // user_a_deposited
        1 +  // user_b_deposited
        8 +  // deadline_duel
        8 +  // deadline_crowd
        8 +  // resolve_ts
        8 +  // net_support_a
        8 +  // net_support_b
        8 +  // spread_pool_creators
        8 +  // spread_pool_arbiter
        8 +  // spread_pool_protocol
        2 +  // spread_bps
        2 +  // creator_share_bps
        2 +  // arbiter_share_bps
        2 +  // protocol_share_bps
        1 +  // status enum
        1 + 1 + // winner_side (Option<Side>)
        32 + // protocol_treasury
        1;   // bump
}

#[account]
pub struct SupportPosition {
    pub bet: Pubkey,        // referência ao Bet
    pub bettor: Pubkey,     // usuário que apostou
    pub side: Side,         // A ou B

    pub net_amount: u64,    // valor líquido (após fee) apostado por ele
    pub claimed: bool,      // se já sacou ou não

    pub bump: u8,
}

impl SupportPosition {
    pub const LEN: usize = 8 + // discriminator
        32 + // bet
        32 + // bettor
        1 +  // side
        8 +  // net_amount
        1 +  // claimed
        1;   // bump
}
