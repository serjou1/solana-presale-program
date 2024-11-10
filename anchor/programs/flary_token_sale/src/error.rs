use anchor_lang::prelude::*;

#[error_code]
pub enum SaleError {
    #[msg("Access denied")]
    AccessDenied,
    #[msg("Sale is paused")]
    SaleIsPaused,
    #[msg("Invalid Price Feed")]
    InvalidPriceFeed,
}
