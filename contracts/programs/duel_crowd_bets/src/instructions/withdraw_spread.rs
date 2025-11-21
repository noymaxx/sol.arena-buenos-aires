use anchor_lang::prelude::*;
use crate::state::{Bet, BetStatus};
use crate::errors::BetError;

#[derive(Accounts)]
pub struct WithdrawSpread<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

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

    /// CHECK: User A receiving fee share
    #[account(mut)]
    pub user_a: UncheckedAccount<'info>,

    /// CHECK: User B receiving fee share
    #[account(mut)]
    pub user_b: UncheckedAccount<'info>,

    /// CHECK: Arbiter receiving fee share
    #[account(mut)]
    pub arbiter: UncheckedAccount<'info>,

    /// CHECK: Protocol treasury receiving fee share
    #[account(mut)]
    pub protocol_treasury: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<WithdrawSpread>) -> Result<()> {
    // Validations
    require!(
        ctx.accounts.bet.status == BetStatus::Resolved,
        BetError::BetNotResolved
    );

    // Snapshot values immutably
    let spread_creators = ctx.accounts.bet.spread_pool_creators;
    let fee_a = spread_creators / 2;
    let fee_b = spread_creators - fee_a;
    let fee_arbiter = ctx.accounts.bet.spread_pool_arbiter;
    let fee_protocol = ctx.accounts.bet.spread_pool_protocol;

    let total_spread = spread_creators
        .checked_add(fee_arbiter)
        .and_then(|v| v.checked_add(fee_protocol))
        .ok_or(BetError::ArithmeticOverflow)?;

    if total_spread == 0 {
        return Ok(());
    }

    // Perform transfers
    {
        let mut bet_info = ctx.accounts.bet.to_account_info();

        if fee_a > 0 {
            **bet_info.try_borrow_mut_lamports()? -= fee_a;
            **ctx.accounts.user_a.to_account_info().try_borrow_mut_lamports()? += fee_a;
        }

        if fee_b > 0 {
            **bet_info.try_borrow_mut_lamports()? -= fee_b;
            **ctx.accounts.user_b.to_account_info().try_borrow_mut_lamports()? += fee_b;
        }

        if fee_arbiter > 0 {
            **bet_info.try_borrow_mut_lamports()? -= fee_arbiter;
            **ctx.accounts.arbiter.to_account_info().try_borrow_mut_lamports()? += fee_arbiter;
        }

        if fee_protocol > 0 {
            **bet_info.try_borrow_mut_lamports()? -= fee_protocol;
            **ctx.accounts.protocol_treasury.to_account_info().try_borrow_mut_lamports()? += fee_protocol;
        }
    }

    // Zero pools after transfers
    let bet = &mut ctx.accounts.bet;
    bet.spread_pool_creators = 0;
    bet.spread_pool_arbiter = 0;
    bet.spread_pool_protocol = 0;

    emit!(SpreadWithdrawn {
        bet: ctx.accounts.bet.key(),
        fee_a,
        fee_b,
        fee_arbiter,
        fee_protocol,
    });

    Ok(())
}

#[event]
pub struct SpreadWithdrawn {
    pub bet: Pubkey,
    pub fee_a: u64,
    pub fee_b: u64,
    pub fee_arbiter: u64,
    pub fee_protocol: u64,
}
