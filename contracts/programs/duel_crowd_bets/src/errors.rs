use anchor_lang::prelude::*;

#[error_code]
pub enum BetError {
    #[msg("Invalid stake amount")]
    InvalidStakeAmount,

    #[msg("Invalid deadlines")]
    InvalidDeadlines,

    #[msg("Invalid fee configuration")]
    InvalidFeeConfig,

    #[msg("Deadline has passed")]
    DeadlinePassed,

    #[msg("Bet is not open")]
    BetNotOpen,

    #[msg("User already deposited")]
    AlreadyDeposited,

    #[msg("Participants must deposit first")]
    ParticipantsNotDeposited,

    #[msg("Invalid participant")]
    InvalidParticipant,

    #[msg("Too early to resolve")]
    TooEarlyToResolve,

    #[msg("Bet is not resolved")]
    BetNotResolved,

    #[msg("Invalid winner")]
    InvalidWinner,

    #[msg("Support position already claimed")]
    AlreadyClaimed,

    #[msg("Wrong side")]
    WrongSide,

    #[msg("Invalid arbiter")]
    InvalidArbiter,

    #[msg("Amount too small")]
    AmountTooSmall,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Invalid support position")]
    InvalidSupportPosition,
}
