use anchor_lang::prelude::*;
use crate::state::{Bet, BetStatus, Side};
use crate::errors::BetError;

#[derive(Accounts)]
pub struct DeclareWinner<'info> {
    pub arbiter: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"bet",
            bet.arbiter.as_ref(),
            bet.user_a.as_ref(),
            bet.user_b.as_ref(),
        ],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
}

pub fn handler(ctx: Context<DeclareWinner>, winner_side: Side) -> Result<()> {
    let bet = &mut ctx.accounts.bet;
    let clock = Clock::get()?;

    // Validações
    require!(
        ctx.accounts.arbiter.key() == bet.arbiter,
        BetError::InvalidArbiter
    );
    require!(bet.status == BetStatus::Open, BetError::BetNotOpen);
    require!(
        clock.unix_timestamp >= bet.resolve_ts,
        BetError::TooEarlyToResolve
    );
    require!(
        bet.user_a_deposited && bet.user_b_deposited,
        BetError::ParticipantsNotDeposited
    );

    // Declarar vencedor
    bet.winner_side = Some(winner_side);
    bet.status = BetStatus::Resolved;

    emit!(WinnerDeclared {
        bet: ctx.accounts.bet.key(),
        winner_side,
    });

    Ok(())
}

#[event]
pub struct WinnerDeclared {
    pub bet: Pubkey,
    pub winner_side: Side,
}
