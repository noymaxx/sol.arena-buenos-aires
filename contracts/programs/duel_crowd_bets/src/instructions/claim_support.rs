use anchor_lang::prelude::*;
use crate::state::{Bet, BetStatus, SupportPosition};
use crate::errors::BetError;

#[derive(Accounts)]
pub struct ClaimSupport<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

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

    #[account(
        mut,
        seeds = [
            b"support",
            bet.key().as_ref(),
            bettor.key().as_ref(),
            &[match support_position.side {
                crate::state::Side::A => 0,
                crate::state::Side::B => 1,
            }],
        ],
        bump = support_position.bump
    )]
    pub support_position: Account<'info, SupportPosition>,
}

pub fn handler(ctx: Context<ClaimSupport>) -> Result<()> {
    let bet = &ctx.accounts.bet;
    let support_position = &mut ctx.accounts.support_position;

    // Validações
    require!(
        bet.status == BetStatus::Resolved,
        BetError::BetNotResolved
    );
    require!(!support_position.claimed, BetError::AlreadyClaimed);
    require!(
        support_position.bet == ctx.accounts.bet.key(),
        BetError::InvalidSupportPosition
    );
    require!(
        support_position.bettor == ctx.accounts.bettor.key(),
        BetError::InvalidSupportPosition
    );

    let winner_side = bet.winner_side.ok_or(BetError::BetNotResolved)?;

    // Se apostou no lado perdedor, apenas marcar como claimed
    if support_position.side != winner_side {
        support_position.claimed = true;

        emit!(SupportClaimed {
            bet: ctx.accounts.bet.key(),
            bettor: ctx.accounts.bettor.key(),
            payout: 0,
        });

        return Ok(());
    }

    // Apostou no lado vencedor - calcular payout
    let (s_win, s_lose) = match winner_side {
        crate::state::Side::A => (bet.net_support_a, bet.net_support_b),
        crate::state::Side::B => (bet.net_support_b, bet.net_support_a),
    };

    let torcida_pool = s_win
        .checked_add(s_lose)
        .ok_or(BetError::ArithmeticOverflow)?;

    // payout = user_net_amount * torcida_pool / s_win
    let payout = if s_win > 0 {
        (support_position.net_amount as u128)
            .checked_mul(torcida_pool as u128)
            .and_then(|v| v.checked_div(s_win as u128))
            .and_then(|v| u64::try_from(v).ok())
            .ok_or(BetError::ArithmeticOverflow)?
    } else {
        0
    };

    if payout > 0 {
        // Transfer do PDA para o bettor
        **ctx.accounts.bet.to_account_info().try_borrow_mut_lamports()? -= payout;
        **ctx.accounts.bettor.to_account_info().try_borrow_mut_lamports()? += payout;
    }

    support_position.claimed = true;

    emit!(SupportClaimed {
        bet: ctx.accounts.bet.key(),
        bettor: ctx.accounts.bettor.key(),
        payout,
    });

    Ok(())
}

#[event]
pub struct SupportClaimed {
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub payout: u64,
}
