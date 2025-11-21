use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Bet, BetStatus, Side, SupportPosition};
use crate::errors::BetError;

#[derive(Accounts)]
#[instruction(side: Side)]
pub struct SupportBet<'info> {
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
        init_if_needed,
        payer = bettor,
        space = SupportPosition::LEN,
        seeds = [
            b"support",
            bet.key().as_ref(),
            bettor.key().as_ref(),
            &[match side {
                Side::A => 0,
                Side::B => 1,
            }],
        ],
        bump
    )]
    pub support_position: Account<'info, SupportPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SupportBet>, side: Side, amount: u64) -> Result<()> {
    let clock = Clock::get()?;

    // Read-only validations
    {
        let bet = &ctx.accounts.bet;
        require!(bet.status == BetStatus::Open, BetError::BetNotOpen);
        require!(
            bet.user_a_deposited && bet.user_b_deposited,
            BetError::ParticipantsNotDeposited
        );
        require!(
            clock.unix_timestamp < bet.deadline_crowd,
            BetError::DeadlinePassed
        );
    }
    require!(amount > 0, BetError::AmountTooSmall);

    // Calcular fees (using immutable bet reference)
    let fee_total = amount
        .checked_mul(ctx.accounts.bet.spread_bps as u64)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(BetError::ArithmeticOverflow)?;

    let net = amount
        .checked_sub(fee_total)
        .ok_or(BetError::ArithmeticOverflow)?;

    let fee_creators = fee_total
        .checked_mul(ctx.accounts.bet.creator_share_bps as u64)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(BetError::ArithmeticOverflow)?;

    let fee_arbiter = fee_total
        .checked_mul(ctx.accounts.bet.arbiter_share_bps as u64)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(BetError::ArithmeticOverflow)?;

    let fee_protocol = fee_total
        .checked_mul(ctx.accounts.bet.protocol_share_bps as u64)
        .and_then(|v| v.checked_div(10_000))
        .ok_or(BetError::ArithmeticOverflow)?;

    // Transfer amount to bet PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.bet.to_account_info(),
            },
        ),
        amount,
    )?;

    // Mutate pools after transfer
    let bet = &mut ctx.accounts.bet;

    // Atualizar pools
    match side {
        Side::A => {
            bet.net_support_a = bet.net_support_a
                .checked_add(net)
                .ok_or(BetError::ArithmeticOverflow)?;
        }
        Side::B => {
            bet.net_support_b = bet.net_support_b
                .checked_add(net)
                .ok_or(BetError::ArithmeticOverflow)?;
        }
    }

    bet.spread_pool_creators = bet.spread_pool_creators
        .checked_add(fee_creators)
        .ok_or(BetError::ArithmeticOverflow)?;

    bet.spread_pool_arbiter = bet.spread_pool_arbiter
        .checked_add(fee_arbiter)
        .ok_or(BetError::ArithmeticOverflow)?;

    bet.spread_pool_protocol = bet.spread_pool_protocol
        .checked_add(fee_protocol)
        .ok_or(BetError::ArithmeticOverflow)?;

    // Atualizar ou inicializar SupportPosition
    let support_position = &mut ctx.accounts.support_position;
    if support_position.net_amount == 0 {
        // Nova posição
        support_position.bet = ctx.accounts.bet.key();
        support_position.bettor = ctx.accounts.bettor.key();
        support_position.side = side;
        support_position.net_amount = net;
        support_position.claimed = false;
        support_position.bump = ctx.bumps.support_position;
    } else {
        // Acumular na posição existente
        support_position.net_amount = support_position.net_amount
            .checked_add(net)
            .ok_or(BetError::ArithmeticOverflow)?;
    }

    emit!(BetSupported {
        bet: ctx.accounts.bet.key(),
        bettor: ctx.accounts.bettor.key(),
        side,
        amount,
        net_amount: net,
    });

    Ok(())
}

#[event]
pub struct BetSupported {
    pub bet: Pubkey,
    pub bettor: Pubkey,
    pub side: Side,
    pub amount: u64,
    pub net_amount: u64,
}
