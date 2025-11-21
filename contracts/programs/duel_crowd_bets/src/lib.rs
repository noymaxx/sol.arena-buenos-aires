use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use instructions::*;
use state::Side;

declare_id!("5iRExHjkQzwidM7EwCu8eVpeBAPnJ8qVuHi3y7gZbaeX");

#[program]
pub mod duel_crowd_bets {
    use super::*;

    pub fn create_bet(
        ctx: Context<CreateBet>,
        user_a: Pubkey,
        user_b: Pubkey,
        arbiter: Pubkey,
        stake_lamports: u64,
        deadline_duel: i64,
        deadline_crowd: i64,
        resolve_ts: i64,
        spread_bps: u16,
        creator_share_bps: u16,
        arbiter_share_bps: u16,
        protocol_share_bps: u16,
    ) -> Result<()> {
        instructions::create_bet::handler(
            ctx,
            user_a,
            user_b,
            arbiter,
            stake_lamports,
            deadline_duel,
            deadline_crowd,
            resolve_ts,
            spread_bps,
            creator_share_bps,
            arbiter_share_bps,
            protocol_share_bps,
        )
    }

    pub fn deposit_participant(ctx: Context<DepositParticipant>) -> Result<()> {
        instructions::deposit_participant::handler(ctx)
    }

    pub fn support_bet(ctx: Context<SupportBet>, side: Side, amount: u64) -> Result<()> {
        instructions::support_bet::handler(ctx, side, amount)
    }

    pub fn declare_winner(ctx: Context<DeclareWinner>, winner_side: Side) -> Result<()> {
        instructions::declare_winner::handler(ctx, winner_side)
    }

    pub fn withdraw_principal(ctx: Context<WithdrawPrincipal>) -> Result<()> {
        instructions::withdraw_principal::handler(ctx)
    }

    pub fn claim_support(ctx: Context<ClaimSupport>) -> Result<()> {
        instructions::claim_support::handler(ctx)
    }

    pub fn withdraw_spread(ctx: Context<WithdrawSpread>) -> Result<()> {
        instructions::withdraw_spread::handler(ctx)
    }
}
