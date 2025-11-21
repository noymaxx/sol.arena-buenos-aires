use anchor_lang::prelude::*;
use crate::state::{Bet, BetStatus};
use crate::errors::BetError;

#[derive(Accounts)]
#[instruction(user_a: Pubkey, user_b: Pubkey, arbiter: Pubkey)]
pub struct CreateBet<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = Bet::LEN,
        seeds = [
            b"bet",
            arbiter.as_ref(),
            user_a.as_ref(),
            user_b.as_ref(),
        ],
        bump
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: Protocol treasury address
    pub protocol_treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
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
    // Validações
    require!(stake_lamports > 0, BetError::InvalidStakeAmount);
    require!(
        deadline_duel < deadline_crowd, 
        BetError::InvalidDeadlines
    );
    require!(
        resolve_ts >= deadline_crowd,
        BetError::InvalidDeadlines
    );
    require!(spread_bps > 0, BetError::InvalidFeeConfig);
    require!(
        creator_share_bps
            .checked_add(arbiter_share_bps)
            .and_then(|sum| sum.checked_add(protocol_share_bps))
            == Some(10_000),
        BetError::InvalidFeeConfig
    );

    let bet = &mut ctx.accounts.bet;
    bet.user_a = user_a;
    bet.user_b = user_b;
    bet.arbiter = arbiter;
    bet.stake_lamports = stake_lamports;
    bet.user_a_deposited = false;
    bet.user_b_deposited = false;
    bet.deadline_duel = deadline_duel;
    bet.deadline_crowd = deadline_crowd;
    bet.resolve_ts = resolve_ts;
    bet.net_support_a = 0;
    bet.net_support_b = 0;
    bet.spread_pool_creators = 0;
    bet.spread_pool_arbiter = 0;
    bet.spread_pool_protocol = 0;
    bet.spread_bps = spread_bps;
    bet.creator_share_bps = creator_share_bps;
    bet.arbiter_share_bps = arbiter_share_bps;
    bet.protocol_share_bps = protocol_share_bps;
    bet.status = BetStatus::Open;
    bet.winner_side = None;
    bet.protocol_treasury = ctx.accounts.protocol_treasury.key();
    bet.bump = ctx.bumps.bet;

    emit!(BetCreated {
        bet: ctx.accounts.bet.key(),
        user_a,
        user_b,
        arbiter,
        stake_lamports,
    });

    Ok(())
}

#[event]
pub struct BetCreated {
    pub bet: Pubkey,
    pub user_a: Pubkey,
    pub user_b: Pubkey,
    pub arbiter: Pubkey,
    pub stake_lamports: u64,
}
