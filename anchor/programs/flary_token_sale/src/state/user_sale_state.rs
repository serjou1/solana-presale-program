use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserSaleState {
    pub user: Pubkey,
    pub token_amount: u64,
}
