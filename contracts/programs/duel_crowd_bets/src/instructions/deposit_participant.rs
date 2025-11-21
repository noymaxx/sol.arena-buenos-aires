use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Bet, BetStatus};
use crate::errors::BetError;

#[derive(Accounts)]
pub struct DepositParticipant<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,

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

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DepositParticipant>) -> Result<()> {
    let clock = Clock::get()?;

    // Validate and mark deposit
    let stake_lamports;
    let bet_key;
    {
        let bet = &mut ctx.accounts.bet;

        require!(bet.status == BetStatus::Open, BetError::BetNotOpen);
        require!(
            clock.unix_timestamp < bet.deadline_duel,
            BetError::DeadlinePassed
        );

        let participant_key = ctx.accounts.participant.key();
        let is_user_a = participant_key == bet.user_a;
        let is_user_b = participant_key == bet.user_b;

        require!(
            is_user_a || is_user_b,
            BetError::InvalidParticipant
        );

        if is_user_a {
            require!(!bet.user_a_deposited, BetError::AlreadyDeposited);
            bet.user_a_deposited = true;
        } else {
            require!(!bet.user_b_deposited, BetError::AlreadyDeposited);
            bet.user_b_deposited = true;
        }

        stake_lamports = bet.stake_lamports;
        bet_key = bet.key();
    }

    // Transfer stake to bet PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.participant.to_account_info(),
                to: ctx.accounts.bet.to_account_info(),
            },
        ),
        stake_lamports,
    )?;

    emit!(ParticipantDeposited {
        bet: bet_key,
        participant: ctx.accounts.participant.key(),
        amount: stake_lamports,
    });

    Ok(())
}

#[event]
pub struct ParticipantDeposited {
    pub bet: Pubkey,
    pub participant: Pubkey,
    pub amount: u64,
}
