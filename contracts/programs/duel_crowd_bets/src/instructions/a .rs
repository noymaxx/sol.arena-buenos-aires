use anchor_lang::prelude::*;
use crate::state::{Bet, BetStatus, Side};
use crate::errors::BetError;

#[derive(Accounts)]
pub struct WithdrawPrincipal<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

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

pub fn handler(ctx: Context<WithdrawPrincipal>) -> Result<()> {
    let bet = &ctx.accounts.bet;

    // Validações
    require!(
        bet.status == BetStatus::Resolved,
        BetError::BetNotResolved
    );

    let winner_side = bet.winner_side.ok_or(BetError::BetNotResolved)?;

    let expected_winner = match winner_side {
        Side::A => bet.user_a,
        Side::B => bet.user_b,
    };

    require!(
        ctx.accounts.winner.key() == expected_winner,
        BetError::InvalidWinner
    );

    // Calcular payout (2x o stake)
    let amount = bet.stake_lamports
        .checked_mul(2)
        .ok_or(BetError::ArithmeticOverflow)?;

    // Transfer do PDA para o vencedor
    let seeds = &[
        b"bet",
        bet.arbiter.as_ref(),
        bet.user_a.as_ref(),
        bet.user_b.as_ref(),
        &[bet.bump],
    ];
    let signer = &[&seeds[..]];

    **ctx.accounts.bet.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += amount;

    emit!(PrincipalWithdrawn {
        bet: ctx.accounts.bet.key(),
        winner: ctx.accounts.winner.key(),
        amount,
    });

    Ok(())
}

#[event]
pub struct PrincipalWithdrawn {
    pub bet: Pubkey,
    pub winner: Pubkey,
    pub amount: u64,
}
